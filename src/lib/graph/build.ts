import Graph from "graphology";
import { ENTITIES, CASES, SANCTIONS, TRANSACTIONS, type Entity } from "@/lib/data/fixtures";

export type NodeKind = "entity" | "owner" | "case" | "sanctions" | "branch";

export type NodeDetail =
  | {
      kind: "entity";
      entity_id: string;
      legal_name: string;
      jurisdiction: string;
      entity_type: string;
      score: number;
      risk_flags: string[];
      incorporation_date: string;
      business_description: string;
    }
  | { kind: "owner"; name: string; residence: string; pep: boolean; ownership: number }
  | { kind: "case"; id: string; typology_label: string; severity: string; risk_score: number; summary: string }
  | { kind: "sanctions"; list: string }
  | { kind: "branch"; branch: string; transactions: number; total_gbp: number };

export interface NodeAttrs {
  label: string;
  kind: NodeKind;
  size: number;
  color: string;
  x: number;
  y: number;
  detail: NodeDetail;
  activatesAt: number | null;
}

export interface EdgeAttrs {
  kind: "owns" | "subject" | "sanctions_hit" | "branch_flow";
  size: number;
  color: string;
  label?: string;
}

export type NetworkSerializedGraph = ReturnType<Graph<NodeAttrs, EdgeAttrs>["export"]>;

const ENTITY_COLOR = {
  critical: "#e85a4f",
  high: "#e29354",
  medium: "#d2b34e",
  low: "#3bc48a",
} as const;

const OWNER_COLOR = "#9aa3ad";
const CASE_COLOR = "#e3a955";
const SANCTIONS_COLOR = "#e85a4f";
const BRANCH_COLOR = "#4eabe0";

function entityTier(e: Entity): keyof typeof ENTITY_COLOR {
  const s = e.isolation_forest_score;
  if (s >= 0.9) return "critical";
  if (s >= 0.8) return "high";
  if (s >= 0.6) return "medium";
  return "low";
}

function slug(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "-");
}

// Hand-authored layout.
// Columns left→right tell the investigation: sanctions → owners → entities → cases → branches.
// Row order within each column is chosen to keep edge crossings near zero.
const POSITIONS: Record<string, { x: number; y: number }> = {
  "sanc:OFAC_SDN": { x: -12, y: 7 },
  "sanc:EU_consolidated": { x: -12, y: -7 },

  "owner:viktor-petrenko": { x: -5, y: 7 },
  "owner:arthur-linwood": { x: -5, y: 3 },
  "owner:chinedu-obi": { x: -5, y: 0 },
  "owner:layla-harding": { x: -5, y: -3 },
  "owner:marta-velásquez": { x: -5, y: -5 },
  "owner:konstantin-reiner": { x: -5, y: -7 },

  "meridian-trade-ltd": { x: 2, y: 7 },
  "helix-capital-partners": { x: 2, y: 3 },
  "ardent-logistics-group": { x: 2, y: -2 },
  "orion-holdings-llc": { x: 2, y: -7 },

  "case:ALT-20260419-0019": { x: 9, y: 7 },
  "case:ALT-20260419-0028": { x: 9, y: 3 },
  "case:ALT-20260419-0022": { x: 9, y: -2 },
  "case:ALT-20260419-0031": { x: 9, y: -7 },

  "br:aberdeen-·-br-02": { x: 16, y: -4 },
  "br:glasgow-·-br-11": { x: 16, y: -7 },
  "br:edinburgh-·-br-05": { x: 16, y: -10 },
};

function posOf(id: string): { x: number; y: number } {
  return POSITIONS[id] ?? { x: 0, y: 0 };
}

