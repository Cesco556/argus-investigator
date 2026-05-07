import Link from "next/link";
import { ArrowUpRight, Activity, AlertTriangle, FileCheck2, Scale, Rss } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CASES,
  TRANSACTIONS,
  TYPOLOGY_MIX_24H,
  caseTotal,
  formatGBP,
  formatAge,
  sarClockLabel,
  type Case,
  type Severity,
} from "@/lib/data/fixtures";
import { fetchIntel } from "@/lib/intel/fetch";

export const dynamic = "force-dynamic";

function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate(now: Date): string {
  return now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function relTime(iso: string): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "just now";
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default async function OverviewPage() {
  const now = new Date();
  const activeAlerts = CASES.length;
  const criticalOrHigh = CASES.filter((c) => c.severity === "critical" || c.severity === "high").length;
  const nextSarDueMs = Math.min(...CASES.map((c) => new Date(c.sar_due_at).getTime() - now.getTime()));
  const nextSarDueLabel =
    nextSarDueMs <= 0 ? "overdue" : `${Math.floor(nextSarDueMs / (1000 * 60 * 60 * 24))}d`;
  const txToday = TRANSACTIONS.filter(
    (t) => new Date(t.ts).toDateString() === now.toDateString(),
  ).length;
  const intel = await fetchIntel({ limit: 5 });

  return (
    <div className="relative">
      <div className="grid-bg absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
      <div className="relative mx-auto max-w-[1400px] space-y-6 px-6 py-8">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Investigator overview · {formatDate(now)}
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {greeting(now)}, Analyst.
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeAlerts} cases in queue · {criticalOrHigh} critical or high · next SAR due in {nextSarDueLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 font-mono text-[10px] uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-risk-low" /> Engine healthy
            </Badge>
            <Badge variant="outline" className="gap-1.5 font-mono text-[10px] uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-risk-info" /> agent-primary · claude-opus-4-7
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard icon={Activity} label="Transactions today" value={txToday.toLocaleString("en-GB")} unit="tx" delta="fixture set" tone="low" />
          <KpiCard icon={AlertTriangle} label="Active alerts" value={String(activeAlerts)} delta={`${criticalOrHigh} critical/high`} tone="medium" />
          <KpiCard icon={FileCheck2} label="Cases open" value={String(activeAlerts)} delta="0 filed this week" tone="info" />
          <KpiCard icon={Scale} label="Next SAR due" value={nextSarDueLabel} delta={sarClockLabel(CASES[0]?.sar_due_at ?? now.toISOString(), now)} tone="high" />
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Recent triage · auto-disposition
                  </div>
                  <h2 className="mt-1 text-base font-semibold">High-priority queue</h2>
                </div>
                <Link href="/inbox" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  Open inbox <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="mt-4 divide-y divide-border">
                {CASES.map((c) => (
                  <AlertRow key={c.id} alert={c} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Typology mix · 24h
              </div>
              <h2 className="mt-1 text-base font-semibold">Detection pressure</h2>
              <div className="mt-4 space-y-3">
                {TYPOLOGY_MIX_24H.map((t) => (
                  <TypologyBar key={t.typology} label={t.typology} pct={t.pct} tone={t.severity} />
                ))}
              </div>
              <div className="mt-5 border-t border-border/60 pt-4">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Agent runtime
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[12px]">
                  <span className="text-foreground/80">agent-primary</span>
                  <span className="font-mono tabular-nums text-muted-foreground">claude-opus-4-7</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[12px]">
                  <span className="text-foreground/80">MCP tools</span>
                  <span className="font-mono tabular-nums text-muted-foreground">5 registered</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Rss className="h-3 w-3 text-muted-foreground" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Regulatory intel · primary sources
                  </span>
                </div>
                <h2 className="mt-1 text-base font-semibold">Latest from UK regulators + curated global</h2>
              </div>
              <Link href="/intel" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                Open feed <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            {intel.items.length === 0 ? (
              <div className="mt-4 rounded-md border border-border/40 bg-card/30 p-4 text-center text-xs text-muted-foreground">
                All regulator feeds unreachable — network blocked or all sources down.
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-border/40">
                {intel.items.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group -mx-5 flex items-start gap-3 px-5 py-2.5 transition-colors hover:bg-accent/30"
                    >
                      <Badge variant="outline" className="mt-0.5 shrink-0 font-mono text-[10px] uppercase tracking-wider">
                        {item.source_label}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-foreground group-hover:text-primary">
                          {item.title}
                        </div>
                        {item.summary && (
                          <div className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                            {item.summary}
                          </div>
                        )}
                      </div>
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                        {relTime(item.published_at)}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/40 pt-3">
              {intel.sources.map((s) => (
                <Badge
                  key={s.id}
                  variant="outline"
                  className="gap-1.5 font-mono text-[9px] uppercase tracking-wider"
                  title={s.error ?? `${s.count} items`}
                >
                  <span className={`h-1 w-1 rounded-full ${s.ok ? "bg-risk-low" : "bg-risk-high"}`} />
                  {s.label} · {s.ok ? s.count : "down"}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  unit,
  delta,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  unit?: string;
  delta: string;
  tone: "low" | "medium" | "high" | "critical" | "info";
}) {
  const toneClass = {
    low: "text-risk-low",
    medium: "text-risk-medium",
    high: "text-risk-high",
    critical: "text-risk-critical",
    info: "text-risk-info",
  }[tone];
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <Icon className={`h-3.5 w-3.5 ${toneClass}`} />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
          {unit && <span className="font-mono text-xs text-muted-foreground">{unit}</span>}
        </div>
        <div className="mt-1 font-mono text-[10px] text-muted-foreground">{delta}</div>
      </CardContent>
    </Card>
  );
}

function AlertRow({ alert }: { alert: Case }) {
  const toneClass = {
    low: "bg-risk-low",
    medium: "bg-risk-medium",
    high: "bg-risk-high",
    critical: "bg-risk-critical",
  }[alert.severity];
  const total = caseTotal(alert.id);
  return (
    <Link
      href={`/case/${alert.id}`}
      className="group -mx-5 flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-accent/30"
    >
      <div className={`h-8 w-[3px] shrink-0 rounded-sm ${toneClass}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">{alert.id}</span>
          <Badge variant="outline" className="h-4 font-mono text-[9px] uppercase tracking-wider">
            {alert.typology_label}
          </Badge>
        </div>
        <div className="mt-0.5 truncate text-sm text-foreground">{alert.subject}</div>
      </div>
      <div className="text-right">
        <div className="font-mono text-sm tabular-nums">
          {total > 0 ? formatGBP(total) : "—"}
        </div>
        <div className="font-mono text-[10px] text-muted-foreground">{formatAge(alert.age_minutes)} ago</div>
      </div>
      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

function TypologyBar({
  label,
  pct,
  tone,
}: {
  label: string;
  pct: number;
  tone: Severity | "info";
}) {
  const toneClass = {
    low: "bg-risk-low",
    medium: "bg-risk-medium",
    high: "bg-risk-high",
    critical: "bg-risk-critical",
    info: "bg-risk-info",
  }[tone];
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-foreground/80">{label}</span>
        <span className="font-mono tabular-nums text-muted-foreground">{pct}%</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${toneClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
