import { useCallback, useEffect, useRef } from "react";
import { useShallow } from "zustand/shallow";
import {
  useReactFlow,
  useStore,
  ViewportPortal,
  type ReactFlowStore,
} from "@xyflow/react";

import { useCursors } from "@/state/jazz/cursors-context";
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

  const lastUpdateTimeRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPositionRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const now = Date.now();
      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      // Store the latest position
      lastPositionRef.current = position;

      // If enough time has passed, send immediately
      if (now - lastUpdateTimeRef.current >= 150) {
        lastUpdateTimeRef.current = now;
        updateCursor({ position, isDragging: false });

        // Clear any pending timeout since we just sent an update
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      } else {
        // Set up a timeout to send the last position after the throttle period
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          if (lastPositionRef.current) {
            lastUpdateTimeRef.current = Date.now();
            updateCursor({
              position: lastPositionRef.current,
              isDragging: false,
            });
            timeoutRef.current = null;
          }
        }, 150 - (now - lastUpdateTimeRef.current));
      }
    },
    [screenToFlowPosition, updateCursor]
  );

  // TODO: Handle pointer leave (later!)
  // function handlePointerLeave(e: PointerEvent) {
  //   console.log(e);
  // }

  useEffect(() => {
    if (!domNode) return;

    domNode.addEventListener("pointermove", handlePointerMove);

    return () => {
      domNode.removeEventListener("pointermove", handlePointerMove);
      // Clean up any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [domNode, handlePointerMove]);

  return (
    <ViewportPortal>
      {cursors.map((cursor) => (
        <Cursor key={cursor.user} point={cursor.position} />
      ))}
    </ViewportPortal>
  );
}
