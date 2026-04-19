import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import { env } from "@/lib/env";

let clientPromise: Promise<MCPClient> | null = null;

export function getMCPClient(): Promise<MCPClient> {
  if (!clientPromise) {
    clientPromise = createMCPClient({
      transport: {
        type: "http",
        url: env.MCP_SERVER_URL,
      },
    }).catch((err) => {
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

export async function getMCPTools() {
  const client = await getMCPClient();
  return client.tools();
}
