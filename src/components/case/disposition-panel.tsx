"use client";

import { useEffect, useState } from "react";
import { Check, Clock, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Disposition = "file_sar" | "dismiss" | "defer";

interface Stored {
  decision: Disposition;
  note: string;
  at: string;
  decidedBy: string;
}

const STORAGE_PREFIX = "argus:disposition:";

function readStored(caseId: string): Stored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + caseId);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

function writeStored(caseId: string, value: Stored) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_PREFIX + caseId, JSON.stringify(value));
}

const DECISION_META: Record<Disposition, { label: string; chipLabel: string; tone: "critical" | "low" | "medium" }> = {
  file_sar: { label: "File SAR", chipLabel: "SAR filed", tone: "critical" },
  dismiss: { label: "Dismiss", chipLabel: "Dismissed", tone: "low" },
  defer: { label: "Defer", chipLabel: "Deferred", tone: "medium" },
};

export function DispositionPanel({ caseId }: { caseId: string }) {
  const [stored, setStored] = useState<Stored | null>(null);
  const [pending, setPending] = useState<Disposition | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    setStored(readStored(caseId));
  }, [caseId]);

  const commit = (decision: Disposition) => {
    const record: Stored = {
      decision,
      note: note.trim(),
      at: new Date().toISOString(),
      decidedBy: "current analyst",
    };
    writeStored(caseId, record);
    setStored(record);
    setPending(null);
    setNote("");
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
                  placeholder="Rationale — saved to the suspicion trail alongside this decision."
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
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                    locally persisted · demo
                  </span>
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
