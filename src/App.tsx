import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { useAppStore, type AppStore } from "./state/jazz/app-store";
import { useShallow } from "zustand/shallow";
import { Flow } from "./flow";

const selector = (state: AppStore) => ({
  activeFlowId: state.activeFlowId,
  isLoading: state.isLoading,
  error: state.error,
  joinFlow: state.joinFlow,
  createFlow: state.createFlow,
});

export default function App() {
  const { activeFlowId, isLoading, error, joinFlow, createFlow } = useAppStore(
    useShallow(selector)
  );
  const [flowCode, setFlowCode] = useState("");

  const handleJoinFlow = useCallback(
    async function handleJoinFlow() {
      if (!flowCode) return;

      const success = await joinFlow(flowCode);
      if (success) {
        setFlowCode("");
      }
    },
    [flowCode, joinFlow]
  );

  useEffect(() => {
    if (flowCode.length === 30 && !isLoading && !error) {
      handleJoinFlow();
    }
  }, [flowCode, isLoading, error, handleJoinFlow]);

  if (activeFlowId) {
    return (
      <ReactFlowProvider>
        <Flow />
      </ReactFlowProvider>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-6 w-full max-w-md px-6">
        <Button
          size="lg"
          className="w-full"
          onClick={createFlow}
          disabled={isLoading}
        >
          Create new flow
        </Button>

        <div className="text-muted-foreground text-sm font-medium">or</div>

        <div className="w-full space-y-2">
          <Input
            placeholder={isLoading ? "Loading..." : "Join an existing flow"}
            className="w-full"
            value={flowCode}
            onChange={(e) => {
              setFlowCode(e.target.value.trim());
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isLoading) {
                handleJoinFlow();
              }
            }}
            aria-invalid={!!error}
            disabled={isLoading}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}
