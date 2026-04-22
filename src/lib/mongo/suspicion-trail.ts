import { randomUUID } from "node:crypto";
import type { Collection } from "mongodb";
import { getDb } from "./client";

const COLLECTION = "suspicion_trail";

export type TrailOutcome =
  | { success: true; output: unknown; durationMs: number }
  | { success: false; error: string; durationMs: number };

export interface TrailEvent {
  caseId: string;
  traceId: string;
  ts: Date;
  stepNumber: number | null;
  tool: { name: string; input: unknown };
  outcome: TrailOutcome;
  model: { provider: string; id: string };
}

let indexPromise: Promise<void> | null = null;

async function collection(): Promise<Collection<TrailEvent>> {
  const db = await getDb();
  const col = db.collection<TrailEvent>(COLLECTION);
  if (!indexPromise) {
    indexPromise = col
      .createIndexes([
        { key: { caseId: 1, ts: 1 }, name: "case_ts" },
        { key: { traceId: 1 }, name: "trace" },
        { key: { ts: -1 }, name: "ts_desc" },
      ])
      .then(() => void 0)
      .catch((err) => {
        indexPromise = null;
        throw err;
      });
  }
  await indexPromise;
  return col;
}

export function newTraceId(): string {
  return randomUUID();
}

export async function recordEvent(event: TrailEvent): Promise<void> {
  const col = await collection();
  await col.insertOne(event);
}

export async function getTrail(caseId: string, limit = 200): Promise<TrailEvent[]> {
  const col = await collection();
  return col
    .find({ caseId }, { projection: { _id: 0 } })
    .sort({ ts: 1 })
    .limit(limit)
    .toArray();
}

const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export async function getRecentCases(limit = 20): Promise<Array<{ caseId: string; lastActivity: Date; events: number }>> {
  const col = await collection();
  const since = new Date(Date.now() - RECENT_WINDOW_MS);
  const rows = await col
    .aggregate<{ _id: string; lastActivity: Date; events: number }>(
      [
        { $match: { ts: { $gte: since } } },
        { $group: { _id: "$caseId", lastActivity: { $max: "$ts" }, events: { $sum: 1 } } },
        { $sort: { lastActivity: -1 } },
        { $limit: limit },
      ],
      { hint: "ts_desc" },
    )
    .toArray();
  return rows.map((r) => ({ caseId: r._id, lastActivity: r.lastActivity, events: r.events }));
}
