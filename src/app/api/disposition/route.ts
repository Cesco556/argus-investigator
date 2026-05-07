import { z } from "zod";
import { newTraceId, recordEvent } from "@/lib/mongo/suspicion-trail";
import { mongoConfigured } from "@/lib/mongo/client";

export const runtime = "nodejs";

const MAX_NOTE_CHARS = 4000;

const bodySchema = z.object({
  caseId: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[A-Za-z0-9_\-:.]+$/),
  decision: z.enum(["file_sar", "dismiss", "defer"]),
  note: z.string().max(MAX_NOTE_CHARS).default(""),
  decidedBy: z.string().min(1).max(120).default("current analyst"),
  at: z.iso.datetime().optional(),
});

export async function POST(req: Request) {
  if (!mongoConfigured) {
    return Response.json({ ok: false, reason: "mongo_not_configured" }, { status: 503 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request body", issues: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const { caseId, decision, note, decidedBy, at } = parsed.data;
  const ts = at ? new Date(at) : new Date();
  const startedAt = Date.now();

  try {
    // Each disposition is its own atomic event — the analyst's decision can happen
    // outside any specific agent conversation turn, so we mint a fresh traceId
    // rather than reusing the most recent agent traceId. The trail UI groups events
    // by traceId and renders solo dispositions as their own audit card.
    await recordEvent({
      caseId,
      traceId: newTraceId(),
      ts,
      stepNumber: null,
      tool: { name: "disposition.commit", input: { decision, note, decidedBy } },
      outcome: {
        success: true,
        output: { stored: true },
        durationMs: Date.now() - startedAt,
      },
      model: { provider: "human", id: "analyst" },
    });
  } catch (err) {
    console.error("[disposition] recordEvent failed", err);
    return Response.json({ ok: false, reason: "write_failed" }, { status: 500 });
  }

  return Response.json({ ok: true }, { status: 200 });
}
