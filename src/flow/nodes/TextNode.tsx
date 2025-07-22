import { useOptimistic, useCallback, startTransition } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/state/jazz/app-store";
import { type AppStore } from "@/state/jazz/app-store";
import { useShallow } from "zustand/shallow";

const selector = (state: AppStore) => ({
  updateNodeData: state.updateNodeData,
});

export type TextNode = Node<{ text: string }>;

export function TextNode({ id, data }: NodeProps<TextNode>) {
  const { updateNodeData } = useAppStore(useShallow(selector));

  // Use optimistic updates for immediate UI feedback
  const [optimisticValue, setOptimisticValue] = useOptimistic(
    data.text || "",
    (_, newValue: string) => newValue
  );

  const handleInputChange = useCallback(
    (value: string) => {
      // Apply optimistic update immediately
      startTransition(() => {
        setOptimisticValue(value);
      });

      // Update the Jazz node data through the flow context
      updateNodeData(id, { text: value });
    },
    [updateNodeData, id, setOptimisticValue]
  );

  return (
    <div className="px-4 py-3 shadow-md rounded-md bg-white border-2 border-stone-400 min-w-[250px]">
      <div className="space-y-2">
        <Input
          value={optimisticValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={"Enter text..."}
          className="nodrag"
        />
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="w-16 !bg-teal-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-16 !bg-teal-500"
      />
    </div>
  );
}
