import { z } from "zod";

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  AZURE_OPENAI_ENDPOINT: z.url().optional(),
  AZURE_OPENAI_API_KEY: z.string().min(1).optional(),
  AZURE_OPENAI_DEPLOYMENT_NAME: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  AML_ENGINE_URL: z.url().default("http://139.59.182.126:8000"),
  MCP_SERVER_URL: z.url().default("http://127.0.0.1:3333/mcp"),
  MCP_AUTH_TOKEN: z.string().min(1).optional(),
  MONGODB_URI: z.string().startsWith("mongodb").optional(),
  MONGODB_DB_NAME: z.string().min(1).default("argus"),
  AGENT_MODEL: z.enum(["anthropic:sonnet", "anthropic:opus", "azure:mini"]).optional(),
  INVESTIGATOR_API_TOKEN: z.string().min(16).optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("Argus"),
});

const parsedServer = serverSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT,
  AZURE_OPENAI_API_KEY: process.env.AZURE_OPENAI_API_KEY,
  AZURE_OPENAI_DEPLOYMENT_NAME: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  AML_ENGINE_URL: process.env.AML_ENGINE_URL,
  MCP_SERVER_URL: process.env.MCP_SERVER_URL,
  MCP_AUTH_TOKEN: process.env.MCP_AUTH_TOKEN,
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
  AGENT_MODEL: process.env.AGENT_MODEL,
  INVESTIGATOR_API_TOKEN: process.env.INVESTIGATOR_API_TOKEN,
});

if (!parsedServer.success) {
  console.error("Invalid server environment:", z.treeifyError(parsedServer.error));
  throw new Error("Invalid server environment variables");
}

const parsedClient = clientSchema.safeParse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
});

if (!parsedClient.success) {
  throw new Error("Invalid client environment variables");
}

export const env = {
  ...parsedServer.data,
  ...parsedClient.data,
};

export const hasAgentProvider = Boolean(
  parsedServer.data.AZURE_OPENAI_ENDPOINT && parsedServer.data.AZURE_OPENAI_API_KEY,
) || Boolean(parsedServer.data.ANTHROPIC_API_KEY);
