import type { StateCreator } from "zustand";
import type { XYPosition } from "@xyflow/react";
import type { DeeplyLoadedCursorContainer } from "./schema";
import type { Cursor } from "./types";
import type { AppStore } from "./app-store";

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

export interface CursorStore {
  cursors: Cursor[];
  jazzCursors: DeeplyLoadedCursorContainer | null | undefined;
  setCursors: (cursors?: DeeplyLoadedCursorContainer | null) => void;
  updateCursor: (cursor: { position: XYPosition; dragging: boolean }) => void;
}

export const createCursorSlice: StateCreator<AppStore, [], [], CursorStore> = (
  set,
  get
) => ({
  cursors: [],
  jazzCursors: undefined,
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
});
