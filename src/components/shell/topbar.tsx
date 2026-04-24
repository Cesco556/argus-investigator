"use client";

import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { CASES, SANCTIONS, TRANSACTIONS } from "@/lib/data/fixtures";

const CTR_THRESHOLD_GBP = 10000;

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
  const sanctionsCount = Object.values(SANCTIONS).filter((arr) => arr.length > 0).length;
  const belowCtrCount = TRANSACTIONS.filter((t) => t.amount < CTR_THRESHOLD_GBP).length;

  const systemHealthy = !!health?.mcp.ok && !!health?.agent.configured;
  const systemTone = loading ? "info" : systemHealthy ? "low" : health?.mcp.ok ? "medium" : "critical";
  const systemTitle = loading
    ? "checking system health…"
    : systemHealthy
      ? "investigation engine online"
      : health?.mcp.ok
        ? "agent not configured"
        : `MCP ${health?.mcp.error ?? "down"}`;

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Argus workspace
        </span>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="hidden items-center gap-2 md:flex">
        <StatusPill tone="critical" label="Sanctions" value={String(sanctionsCount)} />
        <StatusPill tone="high" label="Open cases" value={String(casesCount)} />
        <StatusPill tone="medium" label="Below CTR" value={String(belowCtrCount)} />
      </div>

      <div className="ml-3 hidden items-center md:flex" title={systemTitle}>
        <span className={`h-1.5 w-1.5 rounded-full ${toneDotClass(systemTone)}`} />
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

type Tone = "low" | "medium" | "high" | "critical" | "info";

function toneDotClass(tone: Tone): string {
  return {
    low: "bg-risk-low",
    medium: "bg-risk-medium",
    high: "bg-risk-high",
    critical: "bg-risk-critical",
    info: "bg-risk-info",
  }[tone];
}

function StatusPill({ tone, label, value }: { tone: Tone; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded border border-border/70 bg-card/40 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${toneDotClass(tone)}`} />
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
