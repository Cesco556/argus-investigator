import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { env } from "@/lib/env";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const azureReady = Boolean(
    env.AZURE_OPENAI_ENDPOINT && env.AZURE_OPENAI_API_KEY && env.AZURE_OPENAI_DEPLOYMENT_NAME,
  );
  const anthropicReady = Boolean(env.ANTHROPIC_API_KEY);
  const activeProvider = azureReady ? "azure" : anthropicReady ? "anthropic" : "none";

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Runtime configuration surfaced from the server. Editable UI for this lands post-ship."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Agent provider
            </div>
            <h2 className="mt-1 text-base font-semibold">Active: {activeProvider}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <ProviderRow
                name="Azure OpenAI"
                ready={azureReady}
                detail={azureReady ? env.AZURE_OPENAI_DEPLOYMENT_NAME ?? "deployment set" : "AZURE_OPENAI_* not set"}
              />
              <ProviderRow
                name="Anthropic"
                ready={anthropicReady}
                detail={anthropicReady ? "claude-opus-4-7" : "ANTHROPIC_API_KEY not set"}
              />
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              MCP server
            </div>
            <h2 className="mt-1 text-base font-semibold">Argus tool surface</h2>
            <div className="mt-3 space-y-2 text-sm">
              <Row label="Endpoint" value={env.MCP_SERVER_URL} mono />
              <Row label="Transport" value="Streamable HTTP · stateless" />
              <Row label="Tools" value="query_transactions · pull_entity_profile · sanctions_check · search_typology_playbook · fetch_regulatory_intel" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Upstream engine
            </div>
            <h2 className="mt-1 text-base font-semibold">AML Transaction Monitoring Engine</h2>
            <div className="mt-3 space-y-2 text-sm">
              <Row label="URL" value={env.AML_ENGINE_URL} mono />
              <Row label="Status" value="fixture-backed · live wiring deferred" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Suspicion Trail
            </div>
            <h2 className="mt-1 text-base font-semibold">Decision audit log</h2>
            <div className="mt-3 space-y-2 text-sm">
              <Row label="Persistence" value="MongoDB Atlas (append-only)" />
              <Row label="Indexed by" value="caseId · traceId · ts" />
              <Row label="Records" value="agent tool calls + analyst dispositions (SAR/dismiss/defer)" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProviderRow({ name, ready, detail }: { name: string; ready: boolean; detail: string }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-md border border-border/40 bg-card/30 px-3 py-2">
      <div className="min-w-0">
        <div className="truncate font-medium">{name}</div>
        <div className="truncate font-mono text-[10px] text-muted-foreground">{detail}</div>
      </div>
      <Badge variant="outline" className="gap-1.5 font-mono text-[10px] uppercase tracking-wider">
        <span className={`h-1.5 w-1.5 rounded-full ${ready ? "bg-risk-low" : "bg-risk-medium"}`} />
        {ready ? "ready" : "unset"}
      </Badge>
    </li>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-2 last:border-0 last:pb-0">
      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className={`min-w-0 truncate text-right text-foreground/85 ${mono ? "font-mono text-[11px]" : "text-sm"}`}>
        {value}
      </span>
    </div>
  );
}
