import type {
  Node,
  Edge,
  XYPosition,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from "@xyflow/react";

export interface Cursor {
  user: string;
  position: XYPosition;
  isDragging: boolean;
}

export interface FlowState {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  // cursors: Cursor[];
}

export interface FlowActions {
  createFlow: () => Promise<void>;
  joinFlow: (flowCode: string) => Promise<boolean>;
  exitFlow: () => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (nodeData: {
    type?: string;
    position: XYPosition;
    data?: Node["data"];
  }) => void;
  addEdge: (edgeData: {
    type?: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }) => void;
  updateCursor: (cursor: { position: XYPosition; isDragging: boolean }) => void;
}

export interface CollaborationState {
  currentFlow: FlowState | null;
  userId: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface CollaborationProvider {
  state: CollaborationState;
  actions: FlowActions;
}
