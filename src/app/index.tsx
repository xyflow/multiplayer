import { useStore } from "zustand";
import { useShallow } from "zustand/shallow";
import { ReactFlowProvider } from "@xyflow/react";

import type { Store, StoreState } from "./types";
import { Flow } from "./active-flow";
import { SelectFlow } from "./select-flow";
import { AppStoreContext } from "./store-context";

const selector = (state: StoreState) => ({
  activeFlowId: state.activeFlowId,
});

export function App({ store }: { store: Store }) {
  const { activeFlowId } = useStore(store, useShallow(selector));

  return (
    <AppStoreContext.Provider value={store}>
      {activeFlowId && (
        <ReactFlowProvider>
          <Flow />
        </ReactFlowProvider>
      )}
      {!activeFlowId && <SelectFlow />}
    </AppStoreContext.Provider>
  );
}
