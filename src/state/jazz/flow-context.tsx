import {
  type ReactNode,
  useState,
  useMemo,
  useCallback,
  useContext,
  createContext,
} from "react";
import { useCoState } from "jazz-tools/react";
import { Group } from "jazz-tools";
import type {
  Node,
  Edge,
  XYPosition,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from "@xyflow/react";
import {
  JazzNode,
  JazzEdge,
  JazzFlow,
  type JazzNodeType,
  type JazzEdgeType,
} from "./schema";
import type { FlowState, FlowActions, FlowProvider } from "./types";
import { useApp } from "./app-context";

export const FlowContext = createContext<FlowProvider | null>(null);

const resolveFlow = {
  nodes: { $each: true },
  edges: { $each: true },
};

function FlowContextProvider({ children }: { children: ReactNode }) {
  const { state: appState } = useApp();

  // Caching for performance
  const [nodeCache, setNodeCache] = useState<
    Map<string, { jazzNode: JazzNodeType; node: Node }>
  >(new Map());

  const [edgeCache, setEdgeCache] = useState<
    Map<string, { jazzEdge: JazzEdgeType; edge: Edge }>
  >(new Map());

  // Load the deeply loaded flow based on activeFlowId from AppContext
  const rawState = useCoState(JazzFlow, appState.activeFlowId || undefined, {
    resolve: resolveFlow,
  });

  const currentFlow: FlowState | null | undefined = useMemo(() => {
    if (appState.activeFlowId === undefined) return undefined;

    if (!rawState) return rawState;

    const jazzFlow = rawState;

    const deletedNodes = new Map(nodeCache);
    const deletedEdges = new Map(edgeCache);

    // Convert Jazz nodes to React Flow nodes with caching
    const nodes = jazzFlow.nodes.map((jazzNode) => {
      const cached = nodeCache.get(jazzNode.id);
      deletedNodes.delete(jazzNode.id);

      if (cached?.jazzNode === jazzNode) {
        return cached.node;
      }

      const newNode = { ...cached?.node, ...jazzNode, id: jazzNode.id };
      nodeCache.set(jazzNode.id, { jazzNode, node: newNode });
      return newNode;
    });

    deletedNodes.forEach((cached) => {
      nodeCache.delete(cached.jazzNode.id);
    });

    // Convert Jazz edges to React Flow edges with caching
    const edges = jazzFlow.edges.map((jazzEdge) => {
      const cached = edgeCache.get(jazzEdge.id);
      deletedEdges.delete(jazzEdge.id);

      if (cached?.jazzEdge === jazzEdge) {
        return cached.edge;
      }

      const newEdge = { ...cached?.edge, ...jazzEdge, id: jazzEdge.id };
      edgeCache.set(jazzEdge.id, { jazzEdge, edge: newEdge });
      return newEdge;
    });

    deletedEdges.forEach((cached) => {
      edgeCache.delete(cached.jazzEdge.id);
    });

    return {
      id: jazzFlow.id,
      name: jazzFlow.name,
      nodes,
      edges,
    };
  }, [rawState, nodeCache, edgeCache]);

  // ReactFlow change handlers with proper caching
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      if (!rawState) return;

      changes.forEach((change) => {
        switch (change.type) {
          case "dimensions": {
            const cached = nodeCache.get(change.id);
            if (!cached) return;
            cached.node = { ...cached.node, measured: change.dimensions };
            break;
          }

          case "position": {
            if (!change.position) return;
            const cached = nodeCache.get(change.id);
            if (!cached) return;
            cached.jazzNode.position = change.position;
            break;
          }

          case "select": {
            const cached = nodeCache.get(change.id);
            if (!cached) return;
            cached.node = { ...cached.node, selected: change.selected };
            break;
          }

          case "remove": {
            nodeCache.delete(change.id);
            if (rawState) {
              const index = rawState.nodes.findIndex(
                (node) => node.id === change.id
              );
              if (index !== -1) {
                rawState.nodes.splice(index, 1);
              }
            }
            break;
          }
        }
      });
      setNodeCache(new Map(nodeCache)); // Trigger React re-render
    },
    [nodeCache, rawState]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      if (!rawState) return;

      changes.forEach((change) => {
        switch (change.type) {
          case "select": {
            const cached = edgeCache.get(change.id);
            if (!cached) return;
            cached.edge = { ...cached.edge, selected: change.selected };
            break;
          }

          case "remove": {
            edgeCache.delete(change.id);
            if (rawState) {
              const index = rawState.edges.findIndex(
                (edge) => edge.id === change.id
              );
              if (index !== -1) {
                rawState.edges.splice(index, 1);
              }
            }
            break;
          }
        }
      });
      setEdgeCache(new Map(edgeCache)); // Trigger React re-render
    },
    [edgeCache, rawState]
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (!connection.source || !connection.target || !rawState) return;

      const group = rawState._owner.castAs(Group);
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

      rawState.edges.push(newEdge);
    },
    [rawState]
  );

  const addNode = useCallback(
    (nodeData: {
      type?: string;
      position: XYPosition;
      data?: Node["data"];
    }) => {
      if (!rawState) return;

      const group = rawState._owner.castAs(Group);
      const newNode = JazzNode.create(
        {
          type: nodeData.type || "default",
          position: nodeData.position,
          data: nodeData.data || { label: "New Node" },
        },
        group
      );
      rawState.nodes.push(newNode);
    },
    [rawState]
  );

  const addEdge = useCallback(
    (edgeData: {
      type?: string;
      source: string;
      target: string;
      sourceHandle?: string;
      targetHandle?: string;
    }) => {
      if (!rawState) return;

      const group = rawState._owner.castAs(Group);
      const newEdge = JazzEdge.create(
        {
          type: edgeData.type || "default",
          source: edgeData.source,
          target: edgeData.target,
          sourceHandle: edgeData.sourceHandle,
          targetHandle: edgeData.targetHandle,
        },
        group
      );
      rawState.edges.push(newEdge);
    },
    [rawState]
  );

  const updateNodeData = useCallback(
    (nodeId: string, newData: Node["data"]) => {
      if (!rawState) return;

      const jazzNode = rawState.nodes.find((node) => node.id === nodeId);
      if (jazzNode) {
        jazzNode.data = { ...jazzNode.data, ...newData };

        // Update the cache to trigger re-render
        const cached = nodeCache.get(nodeId);
        if (cached) {
          cached.node = { ...cached.node, data: jazzNode.data };
          setNodeCache(new Map(nodeCache));
        }
      }
    },
    [rawState, nodeCache]
  );

  const actions: FlowActions = useMemo(
    () => ({
      onNodesChange,
      onEdgesChange,
      onConnect,
      addNode,
      addEdge,
      updateNodeData,
    }),
    [onNodesChange, onEdgesChange, onConnect, addNode, addEdge, updateNodeData]
  );

  const flowProvider: FlowProvider = {
    state: currentFlow,
    actions,
  };

  return (
    <FlowContext.Provider value={flowProvider}>{children}</FlowContext.Provider>
  );
}

export function FlowProvider({ children }: { children: ReactNode }) {
  return <FlowContextProvider>{children}</FlowContextProvider>;
}

export function useFlow(): FlowProvider {
  const context = useContext(FlowContext);
  if (!context) {
    throw new Error("useFlow must be used within a FlowProvider");
  }
  return context;
}
