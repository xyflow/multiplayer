import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type XYPosition,
} from "@xyflow/react";
import { create } from "zustand";
import {
  JazzEdge,
  JazzNode,
  JazzFlow,
  JazzCursorContainer,
  JazzConnectionContainer,
  type JazzEdgeType,
  type JazzNodeType,
  type LoadedJazzFlow,
  type LoadedJazzRoot,
  type DeeplyLoadedCursorContainer,
  type DeeplyLoadedConnectionContainer,
} from "./schema";
import { Group, co } from "jazz-tools";
import type { Connection, ConnectionOfUser, Cursor } from "./types";

const ALL_COLORS = [
  "#D14D41",
  "#DA702C",
  "#D0A215",
  "#879A39",
  "#3AA99F",
  "#4385BE",
  "#8B7EC8",
  "#CE5D97",
];

export interface AppStore {
  activeFlowId?: string | null;
  userId?: string | null;
  nodes: Node[];
  edges: Edge[];
  jazzRoot: LoadedJazzRoot | null | undefined;
  jazzFlow: LoadedJazzFlow | null | undefined;
  jazzCursors: DeeplyLoadedCursorContainer | null | undefined;
  jazzConnections: DeeplyLoadedConnectionContainer | null | undefined;
  cursors: Cursor[];
  connections: ConnectionOfUser[];
  isLoading: boolean;
  error: string | null;
  getUserColor: (userId: string) => string;
  setActiveFlowId: (activeFlowId: string) => void;
  setUserId: (userId: string) => void;
  setJazzFlow: (jazzFlow?: LoadedJazzFlow | null) => void;
  setRoot: (root?: LoadedJazzRoot | null) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: Omit<Node, "id">) => void;
  addEdge: (edge: Omit<Edge, "id">) => void;
  updateNodeData: (nodeId: string, newData: Node["data"]) => void;
  createFlow: () => void;
  joinFlow: (flowId: string) => Promise<boolean>;
  exitFlow: () => void;
  setCursors: (cursors?: DeeplyLoadedCursorContainer | null) => void;
  updateCursor: (cursor: { position: XYPosition; dragging: boolean }) => void;
  setConnections: (
    connections?: DeeplyLoadedConnectionContainer | null
  ) => void;
  updateConnection: (connection?: Connection) => void;
}

function deriveArray(
  newJazzItems: JazzNodeType[],
  cache: Map<string, { jazz: JazzNodeType; item: Node }>
): Node[];
function deriveArray(
  newJazzItems: JazzEdgeType[],
  cache: Map<string, { jazz: JazzEdgeType; item: Edge }>
): Edge[];
function deriveArray<T extends { id: string }, I>(
  newJazzItems: T[],
  cache: Map<string, { jazz: T; item: I }>
): I[] {
  const deletedItems = new Map(cache);
  const derivedArray = newJazzItems.map((jazzItem) => {
    deletedItems.delete(jazzItem.id);

    const cached = cache.get(jazzItem.id);
    if (cached?.jazz === jazzItem) {
      return cached.item;
    }

    const newItem = { ...cached?.item, ...jazzItem, id: jazzItem.id } as I;
    cache.set(jazzItem.id, { jazz: jazzItem, item: newItem });
    return newItem;
  });

  deletedItems.forEach((deleted) => {
    cache.delete(deleted.jazz.id);
  });

  return derivedArray;
}

function serializeCursor(entry: { position: XYPosition; dragging: boolean }) {
  return `${entry.position.x}/${entry.position.y}/${
    entry.dragging ? "1" : "0"
  }`;
}

function deserializeCursor(value: string) {
  const [x, y, dragging] = value.split("/");
  return {
    position: { x: Number(x), y: Number(y) },
    dragging: dragging === "1",
  };
}

function serializeConnection(entry: Connection) {
  return `${entry.source}/${entry.sourceType}/${entry.sourceHandle || ""}/${
    entry.target || ""
  }/${entry.targetType || ""}/${entry.targetHandle || ""}/${entry.position.x}/${
    entry.position.y
  }`;
}

function deserializeConnection(value: string): Connection {
  const [
    source,
    sourceType,
    sourceHandle,
    target,
    targetType,
    targetHandle,
    x,
    y,
  ] = value.split("/");
  return {
    source,
    sourceType: sourceType as "source" | "target",
    sourceHandle: sourceHandle || undefined,
    target: target || undefined,
    targetType: targetType ? (targetType as "source" | "target") : undefined,
    targetHandle: targetHandle || undefined,
    position: { x: Number(x), y: Number(y) },
  };
}

