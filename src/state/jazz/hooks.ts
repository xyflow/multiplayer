import { useContext } from "react";
import { CollaborationContext } from "./context";
import type { CollaborationProvider } from "./types";

export function useCollaboration(): CollaborationProvider {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error(
      "useCollaboration must be used within a CollaborationProvider"
    );
  }
  return context;
}
