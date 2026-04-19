import Link from "next/link";
import { ArrowUpRight, Building2, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CASES, ENTITIES, SANCTIONS } from "@/lib/data/fixtures";

export const metadata = { title: "Entities" };
export const dynamic = "force-dynamic";

function linkedCaseIds(entityId: string): string[] {
  return CASES.filter((c) => c.subject_entity_id === entityId).map((c) => c.id);
}

function entitySanctions(entityId: string, ownerNames: string[]): number {
  const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "-");
  const entity = SANCTIONS[entityId]?.length ?? 0;
  const ownerHits = ownerNames.reduce((n, name) => n + (SANCTIONS[slug(name)]?.length ?? 0), 0);
  return entity + ownerHits;
}

export default function EntitiesPage() {
  const entities = Object.values(ENTITIES).sort(
    (a, b) => b.isolation_forest_score - a.isolation_forest_score,
  );

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <PageHeader
        eyebrow="Subject registry"
        title="Entities"
        description={`${entities.length} resolved subjects · sorted by isolation-forest anomaly score.`}
      />

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        {entities.map((e) => {
          const linkedCases = linkedCaseIds(e.entity_id);
          const sanctionsHits = entitySanctions(
            e.entity_id,
            e.beneficial_owners.map((o) => o.name),
          );
          return (
            <Card key={e.entity_id} className="transition-colors hover:border-border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {e.jurisdiction} · {e.entity_type}
                      </span>
                    </div>
                    <h2 className="mt-1.5 truncate text-base font-semibold tracking-tight">
                      {e.legal_name}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{e.business_description}</p>
                  </div>
                  <Link
                    href={`/entity/${e.entity_id}`}
                    className="flex shrink-0 items-center gap-1 rounded-md border border-border/60 bg-card/50 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Profile <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <MiniFact label="Anomaly" value={e.isolation_forest_score.toFixed(2)} />
                  <MiniFact label="Filings" value={String(e.annual_filings)} />
                  <MiniFact
                    label="Incorp."
                    value={e.incorporation_date.slice(0, 7)}
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  {e.risk_flags.map((f) => (
                    <Badge key={f} variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
                      {f.replaceAll("_", " ")}
                    </Badge>
                  ))}
                  {sanctionsHits > 0 && (
                    <Badge variant="outline" className="gap-1.5 border-risk-critical/40 font-mono text-[10px] uppercase tracking-wider text-risk-critical">
                      <ShieldAlert className="h-2.5 w-2.5" /> {sanctionsHits} sanctions hit{sanctionsHits > 1 ? "s" : ""}
                    </Badge>
                  )}
                  {linkedCases.length > 0 && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      · linked to {linkedCases.join(", ")}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
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
