import type { StateCreator } from "zustand";
import type { DeeplyLoadedConnectionContainer } from "./schema";
import type { Connection, ConnectionOfUser } from "./types";
import type { AppStore } from "./app-store";

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

export interface ConnectionStore {
  connections: ConnectionOfUser[];
  jazzConnections: DeeplyLoadedConnectionContainer | undefined | null;
  setConnections: (
    jazzConnections?: DeeplyLoadedConnectionContainer | null
  ) => void;
  updateConnection: (connection?: Connection) => void;
}

export const createConnectionSlice: StateCreator<
  AppStore,
  [],
  [],
  ConnectionStore
> = (set, get) => ({
  connections: [],
  jazzConnections: undefined,
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
});
