import { PageHeader } from "@/components/shell/page-header";
import { NetworkGraph } from "@/components/graph/network-graph";
import { buildNetworkGraph } from "@/lib/graph/build";

export const metadata = { title: "Network graph" };

export default function GraphPage() {
  const data = buildNetworkGraph();
  const entityCount = data.nodes.filter((n) => n.attributes?.kind === "entity").length;
  const sanctionsCount = data.nodes.filter((n) => n.attributes?.kind === "sanctions").length;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <PageHeader
        eyebrow="Network forensics"
        title="Entity graph"
        description={`${entityCount} resolved entities · ${data.nodes.length} nodes · ${data.edges.length} edges · ${sanctionsCount} sanctions list hit${sanctionsCount === 1 ? "" : "s"}. Force-directed WebGL view of the counterparty network.`}
      />
      <div className="mt-6">
        <NetworkGraph data={data} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 text-[11px] text-muted-foreground md:grid-cols-2">
        <p>
          Entity nodes are sized by Isolation-Forest anomaly score and coloured by risk tier. Owner
          nodes attach by beneficial-ownership share; sanctions-list nodes attach to matched owners;
          cases attach to their subject entity; branches aggregate the transactions seen for each case.
        </p>
        <p>
          Hover a node to isolate its direct neighbours. Click to open its evidence card. Use the
          chips top-left to filter by node kind — for example, turn off <span className="font-mono">owner</span>
          to see only the entity / case / branch skeleton.
        </p>
      </div>
    </div>
  );
}
