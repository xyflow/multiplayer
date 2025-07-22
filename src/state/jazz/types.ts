import type { XYPosition } from "@xyflow/react";

export interface Cursor {
  user: string;
  position: XYPosition;
  dragging: boolean;
  color: string;
}

export interface Connection {
  source: string;
  sourceType: "source" | "target";
  sourceHandle?: string;
  target?: string;
  targetType?: "source" | "target";
  targetHandle?: string;
  position: XYPosition;
}

export interface ConnectionOfUser extends Connection {
  user: string;
  color: string;
}
