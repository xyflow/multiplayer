import type { StateCreator } from "zustand";
import type { AppStore } from "./app-store";
import type {
  Node,
  Edge,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
} from "@xyflow/react";
import {
  JazzEdge,
  JazzNode,
  type JazzEdgeType,
  type JazzNodeType,
  type LoadedJazzFlow,
} from "./schema";
import { Group } from "jazz-tools";

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

export interface FlowStore {
  nodes: Node[];
  edges: Edge[];
  jazzFlow: LoadedJazzFlow | null | undefined;
  setJazzFlow: (jazzFlow?: LoadedJazzFlow | null) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: Omit<Node, "id">) => void;
  addEdge: (edge: Omit<Edge, "id">) => void;
  updateNodeData: (nodeId: string, newData: Node["data"]) => void;
}

export const createFlowSlice: StateCreator<AppStore, [], [], FlowStore> = (
  set,
  get
) => {
  const nodeCache: Map<string, { jazz: JazzNodeType; item: Node }> = new Map();
  const edgeCache: Map<string, { jazz: JazzEdgeType; item: Edge }> = new Map();
  return {
    jazzFlow: undefined,
    nodes: [],
    edges: [],
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
  };
};
