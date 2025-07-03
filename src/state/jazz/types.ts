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

export interface AppState {
  activeFlowId: string | null;
  userId: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AppActions {
  createFlow: () => Promise<void>;
  joinFlow: (flowCode: string) => Promise<boolean>;
  exitFlow: () => void;
  getUserColor: (userId: string) => string;
}
export interface AppProvider {
  state: AppState;
  actions: AppActions;
}

export interface FlowState {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
}

export interface FlowActions {
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
  updateNodeData: (nodeId: string, newData: Node["data"]) => void;
}

export interface FlowProvider {
  state: FlowState | null;
  actions: FlowActions;
}
