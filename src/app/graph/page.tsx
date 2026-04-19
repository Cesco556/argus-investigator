import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Network graph" };

export default function GraphPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <PageHeader
        eyebrow="Network forensics"
        title="Entity graph"
        description="Force-directed view of the resolved counterparty network."
      />
      <Card className="mt-6">
        <CardContent className="p-8">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Roadmap — Week 4
          </div>
          <h2 className="mt-1 text-base font-semibold">WebGL graph canvas</h2>
          <p className="mt-2 max-w-2xl text-sm text-foreground/85">
            Sigma.js + ForceAtlas2 layout over the resolved entity / transaction / sanctions graph. Nodes are coloured by
            anomaly score, edges carry weight from cumulative GBP flow, and hops-from-sanctions is surfaced visually.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-foreground/85">
            <li>
              <span className="font-medium">Today</span> — the entity and transaction data powering this view is already live in MCP (
              see Entities and Playbooks pages).
            </li>
            <li>
              <span className="font-medium">Week 4</span> — WebGL canvas + filter chips + "shortest path to sanctions" lens.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
