import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StoreState } from "./types";
import { useShallow } from "zustand/shallow";
import { useCallback, useEffect, useState } from "react";
import { useAppStore } from "./store-context";

const selector = (state: StoreState) => ({
  createFlow: state.createFlow,
  joinFlow: state.joinFlow,
  isLoading: state.isLoading,
  error: state.error,
});

export function SelectFlow() {
  const { createFlow, joinFlow, isLoading, error } = useAppStore(
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
