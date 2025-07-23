import { useState } from "react";
import { Share2, X } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/shallow";
import { ReactFlow, MiniMap, Controls, Background, Panel } from "@xyflow/react";

import { Button } from "@/components/ui/button";

import { CheckboxNode } from "./nodes/CheckboxNode";
import { TextNode } from "./nodes/TextNode";

import { ContextMenu } from "./components/ContextMenu";
import { Cursors } from "./cursors";
import { Connections } from "./connections";

import { useAppStore } from "./store-context";

import type { StoreState } from "./types";

// Register custom node types
const nodeTypes = {
  checkbox: CheckboxNode,
  text: TextNode,
};

const selector = (state: StoreState) => ({
  activeFlowId: state.activeFlowId,
  nodes: state.nodes,
  edges: state.edges,
  exitFlow: state.exitFlow,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
});

export function Flow() {
  const {
    nodes,
    edges,
    activeFlowId,
    exitFlow,
    onNodesChange,
    onEdgesChange,
    onConnect,
  } = useAppStore(useShallow(selector));

  const [fitView] = useState(() => nodes.length > 0);
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
        if (e.button !== 2) {
          hideContextMenu();
        }
      }}
      onPaneContextMenu={(e) => {
        e.preventDefault(); // Prevent default context menu
        setContextMenu({
          x: e.clientX - 150,
          y: e.clientY - 50,
          visible: true,
        });
      }}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView={fitView}
      minZoom={0}
    >
      <MiniMap />
      <Controls />
      <Background />

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

      <Cursors />
      <Connections />
    </ReactFlow>
  );
}
