import { Button } from "@/components/ui/button";
import type { FlowActions, FlowState } from "@/state/jazz/types";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useReactFlow,
  Panel,
} from "@xyflow/react";
import { Share2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Cursors } from "./cursors";

export function Flow({
  flow,
  actions,
}: {
  flow: FlowState;
  actions: FlowActions;
}) {
  const { screenToFlowPosition } = useReactFlow();

  const [fitView] = useState(flow.nodes.length > 0);

  return (
    <ReactFlow
      nodes={flow.nodes}
      edges={flow.edges}
      onContextMenu={(e) => {
        e.preventDefault();
        actions.addNode({
          position: screenToFlowPosition({ x: e.clientX, y: e.clientY }),
        });
      }}
      onNodesChange={actions.onNodesChange}
      onEdgesChange={actions.onEdgesChange}
      onConnect={actions.onConnect}
      fitView={fitView}
      minZoom={0}
    >
      <Panel className="flex gap-2" position="top-left">
        <Button
          variant="outline"
          className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
          onClick={actions.exitFlow}
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
      </Panel>
      <MiniMap />
      <Controls />
      <Background />
      <Cursors />
    </ReactFlow>
  );
}
