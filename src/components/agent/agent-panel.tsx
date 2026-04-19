"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUp, Square, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentMessage } from "./message";
import { cn } from "@/lib/utils";

const PROMPTS = [
  "Summarise this case in SAR-ready language.",
  "What FATF typology best fits this pattern?",
  "Walk me through the evidence chain.",
  "What should I escalate next?",
];

export function AgentPanel({ caseId, modelLabel }: { caseId: string; modelLabel: string }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/agent" }), []);
  const { messages, sendMessage, status, stop, error } = useChat({
    id: `case-${caseId}`,
    transport,
  });

  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage({ text: input });
    setInput("");
  }

  function onPrompt(p: string) {
    if (isStreaming) return;
    sendMessage({ text: p });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden border-l border-border bg-background">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-primary to-primary/70">
          <Sparkles className="h-3 w-3 text-primary-foreground" />
        </div>
        <span className="text-[13px] font-semibold">Argus</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Investigator · case {caseId.slice(-4)}
        </span>
        <div className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
          <span className={cn("h-1.5 w-1.5 rounded-full", isStreaming ? "bg-risk-medium" : "bg-risk-low")} />
          {isStreaming ? "thinking" : "ready"}
        </div>
      </div>

      <div ref={scrollRef} className="scroll-area-thin min-h-0 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState onPrompt={onPrompt} />
        ) : (
          <div className="divide-y divide-border">
            {messages.map((m) => (
              <AgentMessage key={m.id} message={m} modelLabel={modelLabel} />
            ))}
            {status === "submitted" && <ThinkingRow />}
          </div>
        )}
      </div>

      {error && (
        <div className="border-t border-border bg-risk-critical/10 px-4 py-2 text-[11px] text-risk-critical">
          {error.message}
        </div>
      )}

      <form onSubmit={onSubmit} className="border-t border-border p-3">
        <div className="relative rounded-lg border border-border bg-card/50 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e as unknown as React.FormEvent);
              }
            }}
            placeholder="Ask about this case — evidence, typology, next steps…"
            rows={2}
            className="block w-full resize-none bg-transparent px-3 py-2.5 text-[13px] placeholder:text-muted-foreground/60 focus:outline-none"
          />
          <div className="flex items-center justify-between border-t border-border/50 px-2 py-1.5">
            <div className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground">
              <Zap className="h-2.5 w-2.5" />
              <span>{modelLabel}</span>
              <span className="text-muted-foreground/40">·</span>
              <span>Enter to send · Shift+Enter newline</span>
            </div>
            {isStreaming ? (
              <Button type="button" onClick={() => stop()} size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs">
                <Square className="h-3 w-3" /> Stop
              </Button>
            ) : (
              <Button type="submit" size="sm" disabled={!input.trim()} className="h-6 gap-1 px-2 text-xs">
                <ArrowUp className="h-3 w-3" /> Send
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

function EmptyState({ onPrompt }: { onPrompt: (p: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
        <Sparkles className="h-5 w-5 text-primary-foreground" />
      </div>
      <div>
        <h3 className="text-sm font-semibold">Argus is ready</h3>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Ask about this case. Every claim is cited; the human decides.
        </p>
      </div>
      <div className="flex w-full flex-col gap-1.5">
        {PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPrompt(p)}
            className="rounded-md border border-border/60 bg-card/40 px-3 py-2 text-left text-[12px] text-foreground/80 transition-colors hover:border-primary/40 hover:bg-card hover:text-foreground"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function ThinkingRow() {
  return (
    <div className="flex items-center gap-3 bg-card/40 px-4 py-3">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/70">
        <Sparkles className="h-3 w-3 animate-pulse text-primary-foreground" />
      </div>
      <div className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" style={{ animationDelay: "150ms" }} />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
