import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";
import { z } from "zod";
import { getAgentModel } from "@/lib/agent/provider";
import { getMCPTools } from "@/lib/agent/mcp-client";
import { buildSystemPrompt } from "@/lib/agent/system-prompt";
import { newTraceId, recordEvent } from "@/lib/mongo/suspicion-trail";
import { mongoConfigured } from "@/lib/mongo/client";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BODY_BYTES = 64 * 1024;
const MAX_MESSAGES = 50;

// Matches the AI SDK v6 `UIMessage` shape closely enough for boundary validation:
// id + role + parts (array). Part shapes themselves are validated downstream by
// `convertToModelMessages`. We accept the structural cost of one `as unknown as`
// at the trust boundary because z.unknown() in `parts` cannot statically assert
// the AI SDK's discriminated-union part type, and tightening further would
// duplicate ~200 lines of upstream type definitions.
const uiMessageSchema = z
  .object({
    id: z.string().min(1).max(128),
    role: z.enum(["system", "user", "assistant"]),
    parts: z.array(z.unknown()).min(1),
  })
  .passthrough();

const bodySchema = z.object({
  messages: z.array(uiMessageSchema).min(1).max(MAX_MESSAGES),
  caseId: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[A-Za-z0-9_\-:.]+$/)
    .optional(),
});

export async function POST(req: Request) {
  if (env.INVESTIGATOR_API_TOKEN) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${env.INVESTIGATOR_API_TOKEN}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return new Response("Payload too large", { status: 413 });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const result = bodySchema.safeParse(parsedJson);
  if (!result.success) {
    return Response.json(
      { error: "Invalid request body", issues: z.treeifyError(result.error) },
      { status: 400 },
    );
  }
  const { messages, caseId } = result.data;

  let model;
  let provider: ReturnType<typeof getAgentModel>["provider"];
  let modelId: ReturnType<typeof getAgentModel>["modelId"];
  try {
    ({ model, provider, modelId } = getAgentModel());
  } catch (err) {
    return new Response(
      `Agent provider not configured: ${err instanceof Error ? err.message : String(err)}`,
      { status: 503 },
    );
  }

  let tools: Awaited<ReturnType<typeof getMCPTools>> | undefined;
  try {
    tools = await getMCPTools();
  } catch (err) {
    console.error("[agent] MCP unavailable, continuing without tools", err);
    tools = undefined;
  }

  const traceId = newTraceId();
  const shouldLog = mongoConfigured && Boolean(caseId);

  const stream = streamText({
    model,
    system: buildSystemPrompt(caseId),
    // Boundary cast — Zod validates id/role/parts shape; the discriminated-union
    // type of individual parts is validated by convertToModelMessages itself.
    messages: await convertToModelMessages(messages as unknown as UIMessage[]),
    tools,
    stopWhen: stepCountIs(6),
    temperature: 0.2,
    experimental_onToolCallFinish: shouldLog
      ? (event) => {
          const outcome = event.success
            ? { success: true as const, output: event.output, durationMs: event.durationMs }
            : {
                success: false as const,
                error: event.error instanceof Error ? event.error.message : String(event.error),
                durationMs: event.durationMs,
              };
          recordEvent({
            caseId: caseId!,
            traceId,
            ts: new Date(),
            stepNumber: event.stepNumber ?? null,
            tool: { name: event.toolCall.toolName, input: event.toolCall.input },
            outcome,
            model: { provider, id: modelId },
          }).catch((err) => console.error("[suspicion-trail] recordEvent failed", err));
        }
      : undefined,
  });

  return stream.toUIMessageStreamResponse({
    headers: {
      "x-agent-provider": provider,
      "x-agent-model": modelId,
      "x-agent-tool-source": tools ? "mcp" : "none",
      "x-agent-trace-id": traceId,
    },
  });
}
