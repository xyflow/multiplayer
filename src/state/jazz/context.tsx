import { createContext } from "react";

import type { CollaborationProvider } from "./types";

export const CollaborationContext = createContext<CollaborationProvider | null>(
  null
);
