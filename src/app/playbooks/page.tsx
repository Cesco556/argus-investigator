import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TYPOLOGY_PLAYBOOKS } from "@/lib/data/fixtures";

export const metadata = { title: "Typology playbooks" };
export const dynamic = "force-dynamic";

export default function PlaybooksPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <PageHeader
        eyebrow="FATF reference"
        title="Typology playbooks"
        description={`${TYPOLOGY_PLAYBOOKS.length} playbooks — these power the agent's search_typology_playbook MCP tool.`}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {TYPOLOGY_PLAYBOOKS.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {p.id}
                  </div>
                  <h2 className="mt-1 text-base font-semibold tracking-tight">{p.name}</h2>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
                  FATF
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>

              <div className="mt-4">
                <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  Red flags
                </div>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {p.red_flags.map((f, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-risk-medium" />
                      <span className="text-foreground/85">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 border-t border-border/60 pt-3 font-mono text-[10px] text-muted-foreground">
                {p.fatf_reference}
              </div>

              {p.sar_narrative_template && (
                <div className="mt-3 rounded-md border border-border/50 bg-card/40 p-3">
                  <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    SAR narrative template
                  </div>
                  <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-foreground/80">
                    {p.sar_narrative_template}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
