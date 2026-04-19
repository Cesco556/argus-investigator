"use client";

import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { CASES, TRANSACTIONS } from "@/lib/data/fixtures";

type Health = {
  ok: boolean;
  mcp: { ok: boolean; latency_ms: number | null; error?: string };
  agent: { configured: boolean };
};

export function Topbar() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (!res.ok) throw new Error(`http_${res.status}`);
        const body = (await res.json()) as Health;
        if (!cancelled) setHealth(body);
      } catch {
        if (!cancelled) setHealth(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const t = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const casesCount = CASES.length;
  const txCount = TRANSACTIONS.length;

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Argus workspace
        </span>
        <span className="font-mono text-[10px] text-muted-foreground/60">·</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80">
          uk-south
        </span>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="hidden items-center gap-2 md:flex">
        <StatusPill
          tone={health?.mcp.ok ? "low" : loading ? "info" : "critical"}
          label="MCP"
          value={
            loading
              ? "checking"
              : health?.mcp.ok
                ? `${health.mcp.latency_ms ?? 0}ms`
                : (health?.mcp.error ?? "down")
          }
        />
        <StatusPill
          tone={health?.agent.configured ? "low" : "medium"}
          label="Agent"
          value={health?.agent.configured ? "ready" : "unconfigured"}
        />
        <StatusPill tone="info" label="Cases" value={String(casesCount)} />
        <StatusPill tone="info" label="TX fixture" value={String(txCount)} />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center gap-2 pl-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent font-mono text-[10px] font-semibold">
            FO
          </div>
          <div className="hidden flex-col leading-tight lg:flex">
            <span className="text-[11px] font-medium">Francesco</span>
            <span className="font-mono text-[9px] text-muted-foreground/70">investigator</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatusPill({
  tone,
  label,
  value,
}: {
  tone: "low" | "medium" | "high" | "critical" | "info";
  label: string;
  value: string;
}) {
  const toneClass = {
    low: "bg-risk-low",
    medium: "bg-risk-medium",
    high: "bg-risk-high",
    critical: "bg-risk-critical",
    info: "bg-risk-info",
  }[tone];
  return (
    <div className="flex items-center gap-1.5 rounded border border-border/70 bg-card/40 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${toneClass}`} />
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
