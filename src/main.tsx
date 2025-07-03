import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Toaster } from "@/components/ui/sonner";
import { CollaborationProvider } from "./state/jazz/flow-context.tsx";

import "@xyflow/react/dist/style.css";
import "./index.css";

import App from "./App.tsx";
import { CursorsProvider } from "./state/jazz/cursors-context.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CollaborationProvider>
      <CursorsProvider>
        <App />
      </CursorsProvider>
    </CollaborationProvider>
    <Toaster />
  </StrictMode>
);
