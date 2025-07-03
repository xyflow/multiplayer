import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Toaster } from "@/components/ui/sonner";
import { AppProvider } from "./state/jazz/app-context";
import { FlowProvider } from "./state/jazz/flow-context";

import "@xyflow/react/dist/style.css";
import "./index.css";

import App from "./App.tsx";
import { CursorsProvider } from "./state/jazz/cursors-context.tsx";
import { ConnectionsProvider } from "./state/jazz/connections-context.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProvider>
      <FlowProvider>
        <CursorsProvider>
          <ConnectionsProvider>
            <App />
          </ConnectionsProvider>
        </CursorsProvider>
      </FlowProvider>
    </AppProvider>
    <Toaster />
  </StrictMode>
);
