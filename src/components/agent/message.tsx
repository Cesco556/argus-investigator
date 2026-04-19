"use client";

import { useState } from "react";
import { ChevronRight, Sparkles, User, Wrench, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { UIMessage } from "ai";
import { cn } from "@/lib/utils";

export function AgentMessage({ message, modelLabel }: { message: UIMessage; modelLabel: string }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("group flex gap-3 px-4 py-3", isUser ? "bg-transparent" : "bg-card/40")}>
      <div
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
          isUser ? "bg-accent" : "bg-gradient-to-br from-primary to-primary/70",
        )}
      >
        {isUser ? (
          <User className="h-3 w-3 text-accent-foreground" />
        ) : (
          <Sparkles className="h-3 w-3 text-primary-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 leading-none">
          <span className="text-[11px] font-semibold text-foreground">
            {isUser ? "You" : "Argus"}
          </span>
          {!isUser && (
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              {modelLabel}
            </span>
          )}
        </div>
        <div className="mt-1.5 space-y-1.5 text-[13px] leading-relaxed text-foreground/90">
          {message.parts.map((part, i) => {
            if (part.type === "text") {
              return (
                <div key={i} className="whitespace-pre-wrap break-words">
                  {renderWithCitations(part.text)}
                </div>
              );
            }
            if (part.type.startsWith("tool-")) {
              return <ToolCallCard key={i} part={part as ToolPart} />;
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}

type ToolPart = {
  type: string;
  state?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
  toolCallId?: string;
};

function ToolCallCard({ part }: { part: ToolPart }) {
  const [open, setOpen] = useState(false);
  const name = part.type.replace(/^tool-/, "");
  const state = part.state ?? "input-streaming";

  const pending = state === "input-streaming" || state === "input-available";
  const done = state === "output-available";
  const failed = state === "output-error";

  const Icon = failed ? AlertCircle : done ? CheckCircle2 : pending ? Loader2 : Wrench;
  const tone = failed
    ? "text-risk-critical border-risk-critical/40 bg-risk-critical/10"
    : done
      ? "text-risk-low border-risk-low/30 bg-risk-low/5"
      : "text-primary border-primary/30 bg-primary/5";

  return (
    <div className={cn("rounded-md border font-mono text-[11px]", tone)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left"
      >
        <Icon className={cn("h-3 w-3 shrink-0", pending && "animate-spin")} />
        <span className="font-semibold">{name}</span>
        <span className="text-muted-foreground">
          · {stateLabel(state)}
        </span>
        {done && typeof part.output === "object" && part.output != null && "count" in part.output && (
          <span className="text-muted-foreground">
            · {String((part.output as { count: unknown }).count)} rows
          </span>
        )}
        <ChevronRight className={cn("ml-auto h-3 w-3 transition-transform", open && "rotate-90")} />
      </button>
      {open && (
        <div className="space-y-1.5 border-t border-border/50 px-2.5 py-2 text-[10px]">
          {part.input !== undefined && (
            <KVBlock label="input" value={part.input} />
          )}
          {done && part.output !== undefined && (
            <KVBlock label="output" value={part.output} />
          )}
          {failed && part.errorText && (
            <div>
              <div className="text-muted-foreground">error</div>
              <pre className="mt-0.5 whitespace-pre-wrap text-risk-critical">{part.errorText}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function KVBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <pre className="mt-0.5 max-h-48 overflow-auto whitespace-pre-wrap break-all text-foreground/80">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function stateLabel(state: string): string {
  switch (state) {
    case "input-streaming":
      return "calling";
    case "input-available":
      return "running";
    case "output-available":
      return "done";
    case "output-error":
      return "error";
    default:
      return state;
  }
}

const CITATION_RE = /\[([A-Z]{2,}-[A-Z0-9-]+|entity:[a-z0-9-]+|FATF-[A-Z]{2,}-\d{3})\]/g;

function renderWithCitations(text: string) {
  const parts: (string | { tag: string })[] = [];
  let last = 0;
  for (const match of text.matchAll(CITATION_RE)) {
    const idx = match.index ?? 0;
    if (idx > last) parts.push(text.slice(last, idx));
    parts.push({ tag: match[1] });
    last = idx + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.map((p, i) =>
    typeof p === "string" ? (
      <span key={i}>{p}</span>
    ) : (
      <span
        key={i}
        className="mx-0.5 inline-flex items-center rounded border border-primary/30 bg-primary/10 px-1 py-0 align-baseline font-mono text-[10px] text-primary"
      >
        {p.tag}
      </span>
    ),
  );
}
