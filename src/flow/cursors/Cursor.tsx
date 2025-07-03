import { useRef, useCallback, useLayoutEffect } from "react";
import { usePerfectCursor } from "./usePerfectCursor";
import type { XYPosition } from "@xyflow/react";
import { MousePointer2 } from "lucide-react";

export function Cursor({
  point,
  color,
  dragging,
}: {
  point: XYPosition;
  color: string;
  dragging: boolean;
}) {
  const rCursor = useRef<SVGSVGElement>(null);

  const animateCursor = useCallback((point: number[]) => {
    const elm = rCursor.current;
    if (!elm) return;
    elm.style.setProperty(
      "transform",
      `translate(${point[0]}px, ${point[1]}px)`
    );
  }, []);

  const onPointMove = usePerfectCursor(animateCursor);

  useLayoutEffect(() => onPointMove([point.x, point.y]), [onPointMove, point]);

  return !dragging ? (
    <MousePointer2
      className="absolute"
      style={{ color }}
      size={15}
      ref={rCursor}
    />
  ) : null;
}
