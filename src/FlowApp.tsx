import { ReactFlowProvider } from "@xyflow/react";

import { Flow } from "./flow";
import type { FlowActions, FlowState } from "./state/jazz/types";

function App({ flow, actions }: { flow: FlowState; actions: FlowActions }) {
  return (
    <ReactFlowProvider>
      <Flow flow={flow} actions={actions} />
    </ReactFlowProvider>
  );
}

export default App;
