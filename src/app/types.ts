import type {
  Edge,
  Node,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  XYPosition,
} from "@xyflow/react";
import type { Connection, ConnectionOfUser, Cursor } from "../state/jazz/types";
import type { StoreApi } from "zustand";

export type Store = StoreApi<StoreState>;

export type StoreState = {
  // App
  activeFlowId?: string | null;
  userId?: string | null;
  isLoading: boolean;
  error: string | null;
  setActiveFlowId: (activeFlowId: string) => void;
  getUserColor: (userId: string) => string;
  setUserId: (userId: string) => void;
  createFlow: () => void;
  joinFlow: (flowId: string) => Promise<boolean>;
  exitFlow: () => void;

  // Flow
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: Omit<Node, "id">) => void;
  updateNodeData: (nodeId: string, newData: Node["data"]) => void;

  // Cursors
  cursors: Cursor[];
  updateCursor: (cursor: { position: XYPosition; dragging: boolean }) => void;

  // Connections
  connections: ConnectionOfUser[];
  updateConnection: (connection?: Connection) => void;
};
