import {
  createContext,
  useContext,
  type ReactNode,
  useMemo,
  useCallback,
} from "react";
import { useAccount, useCoState } from "jazz-tools/react";
import { Group } from "jazz-tools";
import {
  JazzConnection,
  JazzFlow,
  type DeeplyLoadedConnectionContainer,
} from "./schema";
import type { Connection } from "./types";
import { useApp } from "./app-context";

export interface ConnectionOfUser extends Connection {
  user: string;
  color: string;
}

export interface ConnectionsState {
  connections: ConnectionOfUser[];
  isLoading: boolean;
  error: string | null;
}

export interface ConnectionsActions {
  updateConnection: (connection?: Connection) => void;
}

export interface ConnectionsProvider {
  state: ConnectionsState;
  actions: ConnectionsActions;
}

export const ConnectionsContext = createContext<ConnectionsProvider | null>(
  null
);

function JazzConnectionsProvider({ children }: { children: ReactNode }) {
  const { state: appState, actions: appActions } = useApp();
  const { me } = useAccount();

  // Load the flow to get connections container
  const flow = useCoState(JazzFlow, appState.activeFlowId || undefined, {
    resolve: { connections: { feed: { $each: true } } },
  });

  const connectionContainer:
    | DeeplyLoadedConnectionContainer
    | null
    | undefined = flow?.connections;

  const connections = useMemo(() => {
    if (!connectionContainer || !connectionContainer.feed) return [];

    const now = Date.now();

    // Convert Jazz connections to Connection objects, filtering out current user
    return Object.values(connectionContainer.feed.perAccount).reduce(
      (acc, entry) => {
        if (!entry.value || !entry.by) {
          return acc;
        }

        // Filter out current user and old connections (older than 10 seconds)
        if (
          entry.by.id === me?._owner.id ||
          now - entry.madeAt.getTime() > 5000
        ) {
          return acc;
        }

        acc.push({
          user: entry.by.id,
          source: entry.value.source,
          sourceType: entry.value.sourceType,
          sourceHandle: entry.value.sourceHandle,
          target: entry.value.target,
          targetType: entry.value.targetType,
          targetHandle: entry.value.targetHandle,
          position: entry.value.position,
          color: appActions.getUserColor(entry.by.id),
        });

        return acc;
      },
      [] as ConnectionOfUser[]
    );
  }, [connectionContainer, me?._owner.id, appActions]);

  const updateConnection = useCallback(
    (connection?: Connection) => {
      if (!connectionContainer?.feed) return;

      const group = connectionContainer._owner.castAs(Group);

      const newConnection = JazzConnection.create(
        connection
          ? {
              source: connection.source,
              sourceType: connection.sourceType,
              sourceHandle: connection.sourceHandle,
              target: connection.target,
              targetType: connection.targetType,
              targetHandle: connection.targetHandle,
              position: connection.position,
            }
          : {
              source: "",
              sourceType: "source",
              sourceHandle: "",
              position: { x: 0, y: 0 },
            },
        group
      );

      connectionContainer.feed.push(newConnection);
    },
    [connectionContainer]
  );

  const connectionsProvider: ConnectionsProvider = {
    state: {
      connections,
      isLoading: false,
      error: null,
    },
    actions: {
      updateConnection,
    },
  };

  return (
    <ConnectionsContext.Provider value={connectionsProvider}>
      {children}
    </ConnectionsContext.Provider>
  );
}

export function ConnectionsProvider({ children }: { children: ReactNode }) {
  return <JazzConnectionsProvider>{children}</JazzConnectionsProvider>;
}

export function useConnections() {
  const context = useContext(ConnectionsContext);
  if (!context) {
    throw new Error("useConnections must be used within a ConnectionsProvider");
  }
  return context;
}
