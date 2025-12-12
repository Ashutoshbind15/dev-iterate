import { mutation } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";

const lessonItemValidator = v.object({
  type: v.union(v.literal("content"), v.literal("diagram")),
  itemId: v.string(),
  order: v.number(),
});

async function assertOwnsLesson(
  ctx: MutationCtx,
  lessonId: Id<"lessons">,
  userId: Id<"users">
) {
  const lesson = await ctx.db.get(lessonId);
  if (!lesson) {
    throw new ConvexError("Lesson not found");
  }
  if (lesson.userId !== userId) {
    throw new ConvexError("Not authorized");
  }
  return lesson;
}

async function assertOwnsLessonItems(
  ctx: MutationCtx,
  userId: Id<"users">,
  items: Array<{ type: "content" | "diagram"; itemId: string; order: number }>
) {
  // Validate existence + ownership of all referenced items
  for (const item of items) {
    if (item.type === "content") {
      const content = await ctx.db.get(item.itemId as Id<"contents">);
      if (!content) {
        throw new ConvexError("Content not found");
      }
      if (content.userId !== userId) {
        throw new ConvexError("Not authorized");
      }
    } else {
      const diagram = await ctx.db.get(item.itemId as Id<"diagrams">);
      if (!diagram) {
        throw new ConvexError("Diagram not found");
      }
      if (diagram.userId !== userId) {
        throw new ConvexError("Not authorized");
      }
    }
  }
}

export const createLesson = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    items: v.optional(v.array(lessonItemValidator)),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    const items = args.items ?? [];
    await assertOwnsLessonItems(ctx, userId, items);

    const tags = (args.tags ?? [])
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    return await ctx.db.insert("lessons", {
      title: args.title,
      description: args.description,
      items,
      tags,
      upvotes: 0,
      userId,
    });
  },
});

export const updateLesson = mutation({
  args: {
    id: v.id("lessons"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    items: v.optional(v.array(lessonItemValidator)),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    await assertOwnsLesson(ctx, args.id, userId);
    if (args.items !== undefined) {
      await assertOwnsLessonItems(ctx, userId, args.items);
    }

    const { id, ...updates } = args;
    const filteredUpdates: {
      title?: string;
      description?: string;
      items?: Array<{
        type: "content" | "diagram";
        itemId: string;
        order: number;
      }>;
      tags?: Array<string>;
    } = {};
    if (updates.title !== undefined) filteredUpdates.title = updates.title;
    if (updates.description !== undefined)
      filteredUpdates.description = updates.description;
    if (updates.items !== undefined) filteredUpdates.items = updates.items;
    if (updates.tags !== undefined) {
      filteredUpdates.tags = updates.tags
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    }
    await ctx.db.patch(id, filteredUpdates);
    return null;
  },
});

export const voteLesson = mutation({
  args: {
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new ConvexError("Lesson not found");
    }

    const existingVote = await ctx.db
      .query("lessonVotes")
      .withIndex("by_lessonId_and_userId", (q) =>
        q.eq("lessonId", args.lessonId).eq("userId", userId)
      )
      .first();

    const currentUpvotes = lesson.upvotes ?? 0;

    if (existingVote) {
      // Toggle off
      await ctx.db.delete(existingVote._id);
      await ctx.db.patch(args.lessonId, {
        upvotes: Math.max(0, currentUpvotes - 1),
      });
      return null;
    }

    await ctx.db.insert("lessonVotes", {
      lessonId: args.lessonId,
      userId,
    });
    await ctx.db.patch(args.lessonId, { upvotes: currentUpvotes + 1 });
    return null;
  },
});

export const addItemToLesson = mutation({
  args: {
    lessonId: v.id("lessons"),
    type: v.union(v.literal("content"), v.literal("diagram")),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    const lesson = await assertOwnsLesson(ctx, args.lessonId, userId);

    await assertOwnsLessonItems(ctx, userId, [
      { type: args.type, itemId: args.itemId, order: 0 },
    ]);

    const currentItems = lesson.items ?? [];
    const newOrder = currentItems.length;
    const newItems = [
      ...currentItems,
      { type: args.type, itemId: args.itemId, order: newOrder },
    ];
    await ctx.db.patch(args.lessonId, { items: newItems });
    return null;
  },
});

export const removeItemFromLesson = mutation({
  args: {
    lessonId: v.id("lessons"),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    const lesson = await assertOwnsLesson(ctx, args.lessonId, userId);
    const currentItems: Array<{
      type: "content" | "diagram";
      itemId: string;
      order: number;
    }> = lesson.items ?? [];
    const newItems = currentItems
      .filter((item: { itemId: string }) => item.itemId !== args.itemId)
      .map(
        (
          item: { type: "content" | "diagram"; itemId: string; order: number },
          index: number
        ) => ({ ...item, order: index })
      );
    await ctx.db.patch(args.lessonId, { items: newItems });
    return null;
  },
});

export const reorderLessonItems = mutation({
  args: {
    lessonId: v.id("lessons"),
    items: v.array(lessonItemValidator),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    await assertOwnsLesson(ctx, args.lessonId, userId);
    await assertOwnsLessonItems(ctx, userId, args.items);
    await ctx.db.patch(args.lessonId, { items: args.items });
    return null;
  },
});

export const deleteLesson = mutation({
  args: {
    id: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      // Idempotent delete
      return null;
    }
    if (existing.userId !== userId) {
      throw new ConvexError("Not authorized");
    }
    await ctx.db.delete(args.id);
    return null;
  },
});
