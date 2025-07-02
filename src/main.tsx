import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Toaster } from "@/components/ui/sonner";
import { CollaborationProvider } from "./state/jazz/provider";

import "@xyflow/react/dist/style.css";
import "./index.css";

import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CollaborationProvider>
      <App />
    </CollaborationProvider>
    <Toaster />
  </StrictMode>
);
