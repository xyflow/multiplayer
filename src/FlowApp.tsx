import { useCallback, useState } from "react";
import { toast } from "sonner";
import { X, Share2 } from "lucide-react";
import {
  ReactFlowProvider,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type XYPosition,
} from "@xyflow/react";

import {
  JazzNode,
  JazzEdge,
  type DeeplyLoadedJazzFlow,
  type JazzNodeType,
  type JazzEdgeType,
} from "./state/schema";
import { Button } from "@/components/ui/button";

import { Flow } from "./flow";
import { Group } from "jazz-tools";

function App({
  flow,
  exitFlow,
}: {
  flow: DeeplyLoadedJazzFlow;
  exitFlow: () => void;
}) {
  const [cache, setCache] = useState<
    Map<string, { jazzNode: JazzNodeType; node: Node }>
  >(new Map());

  const [edgeCache, setEdgeCache] = useState<
    Map<string, { jazzEdge: JazzEdgeType; edge: Edge }>
  >(new Map());

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      changes.forEach((change) => {
        switch (change.type) {
          case "dimensions": {
            const cached = cache.get(change.id);
            if (!cached) return;
            cached.node = { ...cached.node, measured: change.dimensions };
            break;
          }

          case "position": {
            if (!change.position) return;
            const cached = cache.get(change.id);
            if (!cached) return;
            cached.jazzNode.position = change.position;
            break;
          }

          case "select": {
            const cached = cache.get(change.id);
            if (!cached) return;
            cached.node = { ...cached.node, selected: change.selected };
            break;
          }

          // TODO: Implement replace
          // case "replace": {
          //   const cached = cache.get(change.id);
          //   if (!cached || !change.item) return;
          //   // Update the jazz node with new data
          //   Object.assign(cached.jazzNode, change.item);
          //   // Update the cached node
          //   cached.node = { ...cached.node, ...change.item };
          //   break;
          // }

          case "remove": {
            cache.delete(change.id);
            const index = flow.nodes.findIndex((node) => node.id === change.id);
            if (index !== -1) {
              flow.nodes.splice(index, 1);
            }
            break;
          }
          // TODO: Implement add
          // case "add": {
          //   if (!change.item) return;
          //   // Add to flow.nodes
          //   const jazzNode = JazzNode.create({
          //     type: change.item.type || "default",
          //     position: change.item.position || { x: 0, y: 0 },
          //     data: { label: "New Node" },
          //   });
          //   flow.nodes.push(jazzNode);
          //   break;
          // }
        }
      });
      setCache(new Map(cache));
    },
    [cache, flow.nodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      changes.forEach((change) => {
        switch (change.type) {
          case "select": {
            const cached = edgeCache.get(change.id);
            if (!cached) return;
            cached.edge = { ...cached.edge, selected: change.selected };
            break;
          }

          case "remove": {
            edgeCache.delete(change.id);
            const index = flow.edges.findIndex((edge) => edge.id === change.id);
            if (index !== -1) {
              flow.edges.splice(index, 1);
            }
            break;
          }

          // TODO: Implement replace
          // case "replace": {
          //   const cached = edgeCache.get(change.id);
          //   if (!cached || !change.item) return;
          //   // Update the jazz edge with new data
          //   Object.assign(cached.jazzEdge, change.item);
          //   // Update the cached edge
          //   cached.edge = { ...cached.edge, ...change.item };
          //   break;
          // }

          // TODO: Implement add
          // case "add": {
          //   if (!change.item) return;
          //   // Add to flow.edges
          //   const jazzEdge = JazzEdge.create({
          //     type: change.item.type || "default",
          //     source: change.item.source,
          //     target: change.item.target,
          //     sourceHandle: change.item.sourceHandle,
          //     targetHandle: change.item.targetHandle,
          //   });
          //   flow.edges.push(jazzEdge);
          //   break;
          // }
        }
      });
      setEdgeCache(new Map(edgeCache));
    },
    [edgeCache, flow.edges]
  );

  const nodes = flow.nodes.map((node) => {
    const cached = cache.get(node.id);

    if (cached?.jazzNode == node) {
      return cached.node;
    }

    const newNode = { ...cached?.node, ...node, id: node.id };

    cache.set(node.id, { jazzNode: node, node: newNode });

    return newNode;
  });

  const edges = flow.edges.map((edge) => {
    const cached = edgeCache.get(edge.id);

    if (cached?.jazzEdge == edge) {
      return cached.edge;
    }

    const newEdge = { ...cached?.edge, ...edge, id: edge.id };

    edgeCache.set(edge.id, { jazzEdge: edge, edge: newEdge });

    return newEdge;
  });

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (!connection.source || !connection.target) return;

      const publicGroup = Group.create();
      publicGroup.addMember("everyone", "writer");

      const newEdge = JazzEdge.create(
        {
          type: "default",
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle || undefined,
          targetHandle: connection.targetHandle || undefined,
        },
        publicGroup
      );

      flow.edges.push(newEdge);
    },
    [flow.edges]
  );

  function createNodeAt(position: XYPosition) {
    const publicGroup = Group.create();
    publicGroup.addMember("everyone", "writer");
    flow.nodes.push(
      JazzNode.create(
        {
          type: "default",
          position: position,
          data: { label: "Hello" },
        },
        publicGroup
      )
    );
  }

  return (
    <ReactFlowProvider>
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button
          variant="outline"
          className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
          onClick={exitFlow}
        >
          <X className="h-4 w-4" />
          Exit
        </Button>
        <Button
          variant="outline"
          className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(flow.id);
              toast("Flow ID copied to clipboard", {
                position: "top-right",
              });
            } catch (err) {
              console.error("Failed to copy to clipboard:", err);
              toast.error("Failed to copy to clipboard", {
                position: "top-right",
              });
            }
          }}
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>
      <Flow
        nodes={nodes}
        edges={edges}
        createNodeAt={createNodeAt}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      />
    </ReactFlowProvider>
  );
}

export default App;
