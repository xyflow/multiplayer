import type { XYPosition } from "@xyflow/react";

export interface Cursor {
  user: string;
  position: XYPosition;
  isDragging: boolean;
}
