// schema.ts
import { co, Group, z } from "jazz-tools";

const Position = z.object({
  x: z.number(),
  y: z.number(),
});

export const JazzNode = co.map({
  type: z.string(),
  position: Position,
  data: z.object({}),
});

export type JazzNodeType = co.loaded<typeof JazzNode>;

export const JazzEdge = co.map({
  type: z.string(),
  source: z.string(),
  sourceHandle: z.optional(z.string()),
  target: z.string(),
  targetHandle: z.optional(z.string()),
});

export type JazzEdgeType = co.loaded<typeof JazzEdge>;

export const JazzCursor = co.map({
  // id: z.string(),
  position: Position,
  isDragging: z.boolean(),
});

export const JazzFlow = co.map({
  name: z.string(),
  nodes: co.list(JazzNode),
  edges: co.list(JazzEdge),
  cursors: co.feed(JazzCursor),
});

export type DeeplyLoadedJazzFlow = co.loaded<
  typeof JazzFlow,
  {
    nodes: { $each: true };
    edges: { $each: true };
    cursors: true;
  }
>;

export const JazzRoot = co.map({
  activeFlow: z.optional(JazzFlow),
});

export const Profile = co.profile({
  name: z.string(),
});

export const Account = co
  .account({
    profile: Profile,
    root: JazzRoot,
  })
  .withMigration((account) => {
    if (account.root === undefined) {
      account.root = JazzRoot.create({});
    }
    if (account.profile === undefined) {
      const group = Group.create();
      group.makePublic();

      account.profile = Profile.create(
        {
          name: "Anonymous user",
        },
        group
      );
    }
  });
