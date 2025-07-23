import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Toaster } from "@/components/ui/sonner";
import { JazzProvider } from "./state/jazz/jazz-provider.tsx";

import "@xyflow/react/dist/style.css";
import "./index.css";

import { App } from "./app";
import { appStore } from "./state/jazz/app-store.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <JazzProvider>
      <App store={appStore} />
    </JazzProvider>
    <Toaster />
  </StrictMode>
);
