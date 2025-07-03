import { useOptimistic, useCallback, startTransition } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { useFlow } from "@/state/jazz/flow-context";

export type CheckboxNodeType = Node<{ checked: boolean }>;

export function CheckboxNode({ id, data }: NodeProps<CheckboxNodeType>) {
  const { actions } = useFlow();

  const [optimisticChecked, setOptimisticChecked] = useOptimistic(
    data.checked,
    (_, newChecked: boolean) => newChecked
  );

  const handleCheckboxChange = useCallback(
    (checked: boolean) => {
      startTransition(() => {
        setOptimisticChecked(checked);
      });

      actions.updateNodeData(id, { checked });
    },
    [actions, id, setOptimisticChecked]
  );

  return (
    <div className="p-4 shadow-md rounded-md bg-white border-2 border-stone-400 ">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={`checkbox-${id}`}
          checked={optimisticChecked}
          onChange={(e) => handleCheckboxChange(e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
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
