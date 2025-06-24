import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { co, Group } from "jazz-tools";
import { useAccount, useCoState } from "jazz-tools/react";
import { useEffect, useState } from "react";
import { JazzEdge, JazzFlow, JazzNode, JazzRoot } from "./state/schema";
import FlowApp from "./FlowApp";

export default function App() {
  const { me } = useAccount();

  const [flowCode, setFlowCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const root = useCoState(JazzRoot, me?.root?.id, {
    resolve: {
      lastOpenedFlow: {
        nodes: { $each: true },
        edges: { $each: true },
      },
    },
  });

  function createFlow() {
    if (!root) return;

    const publicGroup = Group.create();
    publicGroup.addMember("everyone", "writer");

    root.lastOpenedFlow = JazzFlow.create(
      {
        name: "New Flow",
        nodes: co.list(JazzNode).create([], publicGroup),
        edges: co.list(JazzEdge).create([], publicGroup),
      },
      publicGroup
    );
  }

  async function joinFlow() {
    if (!flowCode || !root) return;

    setIsLoading(true);
    setError(null); // Clear any previous errors

    try {
      const flow = await JazzFlow.load(flowCode, {
        resolve: {
          nodes: { $each: true },
          edges: { $each: true },
        },
      });

      if (!flow) {
        setError("Invalid flow code");
        setFlowCode("");
        return;
      }

      if (flow) {
        root.lastOpenedFlow = flow;
        setFlowCode("");
        setError(null);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function exitFlow() {
    if (!root) return;
    root.lastOpenedFlow = undefined;
  }

  useEffect(() => {
    if (flowCode.length === 30 && !isLoading && !error) {
      joinFlow();
    }
  });

  if (root?.lastOpenedFlow) {
    return <FlowApp flow={root.lastOpenedFlow} exitFlow={exitFlow} />;
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
              if (error) setError(null); // Clear error when user starts typing
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isLoading) {
                joinFlow();
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
