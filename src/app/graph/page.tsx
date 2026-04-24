import { PageHeader } from "@/components/shell/page-header";
import { NetworkGraph } from "@/components/graph/network-graph";
import { buildNetworkGraph, type NodeAttrs } from "@/lib/graph/build";
import { CASES } from "@/lib/data/fixtures";

export const metadata = { title: "Exposure graph" };

type SerializedNode = { key: string; attributes?: NodeAttrs };

export default function GraphPage() {
  const data = buildNetworkGraph();
  const ownerCount = data.nodes.filter((n: SerializedNode) => n.attributes?.kind === "owner").length;
  const branchCount = data.nodes.filter((n: SerializedNode) => n.attributes?.kind === "branch").length;
  const sanctionsCount = data.nodes.filter((n: SerializedNode) => n.attributes?.kind === "sanctions").length;
  const caseCount = CASES.length;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <PageHeader
        eyebrow="Exposure graph"
        title={`${sanctionsCount} sanctions hits trace through ${ownerCount} owners across ${branchCount} branches`}
        description={`${caseCount} open cases share the same owner graph. Click any node to trace the exposure path; use the chips top-left to strip layers.`}
      />
      <div className="mt-6">
        <NetworkGraph data={data} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 text-[11px] text-muted-foreground md:grid-cols-2">
        <p>
          Red nodes are the punchline: sanctions-list matches and high-anomaly entities. Owner nodes
          connect entities by beneficial-ownership share; branches aggregate the cash-deposit flow
          behind each case. The network is the evidence that the four cases are one investigation.
        </p>
        <p>
          Hover a node to isolate its direct neighbours. Click to open its evidence card. Turn off{" "}
          <span className="font-mono">owner</span> to see only the entity / case / branch skeleton,
          or{" "}
          <span className="font-mono">branch</span> to see just the corporate-ownership layer.
        </p>
      </div>
    </div>
  );
}
