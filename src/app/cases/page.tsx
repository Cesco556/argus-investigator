import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  CASES,
  ENTITIES,
  caseTotal,
  caseTransactions,
  formatGBP,
  sarClockLabel,
  type Severity,
} from "@/lib/data/fixtures";

export const metadata = { title: "Cases" };
export const dynamic = "force-dynamic";

const severityTone: Record<Severity, string> = {
  critical: "bg-risk-critical",
  high: "bg-risk-high",
  medium: "bg-risk-medium",
  low: "bg-risk-low",
};

export default function CasesPage() {
  const now = new Date();
  const bySeverity = [...CASES].sort((a, b) => b.risk_score - a.risk_score);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <PageHeader
        eyebrow="Investigations"
        title="Cases"
        description={`${CASES.length} open investigations. Disposition, SAR filing, and audit trail arrive in Week 3.`}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {bySeverity.map((c) => {
          const entity = c.subject_entity_id ? ENTITIES[c.subject_entity_id] : undefined;
          const total = caseTotal(c.id);
          const txCount = caseTransactions(c.id).length;
          return (
            <Card key={c.id} className="transition-colors hover:border-border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {c.id}
                      </span>
                      <Badge variant="outline" className="gap-1.5 font-mono text-[10px] uppercase tracking-wider">
                        <span className={`h-1.5 w-1.5 rounded-full ${severityTone[c.severity]}`} />
                        {c.severity}
                      </Badge>
                      <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
                        {c.typology_label}
                      </Badge>
                    </div>
                    <h2 className="mt-2 truncate text-base font-semibold tracking-tight">
                      {entity?.legal_name ?? c.subject}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.summary}</p>
                  </div>
                  <Link
                    href={`/case/${c.id}`}
                    className="flex shrink-0 items-center gap-1 rounded-md border border-border/60 bg-card/50 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Open <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <Fact label="Risk score" value={c.risk_score.toFixed(2)} sub={c.risk_basis} />
                  <Fact
                    label="Cumulative"
                    value={total > 0 ? formatGBP(total) : "—"}
                    sub={`${txCount} tx linked`}
                  />
                  <Fact
                    label="SAR clock"
                    value={sarClockLabel(c.sar_due_at, now)}
                    sub={new Date(c.sar_due_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    icon={<Clock className="h-3 w-3" />}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Fact({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border/50 bg-card/40 p-3">
      <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 font-mono text-sm font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">{sub}</div>
    </div>
  );
}
