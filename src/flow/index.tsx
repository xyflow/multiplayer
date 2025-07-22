import { Button } from "@/components/ui/button";

import { ReactFlow, MiniMap, Controls, Background, Panel } from "@xyflow/react";
import { Share2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CheckboxNode } from "./nodes/CheckboxNode";
import { TextNode } from "./nodes/TextNode";
import { ContextMenu } from "./ContextMenu";
import { useAppStore, type AppStore } from "@/state/jazz/app-store";
import { Cursors } from "./cursors";
import { Connections } from "./connections";
import { useShallow } from "zustand/shallow";

// Register custom node types
const nodeTypes = {
  checkbox: CheckboxNode,
  text: TextNode,
};

const selector = (state: AppStore) => ({
  exitFlow: state.exitFlow,
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  activeFlowId: state.activeFlowId,
});

export function Flow() {
  const {
    exitFlow,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    activeFlowId,
  } = useAppStore(useShallow(selector));

  const [fitView] = useState(nodes.length > 0);
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
      nodes={nodes}
      edges={edges}
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
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView={fitView}
      minZoom={0}
    >
      <Panel className="flex gap-2" position="top-left">
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
              await navigator.clipboard.writeText(activeFlowId || "");
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
