import { internalMutation, mutation } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const sysLessonItemValidator = v.object({
  type: v.union(v.literal("content"), v.literal("diagram")),
  itemId: v.string(),
  order: v.number(),
});

export const createSysLesson = internalMutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  returns: v.id("sysLessons"),
  handler: async (ctx, args) => {
    const title = args.title.trim();
    if (!title) throw new ConvexError("Title is required");

    const tags = (args.tags ?? [])
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    return await ctx.db.insert("sysLessons", {
      title,
      description: args.description?.trim() || undefined,
      tags,
      upvotes: 0,
      items: [],
    });
  },
});

export const addItemToSysLesson = internalMutation({
  args: {
    lessonId: v.id("sysLessons"),
    item: sysLessonItemValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) throw new ConvexError("System lesson not found");

    const existingItems = lesson.items ?? [];
    // Prevent duplicates by itemId/type.
    if (
      existingItems.some(
        (it) => it.type === args.item.type && it.itemId === args.item.itemId
      )
    ) {
      return null;
    }

    const nextItems = [...existingItems, args.item].sort(
      (a, b) => a.order - b.order
    );

    await ctx.db.patch(args.lessonId, { items: nextItems });
    return null;
  },
});

export const voteSysLesson = mutation({
  args: {
    lessonId: v.id("sysLessons"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) throw new ConvexError("System lesson not found");

    const existingVote = await ctx.db
      .query("sysLessonVotes")
      .withIndex("by_lessonId_and_userId", (q) =>
        q.eq("lessonId", args.lessonId).eq("userId", userId)
      )
      .first();

    const currentUpvotes = lesson.upvotes ?? 0;

    if (existingVote) {
      await ctx.db.delete(existingVote._id);
      await ctx.db.patch(args.lessonId, {
        upvotes: Math.max(0, currentUpvotes - 1),
      });
      return null;
    }

    await ctx.db.insert("sysLessonVotes", {
      lessonId: args.lessonId,
      userId,
    });
    await ctx.db.patch(args.lessonId, { upvotes: currentUpvotes + 1 });
    return null;
  },
});


