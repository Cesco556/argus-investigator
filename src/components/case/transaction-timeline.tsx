"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatGBP, type Transaction } from "@/lib/data/fixtures";
import { cn } from "@/lib/utils";

const BRANCH_PALETTE = ["#e29354", "#4eabe0", "#a78bfa", "#3bc48a", "#e85a4f"] as const;
const CTR_THRESHOLD = 10000;
const PAD = { top: 24, right: 16, bottom: 36, left: 56 };
const HEIGHT = 260;

export function TransactionTimeline({ transactions }: { transactions: Transaction[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [pulsed, setPulsed] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<{ tag: string; kind: string }>).detail;
      if (!detail || detail.kind !== "tx") return;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      setPulsed(detail.tag);
      timerRef.current = window.setTimeout(() => {
        setPulsed(null);
        timerRef.current = null;
      }, 1400);
    }
    window.addEventListener("argus:cite", handler);
    return () => {
      window.removeEventListener("argus:cite", handler);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const branches = useMemo(() => {
    const m = new Map<string, string>();
    let i = 0;
    for (const t of transactions) {
      if (!m.has(t.branch)) {
        m.set(t.branch, BRANCH_PALETTE[i % BRANCH_PALETTE.length]);
        i += 1;
      }
    }
    return m;
  }, [transactions]);

  const counts = useMemo(() => {
    const c = new Map<string, number>();
    for (const t of transactions) c.set(t.branch, (c.get(t.branch) ?? 0) + 1);
    return c;
  }, [transactions]);

  const { points, xTicks, yTicks, width } = useMemo(() => {
    if (transactions.length === 0) {
      return { points: [], xTicks: [], yTicks: [], width: 720 };
    }
    const w = 720;
    const innerW = w - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;

    const times = transactions.map((t) => new Date(t.ts).getTime());
    const amounts = transactions.map((t) => t.amount);
    const tMin = Math.min(...times);
    const tMax = Math.max(...times);
    const aMin = Math.min(...amounts, CTR_THRESHOLD * 0.85);
    const aMax = Math.max(...amounts, CTR_THRESHOLD * 1.02);

    const xOf = (t: number) => PAD.left + ((t - tMin) / Math.max(1, tMax - tMin)) * innerW;
    const yOf = (a: number) => PAD.top + (1 - (a - aMin) / Math.max(1, aMax - aMin)) * innerH;

    const pts = transactions.map((t) => ({
      tx: t,
      x: xOf(new Date(t.ts).getTime()),
      y: yOf(t.amount),
      color: branches.get(t.branch) ?? "#9aa3ad",
    }));

    const dayMs = 24 * 60 * 60 * 1000;
    const startDay = Math.floor(tMin / dayMs) * dayMs;
    const xt: { x: number; label: string }[] = [];
    for (let d = startDay; d <= tMax + dayMs; d += dayMs) {
      if (d < tMin - dayMs / 2 || d > tMax + dayMs / 2) continue;
      xt.push({
        x: xOf(d),
        label: new Date(d).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
      });
    }

    const yStep = 500;
    const yStart = Math.floor(aMin / yStep) * yStep;
    const yEnd = Math.ceil(aMax / yStep) * yStep;
    const yt: { y: number; label: string; isThreshold: boolean }[] = [];
    for (let a = yStart; a <= yEnd; a += yStep) {
      if (a < aMin - 50 || a > aMax + 50) continue;
      yt.push({ y: yOf(a), label: "£" + (a / 1000).toFixed(1) + "k", isThreshold: a === CTR_THRESHOLD });
    }
    if (!yt.some((t) => t.isThreshold)) {
      yt.push({ y: yOf(CTR_THRESHOLD), label: "£10.0k", isThreshold: true });
    }

    return { points: pts, xTicks: xt, yTicks: yt, width: w };
  }, [transactions, branches]);

  const thresholdY = useMemo(() => {
    const t = yTicks.find((y) => y.isThreshold);
    return t?.y ?? PAD.top;
  }, [yTicks]);

  if (transactions.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-md border border-border/50 bg-card/30">
        <svg viewBox={`0 0 ${width} ${HEIGHT}`} className="h-[260px] w-full" preserveAspectRatio="none">
          {yTicks.map((t, i) => (
            <g key={`y-${i}`}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={t.y}
                y2={t.y}
                stroke={t.isThreshold ? "rgba(232,90,79,0.55)" : "rgba(255,255,255,0.06)"}
                strokeWidth={t.isThreshold ? 1 : 0.5}
                strokeDasharray={t.isThreshold ? "4 3" : undefined}
              />
              <text
                x={PAD.left - 8}
                y={t.y + 3}
                textAnchor="end"
                className={cn("font-mono", t.isThreshold ? "fill-risk-critical" : "fill-muted-foreground")}
                style={{ fontSize: "9px" }}
              >
                {t.label}
              </text>
            </g>
          ))}

          <text
            x={width - PAD.right - 4}
            y={thresholdY - 4}
            textAnchor="end"
            className="fill-risk-critical font-mono uppercase tracking-wider"
            style={{ fontSize: "8px" }}
          >
            CTR threshold
          </text>

          {xTicks.map((t, i) => (
            <g key={`x-${i}`}>
              <line
                x1={t.x}
                x2={t.x}
                y1={PAD.top}
                y2={HEIGHT - PAD.bottom}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth={0.5}
              />
              <text
                x={t.x}
                y={HEIGHT - PAD.bottom + 16}
                textAnchor="middle"
                className="fill-muted-foreground font-mono"
                style={{ fontSize: "9px" }}
              >
                {t.label}
              </text>
            </g>
          ))}

          {points.map((p) => {
            const isHovered = hovered === p.tx.id;
            const isPulsed = pulsed === p.tx.id;
            const dim = !!hovered && !isHovered;
            return (
              <g
                key={p.tx.id}
                onMouseEnter={() => setHovered(p.tx.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                {isPulsed && (
                  <circle cx={p.x} cy={p.y} r={14} fill={p.color} fillOpacity={0.18}>
                    <animate attributeName="r" from="8" to="22" dur="1.2s" repeatCount="1" />
                    <animate attributeName="fill-opacity" from="0.5" to="0" dur="1.2s" repeatCount="1" />
                  </circle>
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isPulsed ? 9 : isHovered ? 8 : 6}
                  fill={p.color}
                  fillOpacity={dim && !isPulsed ? 0.25 : 0.9}
                  stroke={isPulsed ? "#fff" : isHovered ? "#fff" : "rgba(0,0,0,0.4)"}
                  strokeWidth={isPulsed ? 2 : isHovered ? 1.5 : 0.5}
                  style={{ transition: "r 160ms ease-out" }}
                />
              </g>
            );
          })}

          {hovered &&
            (() => {
              const p = points.find((pt) => pt.tx.id === hovered);
              if (!p) return null;
              const tooltipW = 168;
              const tooltipH = 56;
              const tx = p.x + tooltipW + 12 > width ? p.x - tooltipW - 12 : p.x + 12;
              const ty = Math.max(PAD.top, Math.min(p.y - tooltipH / 2, HEIGHT - PAD.bottom - tooltipH));
              return (
                <g style={{ pointerEvents: "none" }}>
                  <rect
                    x={tx}
                    y={ty}
                    width={tooltipW}
                    height={tooltipH}
                    rx={4}
                    fill="rgba(15,18,22,0.95)"
                    stroke="rgba(255,255,255,0.15)"
                  />
                  <text
                    x={tx + 8}
                    y={ty + 14}
                    className="fill-foreground font-mono"
                    style={{ fontSize: "10px", fontWeight: 600 }}
                  >
                    {p.tx.id} · {formatGBP(p.tx.amount)}
                  </text>
                  <text x={tx + 8} y={ty + 28} className="fill-muted-foreground font-mono" style={{ fontSize: "9px" }}>
                    {p.tx.branch}
                  </text>
                  <text x={tx + 8} y={ty + 42} className="fill-muted-foreground font-mono" style={{ fontSize: "9px" }}>
                    {new Date(p.tx.ts).toLocaleString("en-GB", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </text>
                </g>
              );
            })()}
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {Array.from(branches.entries()).map(([branch, color]) => (
          <div
            key={branch}
            className="flex items-center gap-1.5 rounded-md border border-border/40 bg-card/30 px-2 py-1 font-mono text-[10px]"
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
            <span className="text-foreground/85">{branch}</span>
            <span className="tabular-nums text-muted-foreground">{counts.get(branch)} tx</span>
          </div>
        ))}
        {transactions.every((t) => t.amount < CTR_THRESHOLD) && (
          <div className="ml-auto font-mono text-[10px] text-risk-critical/80">
            all {transactions.length} deposits below £10,000 · structuring signature
          </div>
        )}
      </div>
    </div>
  );
}
