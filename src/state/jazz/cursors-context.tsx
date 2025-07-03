import {
  createContext,
  useContext,
  type ReactNode,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useAccount, useCoState } from "jazz-tools/react";
import { Group } from "jazz-tools";
import type { XYPosition } from "@xyflow/react";
import {
  JazzCursor,
  JazzCursorContainer,
  type DeeplyLoadedCursorContainer,
} from "./schema";
import type { Cursor } from "./types";
import { useCollaboration } from "./flow-context";

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

const allColors = [
  "#D14D41",
  "#DA702C",
  "#D0A215",
  "#879A39",
  "#3AA99F",
  "#4385BE",
  "#8B7EC8",
  "#CE5D97",
];

function JazzCursorsProvider({ children }: { children: ReactNode }) {
  const { rawState } = useCollaboration();
  //   console.log(rawState);
  const { me } = useAccount();

  const colorMap = useRef(new Map<string, string>());

  const cursorContainer: DeeplyLoadedCursorContainer | null | undefined =
    useCoState(JazzCursorContainer, rawState?.cursors?.id, {
      resolve: { feed: { $each: true } },
    });

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

        if (!colorMap.current.has(entry.by.id)) {
          colorMap.current.set(
            entry.by.id,
            allColors[Math.floor(Math.random() * allColors.length)]
          );
        }

        acc.push({
          user: entry.by.id,
          position: entry.value.position,
          dragging: entry.value.dragging,
          color: colorMap.current.get(entry.by.id)!,
        });
        return acc;
      },
      [] as Cursor[]
    );
  }, [cursorContainer, me?._owner.id]);

  const updateCursor = useCallback(
    (cursor: { position: XYPosition; dragging: boolean }) => {
      if (!cursorContainer?.feed) return;

      const group = cursorContainer._owner.castAs(Group);
      const newCursor = JazzCursor.create(
        {
          position: { ...cursor.position },
          dragging: cursor.dragging,
        },
        group
      );

      cursorContainer.feed.push(newCursor);
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
