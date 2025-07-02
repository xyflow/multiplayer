import { type ReactNode, useState, useMemo, useCallback } from "react";
import { JazzReactProvider, useAccount, useCoState } from "jazz-tools/react";
import { Group, co } from "jazz-tools";
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
  JazzRoot,
  JazzCursor,
  Account,
  type JazzNodeType,
  type JazzEdgeType,
} from "./schema";
import type {
  CollaborationState,
  FlowActions,
  CollaborationProvider,
  FlowState,
} from "./types";
import { CollaborationContext } from "./context";

const resolveFlow = {
  nodes: { $each: true },
  edges: { $each: true },
  // cursors: true,
};

function JazzCollaborationProvider({ children }: { children: ReactNode }) {
  const { me } = useAccount();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Caching for performance
  const [nodeCache, setNodeCache] = useState<
    Map<string, { jazzNode: JazzNodeType; node: Node }>
  >(new Map());

  const [edgeCache, setEdgeCache] = useState<
    Map<string, { jazzEdge: JazzEdgeType; edge: Edge }>
  >(new Map());

  const root = useCoState(JazzRoot, me?.root?.id, {
    resolve: { activeFlow: resolveFlow },
  });

  const currentFlow: FlowState | null = useMemo(() => {
    if (!root?.activeFlow) return null;

    const jazzFlow = root.activeFlow;

    // Convert Jazz nodes to React Flow nodes with caching
    const nodes = jazzFlow.nodes.map((jazzNode) => {
      const cached = nodeCache.get(jazzNode.id);

      if (cached?.jazzNode === jazzNode) {
        return cached.node;
      }

      const newNode = { ...cached?.node, ...jazzNode, id: jazzNode.id };
      nodeCache.set(jazzNode.id, { jazzNode, node: newNode });
      return newNode;
    });

    // Convert Jazz edges to React Flow edges with caching
    const edges = jazzFlow.edges.map((jazzEdge) => {
      const cached = edgeCache.get(jazzEdge.id);

      if (cached?.jazzEdge === jazzEdge) {
        return cached.edge;
      }

      const newEdge = { ...cached?.edge, ...jazzEdge, id: jazzEdge.id };
      edgeCache.set(jazzEdge.id, { jazzEdge, edge: newEdge });
      return newEdge;
    });

    return {
      id: jazzFlow.id,
      name: jazzFlow.name,
      nodes,
      edges,
      // cursors: Object.values(jazzFlow.cursors.perAccount)
      //   .reduce((acc, entry) => {
      //     if (!entry.value || !entry.by) return acc;
      //     acc.push({
      //       user: entry.by._owner.id,
      //       position: entry.value.position,
      //       isDragging: entry.value.isDragging,
      //     });
      //     return acc;
      //   }, [] as Cursor[])
      //   .filter((cursor) => cursor.user !== me?._owner.id),
    };
  }, [root?.activeFlow, me?._owner.id, nodeCache, edgeCache]);

  // ReactFlow change handlers with proper caching
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      if (!root?.activeFlow) return;

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
            if (root.activeFlow) {
              const index = root.activeFlow.nodes.findIndex(
                (node) => node.id === change.id
              );
              if (index !== -1) {
                root.activeFlow.nodes.splice(index, 1);
              }
            }
            break;
          }
        }
      });
      setNodeCache(new Map(nodeCache)); // Trigger React re-render
    },
    [nodeCache, root?.activeFlow]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      if (!root?.activeFlow) return;

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
            if (root.activeFlow) {
              const index = root.activeFlow.edges.findIndex(
                (edge) => edge.id === change.id
              );
              if (index !== -1) {
                root.activeFlow.edges.splice(index, 1);
              }
            }
            break;
          }
        }
      });
      setEdgeCache(new Map(edgeCache)); // Trigger React re-render
    },
    [edgeCache, root?.activeFlow]
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (!connection.source || !connection.target || !root?.activeFlow) return;

      const group = root.activeFlow._owner.castAs(Group);
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

      root.activeFlow.edges.push(newEdge);
    },
    [root?.activeFlow]
  );

  const addNode = useCallback(
    (nodeData: {
      type?: string;
      position: XYPosition;
      data?: Node["data"];
    }) => {
      if (!root?.activeFlow) return;

      const group = root.activeFlow._owner.castAs(Group);
      const newNode = JazzNode.create(
        {
          type: nodeData.type || "default",
          position: nodeData.position,
          data: nodeData.data || { label: "New Node" },
        },
        group
      );
      root.activeFlow.nodes.push(newNode);
    },
    [root?.activeFlow]
  );

  const addEdge = useCallback(
    (edgeData: {
      type?: string;
      source: string;
      target: string;
      sourceHandle?: string;
      targetHandle?: string;
    }) => {
      if (!root?.activeFlow) return;

      const group = root.activeFlow._owner.castAs(Group);
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
      root.activeFlow.edges.push(newEdge);
    },
    [root?.activeFlow]
  );

  const actions: FlowActions = useMemo(
    () => ({
      createFlow: async () => {
        if (!root) return;

        const publicGroup = Group.create();
        publicGroup.addMember("everyone", "writer");

        root.activeFlow = JazzFlow.create(
          {
            name: "New Flow",
            nodes: co.list(JazzNode).create([], publicGroup),
            edges: co.list(JazzEdge).create([], publicGroup),
            cursors: co.feed(JazzCursor).create([], publicGroup),
          },
          publicGroup
        );
      },

      joinFlow: async (flowCode: string): Promise<boolean> => {
        if (!flowCode || !root) return false;

        setIsLoading(true);
        setError(null);

        try {
          const flow = await JazzFlow.load(flowCode, { resolve: resolveFlow });

          if (!flow) {
            setError("Invalid flow code");
            return false;
          }

          root.activeFlow = flow;
          setError(null);
          return true;
        } catch (error) {
          setError("Failed to join flow");
          console.error(error);
          return false;
        } finally {
          setIsLoading(false);
        }
      },

      exitFlow: () => {
        if (!root) return;
        root.activeFlow = undefined;
      },

      onNodesChange,
      onEdgesChange,
      onConnect,
      addNode,
      addEdge,

      updateCursor: (cursor: { position: XYPosition; isDragging: boolean }) => {
        if (!root?.activeFlow) return;

        const group = root.activeFlow._owner.castAs(Group);
        root.activeFlow.cursors?.push(
          JazzCursor.create(
            {
              position: { ...cursor.position },
              isDragging: cursor.isDragging,
            },
            group
          )
        );
      },
    }),
    [root, onNodesChange, onEdgesChange, onConnect, addNode, addEdge]
  );

  const state: CollaborationState = {
    currentFlow,
    userId: me?._owner.id || null,
    isLoading,
    error,
  };

  const collaborationProvider: CollaborationProvider = {
    state,
    actions,
  };

  return (
    <CollaborationContext.Provider value={collaborationProvider}>
      {children}
    </CollaborationContext.Provider>
  );
}

export function CollaborationProvider({ children }: { children: ReactNode }) {
  return (
    <JazzReactProvider
      AccountSchema={Account}
      sync={{
        peer: "wss://cloud.jazz.tools/?key=peter@xyflow.com",
        when: "always",
      }}
    >
      <JazzCollaborationProvider>{children}</JazzCollaborationProvider>
    </JazzReactProvider>
  );
}
