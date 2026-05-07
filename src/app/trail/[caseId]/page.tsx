import Link from "next/link";
import { ArrowLeft, Check, Clock, Gavel, X } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { mongoConfigured } from "@/lib/mongo/client";
import { getTrail, type TrailEvent } from "@/lib/mongo/suspicion-trail";
import { cn } from "@/lib/utils";

type Disposition = "file_sar" | "dismiss" | "defer";

interface DispositionInput {
  decision: Disposition;
  note: string;
  decidedBy: string;
}

function isDispositionEvent(e: TrailEvent): boolean {
  return e.tool.name === "disposition.commit";
}

function dispositionInput(e: TrailEvent): DispositionInput | null {
  const v = e.tool.input as DispositionInput | null | undefined;
  if (!v || typeof v !== "object" || !("decision" in v)) return null;
  if (v.decision !== "file_sar" && v.decision !== "dismiss" && v.decision !== "defer") return null;
  return {
    decision: v.decision,
    note: typeof v.note === "string" ? v.note : "",
    decidedBy: typeof v.decidedBy === "string" ? v.decidedBy : "analyst",
  };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  return { title: `Trail · ${caseId}` };
}

function fmtClock(d: Date): string {
  return d.toISOString().slice(11, 19);
}

function pretty(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default async function TrailDetailPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId: rawCaseId } = await params;
  const caseId = decodeURIComponent(rawCaseId);

  if (!mongoConfigured) {
    return (
      <div className="mx-auto max-w-[1100px] px-6 py-8">
        <BackLink />
        <PageHeader eyebrow="Suspicion Trail" title={caseId} description="MongoDB not configured." />
      </div>
    );
  }

  let events: TrailEvent[] = [];
  let loadError: string | null = null;
  try {
    events = await getTrail(caseId, 500);
  } catch (err) {
    loadError = err instanceof Error ? err.message : String(err);
  }

  const traces = groupByTrace(events);
  const decisionCount = events.filter(isDispositionEvent).length;
  const toolCount = events.length - decisionCount;
  const description = [
    `${toolCount} agent tool call${toolCount === 1 ? "" : "s"}`,
    decisionCount > 0
      ? `${decisionCount} analyst decision${decisionCount === 1 ? "" : "s"}`
      : null,
    `${traces.length} conversation turn${traces.length === 1 ? "" : "s"}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8">
      <BackLink />
      <PageHeader eyebrow="Suspicion Trail" title={caseId} description={description} />

      {loadError && (
        <Card className="mt-6 border-risk-critical/40">
          <CardContent className="p-4 text-xs text-risk-critical">Failed to load trail: {loadError}</CardContent>
        </Card>
      )}

      {events.length === 0 && !loadError && (
        <Card className="mt-6">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No events recorded for this case yet.
          </CardContent>
        </Card>
      )}

      <div className="mt-6 space-y-6">
        {traces.map((trace) => (
          <Card key={trace.traceId}>
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Turn · {fmtClock(trace.start)}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground/70">
                    trace {trace.traceId.slice(0, 8)}…
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums">{trace.events.length}</div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {trace.events.every(isDispositionEvent)
                      ? `decision${trace.events.length === 1 ? "" : "s"}`
                      : `event${trace.events.length === 1 ? "" : "s"}`}
                  </div>
                </div>
              </div>
              <ol className="divide-y divide-border">
                {trace.events.map((event, idx) => (
                  <EventRow key={`${trace.traceId}:${idx}`} event={event} idx={idx} />
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/trail"
      className="mb-3 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-3 w-3" /> All cases
    </Link>
  );
}

const DECISION_META: Record<
  Disposition,
  { label: string; tone: string; icon: typeof Check }
> = {
  file_sar: {
    label: "SAR filed",
    tone: "border-risk-critical/40 bg-risk-critical/10 text-risk-critical",
    icon: Gavel,
  },
  dismiss: {
    label: "Dismissed",
    tone: "border-risk-low/40 bg-risk-low/10 text-risk-low",
    icon: X,
  },
  defer: {
    label: "Deferred",
    tone: "border-risk-medium/40 bg-risk-medium/10 text-risk-medium",
    icon: Clock,
  },
};

function EventRow({ event, idx }: { event: TrailEvent; idx: number }) {
  const decision = isDispositionEvent(event) ? dispositionInput(event) : null;
  if (decision) return <DecisionRow event={event} decision={decision} idx={idx} />;

  const ok = event.outcome.success;
  return (
    <li className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="font-mono text-[10px] tabular-nums text-muted-foreground">#{idx + 1}</div>
        <div className="font-mono text-[13px] font-semibold">{event.tool.name}</div>
        <div
          className={cn(
            "rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider",
            ok ? "bg-risk-low/15 text-risk-low" : "bg-risk-critical/15 text-risk-critical",
          )}
        >
          {ok ? "ok" : "error"}
        </div>
        <div className="ml-auto flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>{event.outcome.durationMs}ms</span>
          <span>{event.model.id}</span>
          <span>{fmtClock(new Date(event.ts))}</span>
        </div>
      </div>
      <div className="mt-2 grid gap-2 md:grid-cols-2">
        <JsonBlock label="Input" value={event.tool.input} />
        <JsonBlock
          label={ok ? "Output" : "Error"}
          value={ok ? event.outcome.output : event.outcome.error}
          tone={ok ? "default" : "error"}
        />
      </div>
    </li>
  );
}

function DecisionRow({
  event,
  decision,
  idx,
}: {
  event: TrailEvent;
  decision: DispositionInput;
  idx: number;
}) {
  const meta = DECISION_META[decision.decision];
  const Icon = meta.icon;
  return (
    <li className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="font-mono text-[10px] tabular-nums text-muted-foreground">#{idx + 1}</div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
            meta.tone,
          )}
        >
          <Icon className="h-3 w-3" /> {meta.label}
        </span>
        <span className="text-[11px] text-muted-foreground">— {decision.decidedBy}</span>
        <div className="ml-auto flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>analyst</span>
          <span>{fmtClock(new Date(event.ts))}</span>
        </div>
      </div>
      {decision.note && (
        <p className="mt-2 rounded border border-border/40 bg-card/30 px-3 py-2 text-[12px] leading-relaxed text-foreground/85">
          {decision.note}
        </p>
      )}
    </li>
  );
}

function JsonBlock({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: unknown;
  tone?: "default" | "error";
}) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <pre
        className={cn(
          "mt-1 max-h-48 overflow-auto rounded border border-border bg-card/40 p-2 font-mono text-[11px] leading-snug",
          tone === "error" && "border-risk-critical/40 text-risk-critical",
        )}
      >
        {pretty(value)}
      </pre>
    </div>
  );
}

interface TraceGroup {
  traceId: string;
  start: Date;
  events: TrailEvent[];
}

function groupByTrace(events: TrailEvent[]): TraceGroup[] {
  const byTrace = new Map<string, TraceGroup>();
  for (const e of events) {
    let g = byTrace.get(e.traceId);
    if (!g) {
      g = { traceId: e.traceId, start: new Date(e.ts), events: [] };
      byTrace.set(e.traceId, g);
    }
    g.events.push(e);
    if (new Date(e.ts) < g.start) g.start = new Date(e.ts);
  }
  return Array.from(byTrace.values()).sort((a, b) => a.start.getTime() - b.start.getTime());
}
