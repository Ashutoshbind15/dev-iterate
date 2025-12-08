import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Rich text content blocks
  contents: defineTable({
    title: v.string(),
    content: v.string(), // JSON stringified TipTap content
  }),

  // Excalidraw diagrams
  diagrams: defineTable({
    title: v.string(),
    elements: v.string(), // JSON stringified Excalidraw elements
    appState: v.string(), // JSON stringified Excalidraw appState
  }),

  // Lessons that contain ordered content and diagrams
  lessons: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    items: v.optional(
      v.array(
        v.object({
          type: v.union(v.literal("content"), v.literal("diagram")),
          itemId: v.string(), // ID reference to content or diagram
          order: v.number(),
        })
      )
    ),
  }),
});
