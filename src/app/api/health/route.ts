import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProbeResult = {
  ok: boolean;
  latency_ms: number | null;
  error?: string;
};

async function probe(url: string, timeoutMs = 1500): Promise<ProbeResult> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: "GET", signal: controller.signal, cache: "no-store" });
    const latency_ms = Date.now() - started;
    if (!res.ok) return { ok: false, latency_ms, error: `http_${res.status}` };
    return { ok: true, latency_ms };
  } catch (err) {
    return {
      ok: false,
      latency_ms: Date.now() - started,
      error: err instanceof Error ? err.name.toLowerCase() : "fetch_error",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  const mcpHealthUrl = env.MCP_SERVER_URL.replace(/\/mcp\/?$/, "/healthz");
  const mcp = await probe(mcpHealthUrl);
  const providerConfigured = Boolean(
    (env.AZURE_OPENAI_ENDPOINT && env.AZURE_OPENAI_API_KEY) || env.ANTHROPIC_API_KEY,
  );

  return Response.json(
    {
      ok: mcp.ok && providerConfigured,
      mcp,
      agent: { configured: providerConfigured },
      ts: new Date().toISOString(),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
