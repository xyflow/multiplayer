import {
  type ReactNode,
  useState,
  useMemo,
  useContext,
  createContext,
  useRef,
} from "react";
import { JazzReactProvider, useAccount, useCoState } from "jazz-tools/react";
import { Group, co } from "jazz-tools";
import {
  JazzNode,
  JazzEdge,
  JazzFlow,
  JazzRoot,
  Account,
  JazzCursorContainer,
  JazzConnectionContainer,
} from "./schema";
import type { AppState, AppActions, AppProvider } from "./types";

export const AppContext = createContext<AppProvider | null>(null);

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

function JazzAppProvider({ children }: { children: ReactNode }) {
  const { me } = useAccount();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const root = useCoState(JazzRoot, me?.root?.id);

  const colorMap = useRef(new Map<string, string>());
  const colorIndex = useRef(0);

  function getNextUserColor() {
    if (++colorIndex.current >= allColors.length) {
      colorIndex.current = 0;
    }
    return allColors[colorIndex.current];
  }

  const state: AppState = useMemo(
    () => ({
      activeFlowId: root?.activeFlow?.id || null || undefined,
      userId: me?._owner.id || null,
      isLoading,
      error,
    }),
    [root?.activeFlow?.id, me?._owner.id, isLoading, error]
  );

  const actions: AppActions = useMemo(
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
            cursors: JazzCursorContainer.create(
              {
                feed: JazzCursorContainer.def.shape.feed.create(
                  [],
                  publicGroup
                ),
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
        if (!flowId || !root) return false;

        setIsLoading(true);
        setError(null);

        try {
          const flow = await JazzFlow.load(flowId);

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

      getUserColor: (userId: string) => {
        if (!colorMap.current.has(userId)) {
          colorMap.current.set(userId, getNextUserColor());
        }
        return colorMap.current.get(userId)!;
      },
    }),
    [root]
  );

  const appProvider: AppProvider = {
    state,
    actions,
  };

  return (
    <AppContext.Provider value={appProvider}>{children}</AppContext.Provider>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <JazzReactProvider
      AccountSchema={Account}
      sync={{
        peer: "wss://cloud.jazz.tools/?key=peter@xyflow.com",
        when: "always",
      }}
    >
      <JazzAppProvider>{children}</JazzAppProvider>
    </JazzReactProvider>
  );
}

export function useApp(): AppProvider {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
