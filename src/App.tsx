import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useState } from "react";
import { useApp } from "./state/jazz/app-context";
import { useFlow } from "./state/jazz/flow-context";
import FlowApp from "./FlowApp";
import { ReactFlowProvider } from "@xyflow/react";

export default function App() {
  const { state: appState, actions: appActions } = useApp();
  const { state: flowState, actions: flowActions } = useFlow();
  const [flowCode, setFlowCode] = useState("");

  const handleJoinFlow = useCallback(
    async function handleJoinFlow() {
      if (!flowCode) return;

      const success = await appActions.joinFlow(flowCode);
      if (success) {
        setFlowCode("");
      }
    },
    [flowCode, appActions]
  );

  useEffect(() => {
    if (flowCode.length === 30 && !appState.isLoading && !appState.error) {
      handleJoinFlow();
    }
  }, [flowCode, appState.isLoading, appState.error, handleJoinFlow]);

  if (!appState.userId) {
    return null;
  }

  if (flowState) {
    return (
      <ReactFlowProvider>
        <FlowApp flow={flowState} actions={flowActions} />
      </ReactFlowProvider>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-6 w-full max-w-md px-6">
        <Button
          size="lg"
          className="w-full"
          onClick={appActions.createFlow}
          disabled={appState.isLoading}
        >
          Create new flow
        </Button>

        <div className="text-muted-foreground text-sm font-medium">or</div>

        <div className="w-full space-y-2">
          <Input
            placeholder={
              appState.isLoading ? "Loading..." : "Join an existing flow"
            }
            className="w-full"
            value={flowCode}
            onChange={(e) => {
              setFlowCode(e.target.value.trim());
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !appState.isLoading) {
                handleJoinFlow();
              }
            }}
            aria-invalid={!!appState.error}
            disabled={appState.isLoading}
          />
          {appState.error && (
            <p className="text-sm text-destructive">{appState.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
