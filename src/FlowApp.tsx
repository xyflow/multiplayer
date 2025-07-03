import { Flow } from "./flow";
import type { FlowActions, FlowState } from "./state/jazz/types";

// Potential place for additional ui elements that are connected to the flow
function App({ flow, actions }: { flow: FlowState; actions: FlowActions }) {
  return <Flow flow={flow} actions={actions} />;
}

export default App;