export const useAppStore = create<AppStore>((set, get) => {
  const colorMap = new Map<string, string>();
  let colorIndex = 0;

  function getNextUserColor() {
    if (++colorIndex >= ALL_COLORS.length) {
      colorIndex = 0;
    }
    return ALL_COLORS[colorIndex];
  }

  const nodeCache: Map<string, { jazz: JazzNodeType; item: Node }> = new Map();
  const edgeCache: Map<string, { jazz: JazzEdgeType; item: Edge }> = new Map();

  return {
    activeFlowId: undefined,
    userId: undefined,
    jazzFlow: undefined,
    jazzRoot: undefined,
    jazzCursors: undefined,
    jazzConnections: undefined,
    nodes: [],
    edges: [],
    cursors: [],
    connections: [],
    isLoading: false,
    error: null,
    setActiveFlowId: (activeFlowId: string) => set({ activeFlowId }),
    setUserId: (userId: string) => set({ userId }),
    getUserColor: (userId: string) => {
      if (!colorMap.has(userId)) {
        colorMap.set(userId, getNextUserColor());
      }
      return colorMap.get(userId)!;
    },
    setRoot: (jazzRoot) => {
      set({ jazzRoot });
    },
    setJazzFlow: (jazzFlow) => {
      if (!jazzFlow) {
        set({
          nodes: [],
          edges: [],
        });
        return;
      }

      const nodes = deriveArray(jazzFlow.nodes, nodeCache);
      const edges = deriveArray(jazzFlow.edges, edgeCache);

      set({
        activeFlowId: jazzFlow.id,
        nodes: nodes,
        edges: edges,
        jazzFlow,
      });
    },
    onNodesChange: (changes) => {
      const { jazzFlow } = get();

      if (!jazzFlow) return;

      let dimensionChanged = false;

      //TODO: implement all node changes
      changes.forEach((change) => {
        switch (change.type) {
          case "dimensions": {
            const cachedNode = nodeCache.get(change.id);
            if (!cachedNode) return;
            cachedNode.item = {
              ...cachedNode.item,
              measured: change.dimensions,
            };
            dimensionChanged = true;
            break;
          }

          case "position": {
            if (!change.position) return;
            const cachedNode = nodeCache.get(change.id);
            if (!cachedNode) return;
            cachedNode.jazz.position = change.position;
            break;
          }

          case "select": {
            const cachedNode = nodeCache.get(change.id);
            if (!cachedNode) return;
            cachedNode.item = { ...cachedNode.item, selected: change.selected };
            break;
          }

          case "remove": {
            nodeCache.delete(change.id);
            const index = jazzFlow.nodes.findIndex(
              (node) => node.id === change.id
            );
            if (index !== -1) {
              jazzFlow.nodes.splice(index, 1);
            }
            break;
          }
        }
      });

      // Trigger React re-render on measure
      if (dimensionChanged) {
        const { jazzFlow, setJazzFlow } = get();
        if (jazzFlow) setJazzFlow(jazzFlow);
      }
    },
    onEdgesChange: (changes) => {
      const { jazzFlow } = get();

      if (!jazzFlow) return;

      // TODO: implement all edge changes
      changes.forEach((change) => {
        switch (change.type) {
          case "select": {
            const cachedEdge = edgeCache.get(change.id);
            if (!cachedEdge) return;
            cachedEdge.item = { ...cachedEdge.item, selected: change.selected };
            break;
          }

          case "remove": {
            edgeCache.delete(change.id);
            const index = jazzFlow.edges.findIndex(
              (edge) => edge.id === change.id
            );
            if (index !== -1) {
              jazzFlow.edges.splice(index, 1);
            }
            break;
          }
        }
      });
    },
    onConnect: (connection) => {
      const { jazzFlow } = get();
      if (!connection.source || !connection.target || !jazzFlow) return;

      const group = jazzFlow._owner.castAs(Group);
      const newEdge = JazzEdge.create(
        {
          type: "default",
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle || undefined,
          targetHandle: connection.targetHandle || undefined,
        },
        group
      );

      jazzFlow.edges.push(newEdge);
    },
    addNode: (node) => {
      const { jazzFlow } = get();

      if (!jazzFlow) return;

      const group = jazzFlow._owner.castAs(Group);
      const newNode = JazzNode.create(
        {
          type: node.type || "text",
          position: node.position,
          data: node.data || { label: "New Node" },
        },
        group
      );
      jazzFlow.nodes.push(newNode);
    },
    addEdge: (edge) => {
      const { jazzFlow } = get();

      if (!jazzFlow) return;

      const group = jazzFlow._owner.castAs(Group);
      const newEdge = JazzEdge.create(
        {
          type: edge.type || "default",
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || undefined,
          targetHandle: edge.targetHandle || undefined,
        },
        group
      );

      jazzFlow.edges.push(newEdge);
    },
    updateNodeData: (nodeId, newData) => {
      const { jazzFlow } = get();

      if (!jazzFlow) return;

      const jazzNode = jazzFlow.nodes.find((node) => node.id === nodeId);
      if (jazzNode) {
        jazzNode.data = { ...jazzNode.data, ...newData };
      }
    },
    createFlow: () => {
      const { jazzRoot } = get();
      if (!jazzRoot) return;

      const publicGroup = Group.create();
      publicGroup.addMember("everyone", "writer");

      jazzRoot.activeFlow = JazzFlow.create(
        {
          name: "New Flow",
          nodes: co.list(JazzNode).create([], publicGroup),
          edges: co.list(JazzEdge).create([], publicGroup),
          cursors: JazzCursorContainer.create(
            {
              feed: JazzCursorContainer.def.shape.feed.create([], publicGroup),
              version: 1,
            },
            publicGroup
          ),
          connections: JazzConnectionContainer.create(
            {
              feed: JazzConnectionContainer.def.shape.feed.create(
                [],
                publicGroup
              ),
              version: 1,
            },
            publicGroup
          ),
        },
        publicGroup
      );
    },
    joinFlow: async (flowId: string): Promise<boolean> => {
      const { jazzRoot } = get();
      if (!flowId || !jazzRoot) return false;

      set({ isLoading: true, error: null });

      try {
        const flow = await JazzFlow.load(flowId);

        if (!flow) {
          set({ error: "Invalid flow code" });
          return false;
        }

        jazzRoot.activeFlow = flow;
        set({ error: null });
        return true;
      } catch (error) {
        set({ error: "Failed to join flow" });
        console.error(error);
        return false;
      } finally {
        set({ isLoading: false });
      }
    },
    exitFlow: () => {
      const { jazzRoot } = get();
      if (!jazzRoot) return;
      jazzRoot.activeFlow = undefined;
    },
    setCursors: (jazzCursors) => {
      const { userId, getUserColor } = get();

      if (!jazzCursors?.feed) {
        set({ cursors: [], jazzCursors });
        return;
      }

      const now = Date.now();
      // Convert Jazz cursors to Cursor objects, filtering out current user
      const cursors = Object.values(jazzCursors.feed.perAccount).reduce(
        (acc, entry) => {
          if (!entry.value || !entry.by) {
            return acc;
          }

          if (entry.by.id === userId || now - entry.madeAt.getTime() > 10000) {
            return acc;
          }

          const values = deserializeCursor(entry.value);

          acc.push({
            user: entry.by.id,
            position: values.position,
            dragging: values.dragging,
            color: getUserColor(entry.by.id),
          });
          return acc;
        },
        [] as Cursor[]
      );

      set({ cursors, jazzCursors });
    },
    updateCursor: (cursor) => {
      const { jazzCursors } = get();
      if (!jazzCursors?.feed) return;

      const serializedCursor = serializeCursor(cursor);
      jazzCursors.feed.push(serializedCursor);
    },
    setConnections: (jazzConnections) => {
      const { userId, getUserColor } = get();

      if (!jazzConnections?.feed) {
        set({ connections: [], jazzConnections });
        return;
      }

      const now = Date.now();

      // Convert Jazz connections to Connection objects, filtering out current user
      const connections = Object.values(jazzConnections.feed.perAccount).reduce(
        (acc, entry) => {
          if (!entry.value || !entry.by) {
            return acc;
          }

          // Filter out current user and old connections (older than 5 seconds)
          if (entry.by.id === userId || now - entry.madeAt.getTime() > 5000) {
            return acc;
          }

          const values = deserializeConnection(entry.value);

          acc.push({
            user: entry.by.id,
            source: values.source,
            sourceType: values.sourceType,
            sourceHandle: values.sourceHandle,
            target: values.target,
            targetType: values.targetType,
            targetHandle: values.targetHandle,
            position: values.position,
            color: getUserColor(entry.by.id),
          });

          return acc;
        },
        [] as ConnectionOfUser[]
      );

      set({ connections, jazzConnections });
    },
    updateConnection: (connection) => {
      const { jazzConnections } = get();
      if (!jazzConnections?.feed) return;

      if (connection) {
        jazzConnections.feed.push(serializeConnection(connection));
      } else {
        // Push an empty connection when clearing
        jazzConnections.feed.push(
          serializeConnection({
            source: "",
            sourceType: "source",
            sourceHandle: "",
            position: { x: 0, y: 0 },
          })
        );
      }
    },
  };
});
