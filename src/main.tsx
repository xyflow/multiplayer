import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { JazzReactProvider } from "jazz-tools/react";
import { Account } from "./state/schema.ts";

import { Toaster } from "@/components/ui/sonner";

import "@xyflow/react/dist/style.css";
import "./index.css";

import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <JazzReactProvider
      AccountSchema={Account}
      sync={{
        peer: "wss://cloud.jazz.tools/?key=peter@xyflow.com",
        when: "always",
      }}
    >
      <App />
    </JazzReactProvider>
    <Toaster />
  </StrictMode>
);
