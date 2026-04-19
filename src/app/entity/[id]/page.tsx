import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Building2, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CASES, ENTITIES, SANCTIONS } from "@/lib/data/fixtures";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/entity/[id]">) {
  const { id } = await props.params;
  const e = ENTITIES[id];
  return { title: e ? e.legal_name : `Entity ${id}` };
}

export default async function EntityDetailPage(props: PageProps<"/entity/[id]">) {
  const { id } = await props.params;
  const entity = ENTITIES[id];
  if (!entity) notFound();

  const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "-");
  const entitySanctions = SANCTIONS[entity.entity_id] ?? [];
  const ownerSanctions = entity.beneficial_owners.flatMap((o) =>
    (SANCTIONS[slug(o.name)] ?? []).map((h) => ({ ...h, subject: o.name })),
  );
  const allSanctions = [...entitySanctions, ...ownerSanctions];
  const linkedCases = CASES.filter((c) => c.subject_entity_id === entity.entity_id);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <PageHeader
        eyebrow={`Entity · ${entity.jurisdiction}`}
        title={entity.legal_name}
        description={`${entity.entity_type} · incorporated ${entity.incorporation_date} · ${entity.beneficial_owners.length} UBO${entity.beneficial_owners.length === 1 ? "" : "s"}`}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Business profile
              </span>
            </div>
            <p className="mt-3 text-sm text-foreground/85">{entity.business_description}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <MiniFact label="Anomaly" value={entity.isolation_forest_score.toFixed(2)} />
              <MiniFact label="Filings" value={String(entity.annual_filings)} />
              <MiniFact label="UBOs" value={String(entity.beneficial_owners.length)} />
              <MiniFact label="Jurisdiction" value={entity.jurisdiction} />
            </div>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {entity.risk_flags.map((f) => (
                <Badge key={f} variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
                  {f.replaceAll("_", " ")}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Beneficial owners
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {entity.beneficial_owners.map((o) => (
                <li key={o.name} className="flex items-center justify-between gap-2 border-b border-border/40 pb-2 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{o.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {o.residence} · {o.pep ? "PEP" : "non-PEP"}
                    </div>
                  </div>
                  <span className="font-mono text-[11px] tabular-nums text-foreground/80">
                    {(o.ownership * 100).toFixed(0)}%
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {allSanctions.length > 0 && (
        <Card className="mt-4 border-risk-critical/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5 text-risk-critical" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-risk-critical">
                Sanctions screening — {allSanctions.length} hit{allSanctions.length > 1 ? "s" : ""}
              </span>
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {allSanctions.map((h, i) => (
                <li key={i} className="flex items-center justify-between gap-3">
                  <span className="truncate">
                    <span className="font-medium">{h.subject}</span>
                    <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                      {h.list} · {h.matched_on}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-foreground">
                    {h.match_score.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {linkedCases.length > 0 && (
        <Card className="mt-4">
          <CardContent className="p-5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Linked cases
            </div>
            <ul className="mt-3 space-y-1.5">
              {linkedCases.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/case/${c.id}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-border/40 bg-card/30 px-3 py-2 text-sm hover:border-border hover:bg-card/60"
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground">{c.id}</span>
                      <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
                        {c.typology_label}
                      </Badge>
                      <span className="truncate text-foreground/85">{c.summary}</span>
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/50 bg-card/40 p-2.5">
      <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}
