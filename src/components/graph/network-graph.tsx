"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Graph from "graphology";
import type Sigma from "sigma";
import type { EdgeAttrs, NetworkSerializedGraph, NodeAttrs, NodeDetail, NodeKind } from "@/lib/graph/build";
import { cn } from "@/lib/utils";

const KINDS: NodeKind[] = ["entity", "owner", "case", "sanctions", "branch"];

const KIND_LABEL: Record<NodeKind, string> = {
  entity: "Entity",
  owner: "Owner",
  case: "Case",
  sanctions: "Sanctions",
  branch: "Branch",
};

const KIND_SWATCH: Record<NodeKind, string> = {
  entity: "bg-risk-critical",
  owner: "bg-muted-foreground",
  case: "bg-primary",
  sanctions: "bg-risk-critical",
  branch: "bg-risk-info",
};

export function NetworkGraph({ data }: { data: NetworkSerializedGraph }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma<NodeAttrs, EdgeAttrs> | null>(null);
  const [selected, setSelected] = useState<NodeDetail | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [filter, setFilter] = useState<Record<NodeKind, boolean>>({
    entity: true,
    owner: true,
    case: true,
    sanctions: true,
    branch: true,
  });
  const [showEdgeLabels, setShowEdgeLabels] = useState(false);
  const [ready, setReady] = useState(0);

  const graph = useMemo(() => {
    const g = new Graph<NodeAttrs, EdgeAttrs>({ multi: false, type: "undirected" });
    g.import(data);
    return g;
  }, [data]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;

    import("sigma").then(({ default: SigmaCtor }) => {
      if (cancelled || !containerRef.current) return;
      const renderer = new SigmaCtor<NodeAttrs, EdgeAttrs>(graph, containerRef.current, {
        renderLabels: true,
        renderEdgeLabels: false,
        labelColor: { color: "#d1d8de" },
        labelSize: 11,
        labelFont: "ui-sans-serif, system-ui, -apple-system, sans-serif",
        labelWeight: "500",
        labelDensity: 1,
        labelRenderedSizeThreshold: 5,
        edgeLabelColor: { color: "#8a95a0" },
        edgeLabelSize: 9,
        edgeLabelFont: "ui-monospace, SFMono-Regular, monospace",
        defaultEdgeColor: "rgba(255,255,255,0.18)",
        minCameraRatio: 0.3,
        maxCameraRatio: 3,
        zIndex: true,
      });
      sigmaRef.current = renderer;

      renderer.on("clickNode", ({ node }) => setSelected(graph.getNodeAttribute(node, "detail")));
      renderer.on("enterNode", ({ node }) => setHovered(node));
      renderer.on("leaveNode", () => setHovered(null));
      renderer.on("clickStage", () => setSelected(null));

      setReady((r) => r + 1);
    });

    return () => {
      cancelled = true;
      sigmaRef.current?.kill();
      sigmaRef.current = null;
    };
  }, [graph]);

  useEffect(() => {
    const renderer = sigmaRef.current;
    if (!renderer) return;

    renderer.setSetting("renderEdgeLabels", showEdgeLabels);

    renderer.setSetting("nodeReducer", (node, attrs) => {
      const a = attrs as NodeAttrs;
      const kindHidden = !filter[a.kind];
      const isHovered = hovered === node;
      const isNeighbor = !!hovered && hovered !== node && graph.hasEdge(node, hovered);
      const hasHover = !!hovered;
      const dim = hasHover && !isHovered && !isNeighbor;
      return {
        ...a,
        hidden: kindHidden,
        zIndex: isHovered ? 2 : isNeighbor ? 1 : 0,
        highlighted: isHovered,
        color: dim ? fade(a.color) : a.color,
        label: dim ? "" : a.label,
      };
    });

    renderer.setSetting("edgeReducer", (edge, attrs) => {
      const a = attrs as EdgeAttrs;
      const [s, t] = graph.extremities(edge);
      const sk = graph.getNodeAttribute(s, "kind");
      const tk = graph.getNodeAttribute(t, "kind");
      const kindHidden = !filter[sk] || !filter[tk];
      const touchesHover = !!hovered && (s === hovered || t === hovered);
      const hasHover = !!hovered;
      const dim = hasHover && !touchesHover;
      return {
        ...a,
        hidden: kindHidden,
        color: dim ? "rgba(255,255,255,0.05)" : touchesHover ? "rgba(255,255,255,0.6)" : a.color,
        size: touchesHover ? a.size + 1 : a.size,
      };
    });

    renderer.refresh();
  }, [graph, filter, hovered, showEdgeLabels, ready]);

  const counts = useMemo(() => {
    const c: Record<NodeKind, number> = {
      entity: 0,
      owner: 0,
      case: 0,
      sanctions: 0,
      branch: 0,
    };
    graph.forEachNode((_, attrs) => {
      c[attrs.kind] += 1;
    });
    return c;
  }, [graph]);

  return (
    <div className="relative h-[720px] overflow-hidden rounded-lg border border-border bg-card/30">
      <div ref={containerRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter((f) => ({ ...f, [k]: !f[k] }))}
            className={cn(
              "pointer-events-auto flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wider backdrop-blur transition-colors",
              filter[k]
                ? "border-border bg-card/80 text-foreground hover:border-primary/40"
                : "border-border/40 bg-card/30 text-muted-foreground/50 hover:text-muted-foreground",
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", KIND_SWATCH[k])} />
            {KIND_LABEL[k]}
            <span className="tabular-nums text-muted-foreground/70">{counts[k]}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowEdgeLabels((v) => !v)}
          className={cn(
            "pointer-events-auto rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wider backdrop-blur transition-colors",
            showEdgeLabels
              ? "border-border bg-card/80 text-foreground"
              : "border-border/40 bg-card/30 text-muted-foreground/50 hover:text-muted-foreground",
          )}
        >
          edge labels
        </button>
      </div>

      <div className="pointer-events-none absolute right-3 top-3 rounded-md border border-border bg-card/70 px-2.5 py-1.5 font-mono text-[10px] text-muted-foreground backdrop-blur">
        click · drag · scroll
      </div>

      {selected && <DetailPanel detail={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function fade(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "rgba(120,120,120,0.25)";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},0.2)`;
}

function DetailPanel({ detail, onClose }: { detail: NodeDetail; onClose: () => void }) {
  return (
    <div className="absolute bottom-3 left-3 w-[360px] max-w-[calc(100%-1.5rem)] rounded-lg border border-border bg-card/95 p-4 shadow-xl backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            {detail.kind}
          </div>
          <div className="mt-0.5 truncate text-sm font-semibold">{detailTitle(detail)}</div>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded border border-border/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>
      <dl className="mt-3 space-y-1 font-mono text-[11px]">
        {detailRows(detail).map((r) => (
          <div key={r.k} className="flex justify-between gap-3">
            <dt className="shrink-0 text-muted-foreground">{r.k}</dt>
            <dd className="min-w-0 text-right text-foreground/90">{r.v}</dd>
          </div>
        ))}
      </dl>
      {detail.kind === "entity" && (
        <p className="mt-3 border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
          {detail.business_description}
        </p>
      )}
    </div>
  );
}

function detailTitle(d: NodeDetail): string {
  switch (d.kind) {
    case "entity":
      return d.legal_name;
    case "owner":
      return d.name;
    case "case":
      return d.id;
    case "sanctions":
      return d.list.replaceAll("_", " ");
    case "branch":
      return d.branch;
  }
}

function detailRows(d: NodeDetail): { k: string; v: string }[] {
  switch (d.kind) {
    case "entity":
      return [
        { k: "entity_id", v: d.entity_id },
        { k: "jurisdiction", v: d.jurisdiction },
        { k: "type", v: d.entity_type },
        { k: "anomaly", v: d.score.toFixed(2) },
        { k: "incorporated", v: d.incorporation_date.slice(0, 7) },
        { k: "risk_flags", v: d.risk_flags.map((f) => f.replaceAll("_", " ")).join(", ") || "—" },
      ];
    case "owner":
      return [
        { k: "residence", v: d.residence },
        { k: "ownership", v: `${Math.round(d.ownership * 100)}%` },
        { k: "PEP", v: d.pep ? "yes" : "no" },
      ];
    case "case":
      return [
        { k: "typology", v: d.typology_label },
        { k: "severity", v: d.severity },
        { k: "risk", v: d.risk_score.toFixed(2) },
        { k: "summary", v: d.summary },
      ];
    case "sanctions":
      return [{ k: "list", v: d.list }];
    case "branch":
      return [
        { k: "transactions", v: String(d.transactions) },
        { k: "total", v: "£" + d.total_gbp.toLocaleString("en-GB") },
      ];
  }
}
