import { notFound } from "next/navigation";
import { AlertTriangle, Clock, Building2, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AgentPanel } from "@/components/agent/agent-panel";
import { DispositionPanel } from "@/components/case/disposition-panel";
import { TransactionTimeline } from "@/components/case/transaction-timeline";
import { getAgentModelLabel } from "@/lib/agent/provider";
import {
  CASES,
  ENTITIES,
  caseTransactions,
  caseTotal,
  formatGBP,
  sarClockLabel,
  type Transaction,
} from "@/lib/data/fixtures";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/case/[id]">) {
  const { id } = await props.params;
  return { title: `Case ${id}` };
}

const severityToDot: Record<string, string> = {
  critical: "bg-risk-critical",
  high: "bg-risk-high",
  medium: "bg-risk-medium",
  low: "bg-risk-low",
};

function formatTxTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", { month: "short", day: "numeric" })} · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
}

export default async function CaseDetailPage(props: PageProps<"/case/[id]">) {
  const { id } = await props.params;
  const kase = CASES.find((c) => c.id === id);
  if (!kase) notFound();

  const entity = kase.subject_entity_id ? ENTITIES[kase.subject_entity_id] : undefined;
  const txs = caseTransactions(id);
  const total = caseTotal(id);
  const now = new Date();

  return (
    <div className="grid h-full grid-cols-[1fr_420px] overflow-hidden">
      <div className="scroll-area-thin overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-5 px-6 py-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Case · {id}
              </span>
              <Badge variant="outline" className="gap-1.5 font-mono text-[10px] uppercase tracking-wider">
                <span className={`h-1.5 w-1.5 rounded-full ${severityToDot[kase.severity]}`} /> {kase.severity}
              </Badge>
              <Badge variant="outline" className="gap-1.5 font-mono text-[10px] uppercase tracking-wider">
                <Clock className="h-2.5 w-2.5" /> SAR clock · {sarClockLabel(kase.sar_due_at, now)}
              </Badge>
              <Badge variant="outline" className="gap-1.5 font-mono text-[10px] uppercase tracking-wider">
                {kase.typology_label}
              </Badge>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              {entity ? `${entity.legal_name} · ${kase.typology_label.toLowerCase()} pattern` : kase.subject}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{kase.summary}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <FactCard
              icon={AlertTriangle}
              label="Risk score"
              value={kase.risk_score.toFixed(2)}
              sub={kase.risk_basis}
            />
            <FactCard
              icon={Building2}
              label="Subject"
              value={entity?.legal_name ?? "Unknown"}
              sub={
                entity
                  ? `${entity.entity_type} · ${entity.incorporation_date.slice(0, 7)}`
                  : "No resolved entity"
              }
            />
            <FactCard
              icon={Hash}
              label="Transactions"
              value={String(txs.length)}
              sub={total > 0 ? `${formatGBP(total)} cumulative` : "No linked transactions"}
            />
          </div>

          {txs.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Evidence timeline
                    </div>
                    <h2 className="mt-1 text-base font-semibold">Transaction sequence</h2>
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {txs.length} tx · {formatGBP(total)}
                  </div>
                </div>
                <div className="mt-4">
                  <TransactionTimeline transactions={txs} />
                </div>
                <div className="mt-4 space-y-1.5">
                  {txs.map((t) => (
                    <TxRow key={t.id} tx={t} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-5">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Detection rationale
              </div>
              <h2 className="mt-1 text-base font-semibold">Why this was flagged</h2>
              <ul className="mt-3 space-y-2 text-sm text-foreground/85">
                {rationaleFor(kase.typology, entity?.risk_flags ?? []).map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${r.dot}`} />
                    <span>
                      <span className="font-medium">{r.title}</span> — {r.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <DispositionPanel caseId={id} />
        </div>
      </div>
      <AgentPanel caseId={id} modelLabel={getAgentModelLabel()} />
    </div>
  );
}

function FactCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="mt-2 font-mono text-lg font-semibold tracking-tight tabular-nums">{value}</div>
        <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  );
}

function TxRow({ tx }: { tx: Transaction }) {
  return (
    <div
      data-tx-id={tx.id}
      className="flex items-center gap-3 rounded-md border border-border/40 bg-card/30 px-3 py-2 font-mono text-[11px] hover:border-border hover:bg-card/60"
    >
      <span className="text-muted-foreground">{tx.id}</span>
      <span className="text-foreground/70">{formatTxTime(tx.ts)}</span>
      <span className="text-foreground/70">{tx.branch}</span>
      <span className="flex-1 text-muted-foreground">{tx.method.replace("_", " ")}</span>
      <span className="tabular-nums text-foreground">{formatGBP(tx.amount)}</span>
    </div>
  );
}

function rationaleFor(
  typology: string,
  riskFlags: string[],
): { title: string; detail: string; dot: string }[] {
  if (typology === "structuring") {
    return [
      {
        title: "Deposits clustered below £10,000 threshold",
        detail: "9 of 9 deposits fall in the £8,800–£9,950 band (structuring signature).",
        dot: "bg-risk-critical",
      },
      {
        title: "Multi-branch dispersal",
        detail: "3 distinct branches in 72h suggests coordinated avoidance of single-location aggregation.",
        dot: "bg-risk-high",
      },
      {
        title: "Newly incorporated subject",
        detail: "LLC registered 2024-11, no historical deposit pattern to benchmark against.",
        dot: "bg-risk-medium",
      },
    ];
  }
  if (typology === "layering") {
    return [
      {
        title: "4-hop funnel through associated entities",
        detail: "Funds routed through 4 shell vehicles in <6h with no commercial rationale.",
        dot: "bg-risk-high",
      },
      {
        title: "Shell company cluster",
        detail: "All 4 hops share the same ultimate beneficial owner.",
        dot: "bg-risk-medium",
      },
    ];
  }
  if (typology === "smurfing") {
    return [
      {
        title: "12 distinct originators, single beneficiary",
        detail: "No commercial relationship between originators and Ardent Logistics account.",
        dot: "bg-risk-medium",
      },
    ];
  }
  if (typology === "sanctions_nexus") {
    return [
      {
        title: "OFAC SDN partial match",
        detail: "Beneficial owner matches OFAC SDN list at 0.87 confidence (name + DOB).",
        dot: "bg-risk-critical",
      },
    ];
  }
  return riskFlags.map((f) => ({
    title: f.replaceAll("_", " "),
    detail: "Flagged by upstream detector.",
    dot: "bg-risk-medium",
  }));
}
