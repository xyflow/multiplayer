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
  position: Position,
  dragging: z.boolean(),
});

export const JazzCursorContainer = co.map({
  feed: co.feed(z.string()),
  version: z.literal(1),
}).withMigration((container) => {
  if (container.version === undefined) {
    container.version = 1;
    // Reset the feed to an empty feed
    container.feed = co.feed(z.string()).create([], container._owner);
  }
});

export type DeeplyLoadedCursorContainer = co.loaded<
  typeof JazzCursorContainer,
  {
    feed: { $each: true };
  }
>;

const HandleType = z.enum(["source", "target"]);

export const JazzConnection = co.map({
  source: z.string(),
  sourceType: HandleType,
  sourceHandle: z.optional(z.string()),
  target: z.optional(z.string()),
  targetType: z.optional(HandleType),
  targetHandle: z.optional(z.string()),
  position: Position,
});

export const JazzConnectionContainer = co.map({
  feed: co.feed(z.optional(JazzConnection)),
});

export type DeeplyLoadedConnectionContainer = co.loaded<
  typeof JazzConnectionContainer,
  {
    feed: { $each: true };
  }
>;

export const JazzFlow = co.map({
  name: z.string(),
  nodes: co.list(JazzNode),
  edges: co.list(JazzEdge),
  cursors: JazzCursorContainer,
  connections: JazzConnectionContainer,
});

export type DeeplyLoadedJazzFlow = co.loaded<
  typeof JazzFlow,
  {
    nodes: { $each: true };
    edges: { $each: true };
    cursors: true;
    connections: true;
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
