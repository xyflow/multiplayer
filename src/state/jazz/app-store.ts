import { createStore } from "zustand";
import {
  JazzEdge,
  JazzNode,
  JazzFlow,
  JazzCursorContainer,
  JazzConnectionContainer,
  type LoadedJazzRoot,
} from "./schema";
import { Group, co } from "jazz-tools";
import { createConnectionSlice, type ConnectionStore } from "./connections";
import { createCursorSlice, type CursorStore } from "./cursors";
import { createFlowSlice, type FlowStore } from "./flow";

const ALL_COLORS = [
  "#DA702C",
  "#D0A215",
  "#879A39",
  "#3AA99F",
  "#4385BE",
  "#D14D41",
  "#8B7EC8",
  "#CE5D97",
];

export interface AppStore extends ConnectionStore, CursorStore, FlowStore {
  activeFlowId?: string | null;
  userId?: string | null;
  jazzRoot: LoadedJazzRoot | null | undefined;
  isLoading: boolean;
  error: string | null;
  setRoot: (root?: LoadedJazzRoot | null) => void;
  setActiveFlowId: (activeFlowId: string) => void;
  getUserColor: (userId: string) => string;
  setUserId: (userId: string) => void;
  createFlow: () => void;
  joinFlow: (flowId: string) => Promise<boolean>;
  exitFlow: () => void;
}

export const appStore = createStore<AppStore>((set, get, store) => {
  const colorMap = new Map<string, string>();
  let colorIndex = 0;

  function getNextUserColor() {
    if (++colorIndex >= ALL_COLORS.length) {
      colorIndex = 0;
    }
    return ALL_COLORS[colorIndex];
  }

  return {
    activeFlowId: undefined,
    userId: undefined,
    jazzRoot: undefined,
    isLoading: false,
    error: null,
    setActiveFlowId: (activeFlowId: string) => set({ activeFlowId }),
    setUserId: (userId: string) => set({ userId }),
    getUserColor: (userId: string) => {
      if (!colorMap.has(userId)) {
        colorMap.set(userId, getNextUserColor());
      }
      return colorMap.get(userId)!;
    },
    setRoot: (jazzRoot) => {
      set({ jazzRoot });
    },
    createFlow: () => {
      const { jazzRoot } = get();
      if (!jazzRoot) return;

      const publicGroup = Group.create();
      publicGroup.addMember("everyone", "writer");

      jazzRoot.activeFlow = JazzFlow.create(
        {
          name: "New Flow",
          nodes: co.list(JazzNode).create([], publicGroup),
          edges: co.list(JazzEdge).create([], publicGroup),
          cursors: JazzCursorContainer.create(
            {
              feed: JazzCursorContainer.def.shape.feed.create([], publicGroup),
              version: 1,
            },
            publicGroup
          ),
          connections: JazzConnectionContainer.create(
            {
              feed: JazzConnectionContainer.def.shape.feed.create(
                [],
                publicGroup
              ),
              version: 1,
            },
            publicGroup
          ),
        },
        publicGroup
      );
    },
    joinFlow: async (flowId: string): Promise<boolean> => {
      const { jazzRoot } = get();
      if (!flowId || !jazzRoot) return false;

      set({ isLoading: true, error: null });

      try {
        const flow = await JazzFlow.load(flowId);

        if (!flow) {
          set({ error: "Invalid flow code" });
          return false;
        }

        jazzRoot.activeFlow = flow;
        set({ error: null });
        return true;
      } catch (error) {
        set({ error: "Failed to join flow" });
        console.error(error);
        return false;
      } finally {
        set({ isLoading: false });
      }
    },
    exitFlow: () => {
      const { jazzRoot } = get();
      if (!jazzRoot) return;
      jazzRoot.activeFlow = undefined;
      set({ activeFlowId: undefined });
    },
    ...createFlowSlice(set, get, store),
    ...createConnectionSlice(set, get, store),
    ...createCursorSlice(set, get, store),
  };
});
