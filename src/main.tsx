import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Toaster } from "@/components/ui/sonner";
import { JazzProvider } from "./state/jazz/jazz-provider.tsx";

import "@xyflow/react/dist/style.css";
import "./index.css";

import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <JazzProvider>
      <App />
    </JazzProvider>
    <Toaster />
  </StrictMode>
);
