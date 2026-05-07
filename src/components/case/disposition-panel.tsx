"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Check, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Disposition = "file_sar" | "dismiss" | "defer";
type TrailStatus = "idle" | "syncing" | "saved" | "failed";

interface Stored {
  decision: Disposition;
  note: string;
  at: string;
  decidedBy: string;
}

const STORAGE_PREFIX = "argus:disposition:";
const SAME_TAB_EVENT = "argus:disposition:changed";

function storageKey(caseId: string): string {
  return STORAGE_PREFIX + caseId;
}

function writeStored(caseId: string, value: Stored) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(caseId), JSON.stringify(value));
  // Cross-tab updates fire `storage`. Same-tab updates do not, so dispatch a custom
  // event the hook also listens for — keeps every mounted DispositionPanel in sync.
  window.dispatchEvent(new CustomEvent(SAME_TAB_EVENT, { detail: caseId }));
}

/**
 * SSR-safe localStorage subscription for a single disposition record. Returns the
 * raw string value (or null) — parsing happens in a memo so React's `Object.is`
 * snapshot comparison sees a stable string and skips redundant renders. Avoids the
 * setState-in-effect cascade lint by reading via getSnapshot during render.
 */
function useStoredDisposition(caseId: string): Stored | null {
  const subscribe = useCallback(
    (cb: () => void) => {
      if (typeof window === "undefined") return () => {};
      const handler = (e: Event) => {
        if (e instanceof StorageEvent) {
          if (e.key === storageKey(caseId)) cb();
        } else if (e instanceof CustomEvent && e.detail === caseId) {
          cb();
        }
      };
      window.addEventListener("storage", handler);
      window.addEventListener(SAME_TAB_EVENT, handler);
      return () => {
        window.removeEventListener("storage", handler);
        window.removeEventListener(SAME_TAB_EVENT, handler);
      };
    },
    [caseId],
  );
  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(storageKey(caseId));
  }, [caseId]);
  const getServerSnapshot = useCallback(() => null, []);
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo<Stored | null>(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Stored;
    } catch {
      return null;
    }
  }, [raw]);
}

async function postToTrail(caseId: string, record: Stored): Promise<TrailStatus> {
  try {
    const res = await fetch("/api/disposition", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ caseId, ...record }),
    });
    return res.ok ? "saved" : "failed";
  } catch {
    return "failed";
  }
}

const DECISION_META: Record<Disposition, { label: string; chipLabel: string; tone: "critical" | "low" | "medium" }> = {
  file_sar: { label: "File SAR", chipLabel: "SAR filed", tone: "critical" },
  dismiss: { label: "Dismiss", chipLabel: "Dismissed", tone: "low" },
  defer: { label: "Defer", chipLabel: "Deferred", tone: "medium" },
};

export function DispositionPanel({ caseId }: { caseId: string }) {
  const stored = useStoredDisposition(caseId);
  const [pending, setPending] = useState<Disposition | null>(null);
  const [note, setNote] = useState("");
  // Keyed by caseId so navigation between cases never reads a stale status from a different case.
  const [trailStatusByCase, setTrailStatusByCase] = useState<Record<string, TrailStatus>>({});
  const trailStatus: TrailStatus = trailStatusByCase[caseId] ?? "idle";

  const commit = async (decision: Disposition) => {
    const record: Stored = {
      decision,
      note: note.trim(),
      at: new Date().toISOString(),
      decidedBy: "current analyst",
    };
    writeStored(caseId, record);
    setPending(null);
    setNote("");
    setTrailStatusByCase((prev) => ({ ...prev, [caseId]: "syncing" }));
    const status = await postToTrail(caseId, record);
    setTrailStatusByCase((prev) => ({ ...prev, [caseId]: status }));
    if (status === "saved") {
      toast.success("Decision recorded to suspicion trail");
    } else {
      toast.error("Suspicion trail write failed — decision held in browser only");
    }
  };

  const cancel = () => {
    setPending(null);
    setNote("");
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              SAR disposition
            </div>
            <h2 className="mt-1 text-base font-semibold">Analyst decision</h2>
          </div>
          {stored && (
            <div className="font-mono text-[10px] text-muted-foreground">
              {new Date(stored.at).toLocaleString("en-GB", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </div>
          )}
        </div>

        {stored && !pending ? (
          <div className="mt-3 rounded-md border border-border/60 bg-card/30 p-3">
            <div className="flex items-center gap-2">
              <DecisionChip decision={stored.decision} />
              <span className="text-[11px] text-muted-foreground">— {stored.decidedBy}</span>
              <TrailBadge status={trailStatus} />
            </div>
            {stored.note && <p className="mt-2 text-[12px] text-foreground/80">{stored.note}</p>}
            <button
              type="button"
              onClick={() => {
                setPending(stored.decision);
                setNote(stored.note);
              }}
              className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              amend decision
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <DecisionButton
                decision="file_sar"
                active={pending === "file_sar"}
                onClick={() => setPending("file_sar")}
                icon={Check}
              />
              <DecisionButton
                decision="dismiss"
                active={pending === "dismiss"}
                onClick={() => setPending("dismiss")}
                icon={X}
              />
              <DecisionButton
                decision="defer"
                active={pending === "defer"}
                onClick={() => setPending("defer")}
                icon={Clock}
              />
            </div>
            {pending && (
              <div className="space-y-2">
                <textarea
                  placeholder="Rationale — appended to the suspicion trail alongside this decision."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-[12px] leading-relaxed outline-none transition-colors focus:border-primary"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => commit(pending)}
                    className="rounded-md bg-primary px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
                  >
                    commit decision
                  </button>
                  <button
                    type="button"
                    onClick={cancel}
                    className="rounded-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                  >
                    cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DecisionButton({
  decision,
  active,
  onClick,
  icon: Icon,
}: {
  decision: Disposition;
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const meta = DECISION_META[decision];
  const toneIdle = {
    critical: "hover:border-risk-critical/50 hover:text-risk-critical",
    low: "hover:border-risk-low/50 hover:text-risk-low",
    medium: "hover:border-risk-medium/50 hover:text-risk-medium",
  }[meta.tone];
  const toneActive = {
    critical: "border-risk-critical bg-risk-critical/10 text-risk-critical",
    low: "border-risk-low bg-risk-low/10 text-risk-low",
    medium: "border-risk-medium bg-risk-medium/10 text-risk-medium",
  }[meta.tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-md border px-3 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors",
        active ? toneActive : cn("border-border/60 text-foreground/85", toneIdle),
      )}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </button>
  );
}

function TrailBadge({ status }: { status: TrailStatus }) {
  if (status === "idle") return null;
  const meta = {
    syncing: { label: "syncing", tone: "border-border/40 bg-card/30 text-muted-foreground" },
    saved: { label: "trail · synced", tone: "border-risk-low/40 bg-risk-low/10 text-risk-low" },
    failed: { label: "trail · offline", tone: "border-risk-medium/40 bg-risk-medium/10 text-risk-medium" },
  }[status];
  return (
    <span
      className={cn(
        "ml-auto inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider",
        meta.tone,
      )}
    >
      {meta.label}
    </span>
  );
}

function DecisionChip({ decision }: { decision: Disposition }) {
  const meta = DECISION_META[decision];
  const tone = {
    critical: "border-risk-critical/50 bg-risk-critical/10 text-risk-critical",
    low: "border-risk-low/50 bg-risk-low/10 text-risk-low",
    medium: "border-risk-medium/50 bg-risk-medium/10 text-risk-medium",
  }[meta.tone];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        tone,
      )}
    >
      {meta.chipLabel}
    </span>
  );
}
