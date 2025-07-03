import { Button } from "@/components/ui/button";
import type { FlowActions, FlowState } from "@/state/jazz/types";
import { useApp } from "@/state/jazz/app-context";

import { ReactFlow, MiniMap, Controls, Background, Panel } from "@xyflow/react";
import { Share2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Cursors } from "./cursors";
import { CheckboxNode } from "./nodes/CheckboxNode";
import { TextNode } from "./nodes/TextNode";
import { Connections } from "./connections";
import { ContextMenu } from "./ContextMenu";

// Register custom node types
const nodeTypes = {
  checkbox: CheckboxNode,
  text: TextNode,
};

export function Flow({
  flow,
  actions: flowActions,
}: {
  flow: FlowState;
  actions: FlowActions;
}) {
  const { actions: appActions } = useApp();

  const [fitView] = useState(flow.nodes.length > 0);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    visible: boolean;
  }>({ x: 0, y: 0, visible: false });

  const hideContextMenu = () => {
    setContextMenu({ x: 0, y: 0, visible: false });
  };

  return (
    <ReactFlow
      nodes={flow.nodes}
      edges={flow.edges}
      nodeTypes={nodeTypes}
      onPointerDown={(e) => {
        // Right mouse button is button 2
        if (e.button === 2) {
          e.preventDefault();
          setContextMenu({
            x: e.clientX - 150,
            y: e.clientY - 50,
            visible: true,
          });
        } else {
          // Hide context menu on any other click
          hideContextMenu();
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault(); // Prevent default context menu
      }}
      onNodesChange={flowActions.onNodesChange}
      onEdgesChange={flowActions.onEdgesChange}
      onConnect={flowActions.onConnect}
      fitView={fitView}
      minZoom={0}
    >
      <Panel className="flex gap-2" position="top-left">
        <Button
          variant="outline"
          className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
          onClick={appActions.exitFlow}
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

      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        flowActions={flowActions}
        onHide={hideContextMenu}
      />

      <MiniMap />
      <Controls />
      <Background />
      <Cursors />
      <Connections />
    </ReactFlow>
  );
}
