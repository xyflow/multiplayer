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
import { useEffect, useRef, useState } from "react";
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

export function useInitializeFlowStore(flowId: string) {
  const unsubscribe = useRef(() => {});

  const [useFlowStore] = useState<
    UseBoundStore<StoreApi<FlowStore>> | undefined
  >(() => {
    let nodeCache: Map<string, { jazz: JazzNodeType; item: Node }> = new Map();

    let edgeCache: Map<string, { jazz: JazzEdgeType; item: Edge }> = new Map();

    let rawState: LoadedJazzFlow | undefined = undefined;

    return create<FlowStore>((set, get) => {
      unsubscribe.current = JazzFlow.subscribe(
        flowId,
        {
          resolve: {
            nodes: { $each: true },
            edges: { $each: true },
          },
        },
        (jazzFlow) => {
          const nodes = deriveArray(jazzFlow.nodes, nodeCache);
          const edges = deriveArray(jazzFlow.edges, edgeCache);

          rawState = jazzFlow;

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
          if (!rawState) return;

          let includesDimensionChange = false;

          changes.forEach((change) => {
            switch (change.type) {
              case "dimensions": {
                includesDimensionChange = true;
                const cachedNode = nodeCache.get(change.id);
                if (!cachedNode) return;
                cachedNode.item = {
                  ...cachedNode.item,
                  measured: change.dimensions,
                };
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
                cachedNode.item = {
                  ...cachedNode.item,
                  selected: change.selected,
                };
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

          if (includesDimensionChange) {
            //TODO: trigger a re-render
          }
        },
        onEdgesChange: (changes) => {
          if (!rawState) return;
          changes.forEach((change) => {
            switch (change.type) {
              case "select": {
                const cachedEdge = edgeCache.get(change.id);
                if (!cachedEdge) return;
                cachedEdge.item = {
                  ...cachedEdge.item,
                  selected: change.selected,
                };
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
        },
        onConnect: (connection) => {
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
        addNode: (node) => {
          if (!rawState) return;

          const group = rawState._owner.castAs(Group);
          const newNode = JazzNode.create(
            {
              type: node.type || "default",
              position: node.position,
              data: node.data || { label: "New Node" },
            },
            group
          );
          rawState.nodes.push(newNode);
        },
        addEdge: (edge) => {
          if (!rawState) return;

          const group = rawState._owner.castAs(Group);
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
          rawState.edges.push(newEdge);
        },
        updateNodeData: (nodeId, data) => {
          if (!rawState) return;

          const jazzNode = rawState.nodes.find((node) => node.id === nodeId);
          if (jazzNode) {
            jazzNode.data = { ...jazzNode.data, ...data };
          }
        },
      };
    });
  });

  useEffect(() => {
    return () => {
      unsubscribe.current();
    };
  }, []);

  return {
    useFlowStore,
  };
}
