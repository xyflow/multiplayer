import { Button } from "@/components/ui/button";
import { Square, Type } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { useShallow } from "zustand/shallow";
import type { StoreState } from "../types";
import { useAppStore } from "../store-context";

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  onHide: () => void;
}

const selector = (state: StoreState) => ({
  addNode: state.addNode,
});

export function ContextMenu({ visible, x, y, onHide }: ContextMenuProps) {
  const { addNode } = useAppStore(useShallow(selector));
  const { screenToFlowPosition } = useReactFlow();

  if (!visible) return null;

  const addCheckboxNode = (position: { x: number; y: number }) => {
    addNode({
      type: "checkbox",
      position: screenToFlowPosition(position),
      data: {
        label: "New Checkbox",
        checked: false,
      },
    });
  };

  const addTextNode = (position: { x: number; y: number }) => {
    addNode({
      type: "text",
      position: screenToFlowPosition(position),
      data: {
        label: "Text Input",
        value: "",
        placeholder: "Enter text...",
      },
    });
  };

  return (
    <div
      className="fixed z-50 flex gap-2"
      style={{
        left: x,
        top: y,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Button
        variant="outline"
        className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700 shadow-lg"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={() => {
          addCheckboxNode({ x, y });
          onHide();
        }}
      >
        <Square className="h-4 w-4" />
        Add Checkbox
      </Button>
      <Button
        variant="outline"
        className="bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700 shadow-lg"
        onPointerUp={() => {
          addTextNode({ x, y });
          onHide();
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Type className="h-4 w-4" />
        Add Text
      </Button>
    </div>
  );
}
