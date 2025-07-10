import { useCallback, useEffect } from "react";
import { useShallow } from "zustand/shallow";
import {
  useReactFlow,
  useStore,
  ViewportPortal,
  type ReactFlowStore,
} from "@xyflow/react";

import { useCursors } from "@/state/jazz/cursors-context";
import { useThrottle } from "@/lib/useThrottle";
import { Cursor } from "./Cursor";

export function Cursors() {
  const domNode = useStore(
    useShallow((state: ReactFlowStore) => state.domNode)
  );

  const { screenToFlowPosition } = useReactFlow();

  const {
    state: { cursors },
    actions: { updateCursor },
  } = useCursors();

  // Throttle cursor updates to 150ms
  const throttledUpdateCursor = useThrottle(updateCursor, { delay: 64 });

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      throttledUpdateCursor({
        position,
        dragging: e.pressure > 0,
      });
    },
    [screenToFlowPosition, throttledUpdateCursor]
  );

  useEffect(() => {
    if (!domNode) return;

    domNode.addEventListener("pointermove", handlePointerMove);
    domNode.addEventListener("pointerup", handlePointerMove);

    return () => {
      domNode.removeEventListener("pointermove", handlePointerMove);
      domNode.removeEventListener("pointerup", handlePointerMove);
    };
  }, [domNode, handlePointerMove]);

  return (
    <ViewportPortal>
      {cursors.map((cursor) => (
        <Cursor
          key={cursor.user}
          point={cursor.position}
          color={cursor.color}
          dragging={cursor.dragging}
        />
      ))}
    </ViewportPortal>
  );
}
