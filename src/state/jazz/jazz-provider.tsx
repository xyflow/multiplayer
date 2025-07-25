import { type ReactNode, useLayoutEffect } from "react";
import { JazzReactProvider, useAccount, useCoState } from "jazz-tools/react";
import {
  JazzFlow,
  JazzRoot,
  Account,
  JazzCursorContainer,
  JazzConnectionContainer,
} from "./schema";
import { appStore, type AppStore } from "./app-store";
import { useShallow } from "zustand/shallow";
import { useStore } from "zustand";

const selector = (state: AppStore) => ({
  setUserId: state.setUserId,
  setJazzFlow: state.setJazzFlow,
  setRoot: state.setRoot,
  setCursors: state.setCursors,
  setConnections: state.setConnections,
});

function JazzZustandSync({ children }: { children: ReactNode }) {
  const { setUserId, setJazzFlow, setRoot, setCursors, setConnections } =
    useStore(appStore, useShallow(selector));

  const { me } = useAccount();

  useLayoutEffect(() => {
    if (me) {
      setUserId(me.id);
    }
  }, [me, setUserId]);

  const root = useCoState(JazzRoot, me?.root?.id, {
    resolve: {
      activeFlow: true,
    },
  });

  const flow = useCoState(JazzFlow, root?.activeFlow?.id, {
    resolve: {
      nodes: { $each: true },
      edges: { $each: true },
      cursors: true,
      connections: true,
    },
  });

  const cursors = useCoState(JazzCursorContainer, flow?.cursors?.id, {
    resolve: {
      feed: { $each: true },
    },
  });

  const connections = useCoState(
    JazzConnectionContainer,
    flow?.connections?.id,
    {
      resolve: {
        feed: { $each: true },
      },
    }
  );

  useLayoutEffect(() => {
    setRoot(root);
  }, [root, setRoot]);

  useLayoutEffect(() => {
    setJazzFlow(flow);
  }, [flow, setJazzFlow]);

  useLayoutEffect(() => {
    setCursors(cursors);
  }, [cursors, setCursors]);

  useLayoutEffect(() => {
    setConnections(connections);
  }, [connections, setConnections]);

  return <>{children}</>;
}

export function JazzProvider({ children }: { children: ReactNode }) {
  return (
    <JazzReactProvider
      AccountSchema={Account}
      sync={{
        peer: "wss://cloud.jazz.tools/?key=peter@xyflow.com",
        when: "always",
      }}
    >
      <JazzZustandSync>{children}</JazzZustandSync>
    </JazzReactProvider>
  );
}
