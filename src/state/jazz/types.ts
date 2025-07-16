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
  activeFlowId: string | null | undefined;
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
  addNode: (node: {
    type?: string;
    position: XYPosition;
    data?: Node["data"];
  }) => void;
  addEdge: (node: {
    type?: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }) => void;
  updateNodeData: (nodeId: string, newData: Node["data"]) => void;
}

export interface FlowStore extends FlowState, FlowActions {}

export interface FlowProvider {
  state: FlowState | null | undefined;
  actions: FlowActions;
}
