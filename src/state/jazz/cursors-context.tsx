import {
  createContext,
  useContext,
  type ReactNode,
  useMemo,
  useCallback,
} from "react";
import { useAccount, useCoState } from "jazz-tools/react";
import type { XYPosition } from "@xyflow/react";
import {
  JazzFlow,
  type DeeplyLoadedCursorContainer,
} from "./schema";
import type { Cursor } from "./types";
import { useApp } from "./app-context";

export interface CursorsState {
  cursors: Cursor[];
  isLoading: boolean;
  error: string | null;
}

export interface CursorsActions {
  updateCursor: (cursor: { position: XYPosition; dragging: boolean }) => void;
}

export interface CursorsProvider {
  state: CursorsState;
  actions: CursorsActions;
}

export const CursorsContext = createContext<CursorsProvider | null>(null);

function serializeValues(entry: { position: XYPosition; dragging: boolean }) {
  return `${entry.position.x}/${entry.position.y}/${entry.dragging ? "1" : "0"}`;
}

function deserializeValues(value: string) {
  const [x, y, dragging] = value.split("/");
  return {
    position: { x: Number(x), y: Number(y) },
    dragging: dragging === "1",
  };
}

function JazzCursorsProvider({ children }: { children: ReactNode }) {
  const { state: appState, actions: appActions } = useApp();
  const { me } = useAccount();

  // Load the flow to get cursors container
  const flow = useCoState(JazzFlow, appState.activeFlowId || undefined, {
    resolve: { cursors: { feed: { $each: true } } },
  });

  const cursorContainer: DeeplyLoadedCursorContainer | null | undefined =
    flow?.cursors;

  const cursors: Cursor[] = useMemo(() => {
    if (!cursorContainer || !cursorContainer.feed) return [];
    const now = Date.now();
    // Convert Jazz cursors to Cursor objects, filtering out current user
    return Object.values(cursorContainer.feed.perAccount).reduce(
      (acc, entry) => {
        if (!entry.value || !entry.by) {
          return acc;
        }

        if (
          entry.by.id === me?._owner.id ||
          now - entry.madeAt.getTime() > 10000
        ) {
          return acc;
        }

        const values = deserializeValues(entry.value);

        acc.push({
          user: entry.by.id,
          position: values.position,
          dragging: values.dragging,
          color: appActions.getUserColor(entry.by.id),
        });
        return acc;
      },
      [] as Cursor[]
    );
  }, [cursorContainer, me?._owner.id, appActions]);

  const updateCursor = useCallback(
    (cursor: { position: XYPosition; dragging: boolean }) => {
      if (!cursorContainer?.feed) return;

      cursorContainer.feed.push(
        serializeValues({
          position: cursor.position,
          dragging: cursor.dragging,
        })
      );
    },
    [cursorContainer]
  );

  const cursorsProvider: CursorsProvider = {
    state: {
      cursors,
      isLoading: false,
      error: null,
    },
    actions: {
      updateCursor,
    },
  };

  return (
    <CursorsContext.Provider value={cursorsProvider}>
      {children}
    </CursorsContext.Provider>
  );
}

export function CursorsProvider({ children }: { children: ReactNode }) {
  return <JazzCursorsProvider>{children}</JazzCursorsProvider>;
}

export function useCursors() {
  const context = useContext(CursorsContext);
  if (!context) {
    throw new Error("useCursors must be used within a CursorsProvider");
  }
  return context;
}
