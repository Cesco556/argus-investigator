"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { usePlayheadStore } from "@/lib/stores/playhead-store";
import { cn } from "@/lib/utils";

const PLAY_DURATION_MS = 12000;

function fmtDay(ts: number, originMs: number): string {
  const dayMs = 24 * 60 * 60 * 1000;
  const dayIndex = Math.max(0, Math.floor((ts - originMs) / dayMs));
  return `Day ${dayIndex + 1}`;
}

function fmtAbs(ts: number): string {
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function PlayheadScrubber() {
  const domain = usePlayheadStore((s) => s.domain);
  const current = usePlayheadStore((s) => s.current);
  const setCurrent = usePlayheadStore((s) => s.setCurrent);

  const [playing, setPlaying] = useState(false);
  const animRef = useRef<number | null>(null);
  const playStartRef = useRef<{ wallClock: number; from: number } | null>(null);

  useEffect(() => {
    return () => {
      if (animRef.current != null) cancelAnimationFrame(animRef.current);
    };
  }, []);

  useEffect(() => {
    if (!playing || !domain) return;
    // Capture the starting position once at play-time. Reading `current` from the store
    // (rather than from this hook's closure) keeps the play span linear — including
    // `current` in the deps array would re-base wallClock every frame and produce a
    // Zeno-paradox sweep that never reaches max.
    const startFrom = (() => {
      const live = usePlayheadStore.getState().current;
      return live != null && live < domain.max ? live : domain.min;
    })();
    playStartRef.current = { wallClock: performance.now(), from: startFrom };

    const tick = (now: number) => {
      const ref = playStartRef.current;
      if (!ref || !domain) return;
      const elapsed = now - ref.wallClock;
      const span = domain.max - ref.from;
      const next = ref.from + (elapsed / PLAY_DURATION_MS) * span;
      if (next >= domain.max) {
        setCurrent(domain.max);
        setPlaying(false);
        return;
      }
      setCurrent(next);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current != null) cancelAnimationFrame(animRef.current);
    };
  }, [playing, domain, setCurrent]);

  const labels = useMemo(() => {
    if (!domain) return null;
    const value = current ?? domain.max;
    return {
      day: fmtDay(value, domain.min),
      abs: fmtAbs(value),
      progressPct: ((value - domain.min) / (domain.max - domain.min)) * 100,
    };
  }, [domain, current]);

  if (!domain) return null;

  const value = current ?? domain.max;
  const showingAll = current == null || current >= domain.max;

  return (
    <div className="rounded-lg border border-border bg-card/40 px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
            playing
              ? "border-primary/60 bg-primary/10 text-primary"
              : "border-border hover:border-primary/40 hover:text-primary",
          )}
          aria-label={playing ? "Pause playhead" : "Play timeline"}
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>

        <div className="flex-1">
          <input
            type="range"
            min={domain.min}
            max={domain.max}
            step={Math.max(1, Math.floor((domain.max - domain.min) / 600))}
            value={value}
            onChange={(e) => {
              setPlaying(false);
              setCurrent(Number(e.target.value));
            }}
            aria-label="Investigation timeline scrubber"
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setCurrent(null);
          }}
          className="flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          aria-label="Reset playhead — show all"
        >
          <RotateCcw className="h-3 w-3" />
          show all
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{showingAll ? "Showing entire investigation window" : `Reveal up to ${labels?.day} · ${labels?.abs}`}</span>
        <span className="tabular-nums">{labels ? `${labels.progressPct.toFixed(0)}%` : ""}</span>
      </div>
    </div>
  );
}
