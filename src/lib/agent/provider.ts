import { createAzure } from "@ai-sdk/azure";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";
import { env } from "@/lib/env";

export type AgentProvider = "anthropic" | "azure";
export type AgentModelId = "anthropic:sonnet" | "anthropic:opus" | "azure:mini";

const ANTHROPIC_MODEL_NAME: Record<"sonnet" | "opus", string> = {
  sonnet: "claude-sonnet-4-6",
  opus: "claude-opus-4-7",
};

function resolveModelId(): AgentModelId {
  if (env.AGENT_MODEL) return env.AGENT_MODEL;
  if (env.ANTHROPIC_API_KEY) return "anthropic:sonnet";
  if (env.AZURE_OPENAI_ENDPOINT && env.AZURE_OPENAI_API_KEY && env.AZURE_OPENAI_DEPLOYMENT_NAME) {
    return "azure:mini";
  }
  throw new Error(
    "No agent provider configured. Set ANTHROPIC_API_KEY or AZURE_OPENAI_* in .env.local",
  );
}

export const AGENT_MODEL_LABEL: Record<AgentModelId, string> = {
  "anthropic:sonnet": "Claude Sonnet 4.6",
  "anthropic:opus": "Claude Opus 4.7",
  "azure:mini": "GPT-5.4-mini",
};

export function getAgentModelLabel(): string {
  return AGENT_MODEL_LABEL[resolveModelId()];
}

export function getAgentModel(): {
  model: LanguageModel;
  provider: AgentProvider;
  modelId: AgentModelId;
} {
  const modelId = resolveModelId();

  if (modelId.startsWith("anthropic:")) {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error(`AGENT_MODEL=${modelId} requires ANTHROPIC_API_KEY in .env.local`);
    }
    const variant = modelId === "anthropic:opus" ? "opus" : "sonnet";
    const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });
    return {
      model: anthropic(ANTHROPIC_MODEL_NAME[variant]),
      provider: "anthropic",
      modelId,
    };
  }

  if (!env.AZURE_OPENAI_ENDPOINT || !env.AZURE_OPENAI_API_KEY || !env.AZURE_OPENAI_DEPLOYMENT_NAME) {
    throw new Error(`AGENT_MODEL=${modelId} requires AZURE_OPENAI_* in .env.local`);
  }
  const resourceName = new URL(env.AZURE_OPENAI_ENDPOINT).hostname.split(".")[0];
  const azure = createAzure({ resourceName, apiKey: env.AZURE_OPENAI_API_KEY });
  return {
    model: azure(env.AZURE_OPENAI_DEPLOYMENT_NAME),
    provider: "azure",
    modelId,
  };
}