export function buildNetworkGraph(): NetworkSerializedGraph {
  const g = new Graph<NodeAttrs, EdgeAttrs>({ multi: false, type: "undirected" });

  const branchStats = new Map<string, { count: number; total: number; caseIds: Set<string>; firstTs: number }>();
  const caseFirstTs = new Map<string, number>();
  for (const t of TRANSACTIONS) {
    const ts = new Date(t.ts).getTime();
    const b = branchStats.get(t.branch) ?? { count: 0, total: 0, caseIds: new Set<string>(), firstTs: ts };
    b.count += 1;
    b.total += t.amount;
    b.caseIds.add(t.case_id);
    if (ts < b.firstTs) b.firstTs = ts;
    branchStats.set(t.branch, b);
    const prev = caseFirstTs.get(t.case_id);
    if (prev === undefined || ts < prev) caseFirstTs.set(t.case_id, ts);
  }

  for (const e of Object.values(ENTITIES)) {
    g.addNode(e.entity_id, {
      label: e.legal_name,
      kind: "entity",
      size: 10 + e.isolation_forest_score * 16,
      color: ENTITY_COLOR[entityTier(e)],
      ...posOf(e.entity_id),
      activatesAt: null,
      detail: {
        kind: "entity",
        entity_id: e.entity_id,
        legal_name: e.legal_name,
        jurisdiction: e.jurisdiction,
        entity_type: e.entity_type,
        score: e.isolation_forest_score,
        risk_flags: e.risk_flags,
        incorporation_date: e.incorporation_date,
        business_description: e.business_description,
      },
    });

    for (const o of e.beneficial_owners) {
      const ownerId = `owner:${slug(o.name)}`;
      if (!g.hasNode(ownerId)) {
        g.addNode(ownerId, {
          label: o.name,
          kind: "owner",
          size: 6,
          color: OWNER_COLOR,
          ...posOf(ownerId),
          activatesAt: null,
          detail: {
            kind: "owner",
            name: o.name,
            residence: o.residence,
            pep: o.pep,
            ownership: o.ownership,
          },
        });
      }
      g.addEdge(ownerId, e.entity_id, {
        kind: "owns",
        size: 1 + o.ownership * 1.5,
        color: "rgba(154,163,173,0.35)",
        label: `${Math.round(o.ownership * 100)}%`,
      });

      for (const h of SANCTIONS[slug(o.name)] ?? []) {
        const sancId = `sanc:${h.list}`;
        if (!g.hasNode(sancId)) {
          g.addNode(sancId, {
            label: h.list.replaceAll("_", " "),
            kind: "sanctions",
            size: 18,
            color: SANCTIONS_COLOR,
            ...posOf(sancId),
            activatesAt: null,
            detail: { kind: "sanctions", list: h.list },
          });
        }
        g.addEdge(ownerId, sancId, {
          kind: "sanctions_hit",
          size: 2,
          color: "rgba(232,90,79,0.7)",
          label: `match ${h.match_score.toFixed(2)}`,
        });
      }
    }
  }

  for (const c of CASES) {
    const caseNodeId = `case:${c.id}`;
    g.addNode(caseNodeId, {
      label: c.id,
      kind: "case",
      size: 9 + c.risk_score * 6,
      color: CASE_COLOR,
      ...posOf(caseNodeId),
      activatesAt: caseFirstTs.get(c.id) ?? null,
      detail: {
        kind: "case",
        id: c.id,
        typology_label: c.typology_label,
        severity: c.severity,
        risk_score: c.risk_score,
        summary: c.summary,
      },
    });
    if (c.subject_entity_id && g.hasNode(c.subject_entity_id)) {
      g.addEdge(caseNodeId, c.subject_entity_id, {
        kind: "subject",
        size: 1.8,
        color: "rgba(227,169,85,0.55)",
      });
    }
  }

  for (const [branch, stats] of branchStats) {
    const branchId = `br:${slug(branch)}`;
    g.addNode(branchId, {
      label: branch,
      kind: "branch",
      size: 6 + Math.log2(stats.count + 1) * 2,
      color: BRANCH_COLOR,
      ...posOf(branchId),
      activatesAt: stats.firstTs,
      detail: {
        kind: "branch",
        branch,
        transactions: stats.count,
        total_gbp: stats.total,
      },
    });
    for (const cid of stats.caseIds) {
      const caseNodeId = `case:${cid}`;
      if (g.hasNode(caseNodeId)) {
        g.addEdge(caseNodeId, branchId, {
          kind: "branch_flow",
          size: 1 + Math.log2(stats.count + 1),
          color: "rgba(78,171,224,0.45)",
          label: `${stats.count} tx`,
        });
      }
    }
  }

  return g.export();
}
