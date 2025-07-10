import { useConnections } from "@/state/jazz/connections-context";
import { useConnection, ViewportPortal } from "@xyflow/react";
import { useEffect } from "react";
import { useThrottle } from "@/lib/useThrottle";
import { ConnectionEdge } from "./ConnectionEdge";

export function Connections() {
  const { state, actions } = useConnections();
  const connection = useConnection();

  // Throttle connection updates to 100ms for smoother real-time collaboration
  const throttledUpdateConnection = useThrottle(actions.updateConnection, {
    delay: 64,
  });

  useEffect(() => {
    throttledUpdateConnection(
      connection.inProgress
        ? {
            source: connection.fromNode.id,
            sourceType: connection.fromHandle.type,
            sourceHandle: connection.fromHandle.id || undefined,
            target: connection.toNode?.id || undefined,
            targetType: connection.toHandle?.type || undefined,
            targetHandle: connection.toHandle?.id || undefined,
            position: connection.to,
          }
        : undefined
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection]);

  // use this connection to render a "temporary connection edge for other users"

  return (
    <ViewportPortal>
      {state.connections.map((connection) => (
        <ConnectionEdge key={connection.user} connection={connection} />
      ))}
    </ViewportPortal>
  );
}
