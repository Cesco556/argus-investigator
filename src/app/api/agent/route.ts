import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";
import { getAgentModel } from "@/lib/agent/provider";
import { getMCPTools } from "@/lib/agent/mcp-client";
import { buildSystemPrompt } from "@/lib/agent/system-prompt";
import { newTraceId, recordEvent } from "@/lib/mongo/suspicion-trail";
import { mongoConfigured } from "@/lib/mongo/client";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, caseId }: { messages: UIMessage[]; caseId?: string } = await req.json();

  const { model, provider, modelId } = getAgentModel();
  const tools = await getMCPTools();

  const traceId = newTraceId();
  const shouldLog = mongoConfigured && Boolean(caseId);

  const result = streamText({
    model,
    system: buildSystemPrompt(caseId),
    messages: await convertToModelMessages(messages),
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

  return result.toUIMessageStreamResponse({
    headers: {
      "x-agent-provider": provider,
      "x-agent-model": modelId,
      "x-agent-tool-source": "mcp",
      "x-agent-trace-id": traceId,
    },
  });
}
