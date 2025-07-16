import { create, type StoreApi, type UseBoundStore } from "zustand";
import type { FlowStore } from "./types";
import {
  JazzEdge,
  JazzFlow,
  JazzNode,
  type JazzEdgeType,
  type JazzNodeType,
  type LoadedJazzFlow,
} from "./schema";
import { useRef } from "react";
import { type Edge, type Node } from "@xyflow/react";
import { Group } from "jazz-tools";

function deriveArray<T extends { id: string }>(
  newJazzItems: T[],
  cache: Map<string, { jazz: T; item: any }>
) {
  const deletedItems = new Map(cache);
  const derivedArray = newJazzItems.map((jazzItem) => {
    deletedItems.delete(jazzItem.id);

    const cached = cache.get(jazzItem.id);
    if (cached?.jazz === jazzItem) {
      return cached.item;
    }

    const newItem = { ...cached?.item, ...jazzItem, id: jazzItem.id };
    cache.set(jazzItem.id, { jazz: jazzItem, item: newItem });
    return newItem;
  });

  deletedItems.forEach((deleted) => {
    cache.delete(deleted.jazz.id);
  });

  return derivedArray;
}

export function createFlowStore(flowId: string) {
  const unsubscribe = useRef(() => {});
  const useAppStore = useRef<UseBoundStore<StoreApi<FlowStore>> | undefined>(
    undefined
  );

  const nodeCache = useRef<Map<string, { jazz: JazzNodeType; item: Node }>>(
    new Map()
  );

  const edgeCache = useRef<Map<string, { jazz: JazzEdgeType; item: Edge }>>(
    new Map()
  );

  let rawState = useRef<LoadedJazzFlow | undefined>(undefined);

  if (!useAppStore.current) {
    useAppStore.current = create<FlowStore>((set, get) => {
      unsubscribe.current = JazzFlow.subscribe(
        flowId,
        {
          resolve: {
            nodes: { $each: true },
            edges: { $each: true },
          },
        },
        (jazzFlow) => {
          const nodes = deriveArray(jazzFlow.nodes, nodeCache.current);
          const edges = deriveArray(jazzFlow.edges, edgeCache.current);

          rawState.current = jazzFlow;

          set({
            id: jazzFlow.id,
            name: jazzFlow.name,
            nodes: nodes,
            edges: edges,
          });
        }
      );

      return {
        id: "",
        name: "",
        nodes: [],
        edges: [],
        onNodesChange: (changes) => {
          if (!rawState.current) return;

          let includesDimensionChange = false;

          changes.forEach((change) => {
            switch (change.type) {
              case "dimensions": {
                includesDimensionChange = true;
                const cachedNode = nodeCache.current.get(change.id);
                if (!cachedNode) return;
                cachedNode.item = {
                  ...cachedNode.item,
                  measured: change.dimensions,
                };
                break;
              }

              case "position": {
                if (!change.position) return;
                const cachedNode = nodeCache.current.get(change.id);
                if (!cachedNode) return;
                cachedNode.jazz.position = change.position;
                break;
              }

              case "select": {
                const cachedNode = nodeCache.current.get(change.id);
                if (!cachedNode) return;
                cachedNode.item = {
                  ...cachedNode.item,
                  selected: change.selected,
                };
                break;
              }

              case "remove": {
                nodeCache.current.delete(change.id);
                if (rawState.current) {
                  const index = rawState.current.nodes.findIndex(
                    (node) => node.id === change.id
                  );
                  if (index !== -1) {
                    rawState.current.nodes.splice(index, 1);
                  }
                }
                break;
              }
            }
          });

          if (includesDimensionChange) {
          }
        },
        onEdgesChange: (changes) => {
          if (!rawState.current) return;
          changes.forEach((change) => {
            switch (change.type) {
              case "select": {
                const cachedEdge = edgeCache.current.get(change.id);
                if (!cachedEdge) return;
                cachedEdge.item = {
                  ...cachedEdge.item,
                  selected: change.selected,
                };
                break;
              }

              case "remove": {
                edgeCache.current.delete(change.id);
                if (rawState.current) {
                  const index = rawState.current.edges.findIndex(
                    (edge) => edge.id === change.id
                  );
                  if (index !== -1) {
                    rawState.current.edges.splice(index, 1);
                  }
                }
                break;
              }
            }
          });
        },
        onConnect: (connection) => {
          if (!connection.source || !connection.target || !rawState.current)
            return;

          const group = rawState.current._owner.castAs(Group);
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

          rawState.current.edges.push(newEdge);
        },
        addNode: (node) => {
          if (!rawState.current) return;

          const group = rawState.current._owner.castAs(Group);
          const newNode = JazzNode.create(
            {
              type: node.type || "default",
              position: node.position,
              data: node.data || { label: "New Node" },
            },
            group
          );
          rawState.current.nodes.push(newNode);
        },
        addEdge: (edge) => {
          if (!rawState.current) return;

          const group = rawState.current._owner.castAs(Group);
          const newEdge = JazzEdge.create(
            {
              type: edge.type || "default",
              source: edge.source,
              target: edge.target,
              sourceHandle: edge.sourceHandle,
              targetHandle: edge.targetHandle,
            },
            group
          );
          rawState.current.edges.push(newEdge);
        },
        updateNodeData: (nodeId, data) => {
          if (!rawState.current) return;

          const jazzNode = rawState.current.nodes.find(
            (node) => node.id === nodeId
          );
          if (jazzNode) {
            jazzNode.data = { ...jazzNode.data, ...data };
          }
        },
      };
    });
  }

  return { useAppStore: useAppStore.current, unsubscribe: unsubscribe.current };
}
