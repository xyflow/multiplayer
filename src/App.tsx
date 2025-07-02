import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useState } from "react";
import { useCollaboration } from "./state/jazz/hooks";
import FlowApp from "./FlowApp";

export default function App() {
  const { state, actions } = useCollaboration();
  const [flowCode, setFlowCode] = useState("");

  const handleJoinFlow = useCallback(
    async function handleJoinFlow() {
      if (!flowCode) return;

      const success = await actions.joinFlow(flowCode);
      if (success) {
        setFlowCode("");
      }
    },
    [flowCode, actions.joinFlow]
  );

  useEffect(() => {
    if (flowCode.length === 30 && !state.isLoading && !state.error) {
      handleJoinFlow();
    }
  }, [flowCode, state.isLoading, state.error, handleJoinFlow]);

  if (!state.userId) {
    return null;
  }

  if (state.currentFlow) {
    return <FlowApp flow={state.currentFlow} actions={actions} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-6 w-full max-w-md px-6">
        <Button
          size="lg"
          className="w-full"
          onClick={actions.createFlow}
          disabled={state.isLoading}
        >
          Create new flow
        </Button>

        <div className="text-muted-foreground text-sm font-medium">or</div>

        <div className="w-full space-y-2">
          <Input
            placeholder={
              state.isLoading ? "Loading..." : "Join an existing flow"
            }
            className="w-full"
            value={flowCode}
            onChange={(e) => {
              setFlowCode(e.target.value.trim());
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !state.isLoading) {
                handleJoinFlow();
              }
            }}
            aria-invalid={!!state.error}
            disabled={state.isLoading}
          />
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
