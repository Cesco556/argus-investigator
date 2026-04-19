import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";
import { getAgentModel } from "@/lib/agent/provider";
import { getMCPTools } from "@/lib/agent/mcp-client";
import { INVESTIGATOR_SYSTEM_PROMPT } from "@/lib/agent/system-prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const { model, provider, modelId } = getAgentModel();
  const tools = await getMCPTools();

  const result = streamText({
    model,
    system: INVESTIGATOR_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(6),
    temperature: 0.2,
  });

  return result.toUIMessageStreamResponse({
    headers: {
      "x-agent-provider": provider,
      "x-agent-model": modelId,
      "x-agent-tool-source": "mcp",
    },
  });
}
