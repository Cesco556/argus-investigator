import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  CASES,
  ENTITIES,
  caseTotal,
  formatAge,
  formatGBP,
  sarClockLabel,
} from "@/lib/data/fixtures";

export const metadata = { title: "Alert inbox" };
export const dynamic = "force-dynamic";

const severityTone: Record<string, string> = {
  critical: "bg-risk-critical",
  high: "bg-risk-high",
  medium: "bg-risk-medium",
  low: "bg-risk-low",
};

export default function InboxPage() {
  const now = new Date();
  const sorted = [...CASES].sort((a, b) => b.risk_score - a.risk_score);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <PageHeader
        eyebrow="Triage queue"
        title="Alert inbox"
        description={`${CASES.length} active alerts · ranked by risk score. Each row links to a case file with MCP-backed evidence.`}
      />

      <Card className="mt-6">
        <CardContent className="p-0">
          <div className="grid grid-cols-[100px_90px_140px_1fr_130px_110px_110px_30px] items-center gap-3 border-b border-border bg-muted/30 px-5 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Alert</span>
            <span>Severity</span>
            <span>Typology</span>
            <span>Subject</span>
            <span className="text-right">Cumulative</span>
            <span className="text-right">SAR clock</span>
            <span className="text-right">Age</span>
            <span />
          </div>
          {sorted.map((c) => {
            const entity = c.subject_entity_id ? ENTITIES[c.subject_entity_id] : undefined;
            const total = caseTotal(c.id);
            return (
              <Link
                key={c.id}
                href={`/case/${c.id}`}
                className="group grid grid-cols-[100px_90px_140px_1fr_130px_110px_110px_30px] items-center gap-3 border-b border-border/40 px-5 py-3 transition-colors last:border-b-0 hover:bg-accent/30"
              >
                <span className="font-mono text-[11px] text-muted-foreground">{c.id}</span>
                <Badge variant="outline" className="h-5 w-fit gap-1.5 font-mono text-[10px] uppercase tracking-wider">
                  <span className={`h-1.5 w-1.5 rounded-full ${severityTone[c.severity]}`} /> {c.severity}
                </Badge>
                <span className="font-mono text-[11px] text-foreground/80">{c.typology_label}</span>
                <div className="min-w-0">
                  <div className="truncate text-sm text-foreground">
                    {entity?.legal_name ?? c.subject}
                  </div>
                  <div className="truncate font-mono text-[10px] text-muted-foreground">{c.summary}</div>
                </div>
                <span className="text-right font-mono text-sm tabular-nums">
                  {total > 0 ? formatGBP(total) : "—"}
                </span>
                <span className="text-right font-mono text-[11px] tabular-nums text-foreground/70">
                  {sarClockLabel(c.sar_due_at, now)}
                </span>
                <span className="text-right font-mono text-[11px] text-muted-foreground">
                  {formatAge(c.age_minutes)}
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 justify-self-end text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100" />
              </Link>
            );
          })}
        </CardContent>
      </Card>

      <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
        Fixture data · {CASES.length} rows. Virtualised table with filters lands alongside the real ingest pipeline.
      </p>
    </div>
  );
}
