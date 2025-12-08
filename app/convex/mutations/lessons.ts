import { mutation } from "../_generated/server";
import { v } from "convex/values";

const lessonItemValidator = v.object({
  type: v.union(v.literal("content"), v.literal("diagram")),
  itemId: v.string(),
  order: v.number(),
});

export const createLesson = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    items: v.optional(v.array(lessonItemValidator)),
  },
  returns: v.id("lessons"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("lessons", {
      title: args.title,
      description: args.description,
      items: args.items ?? [],
    });
  },
});

export const updateLesson = mutation({
  args: {
    id: v.id("lessons"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    items: v.optional(v.array(lessonItemValidator)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates: {
      title?: string;
      description?: string;
      items?: Array<{ type: "content" | "diagram"; itemId: string; order: number }>;
    } = {};
    if (updates.title !== undefined) filteredUpdates.title = updates.title;
    if (updates.description !== undefined) filteredUpdates.description = updates.description;
    if (updates.items !== undefined) filteredUpdates.items = updates.items;
    await ctx.db.patch(id, filteredUpdates);
    return null;
  },
});

export const addItemToLesson = mutation({
  args: {
    lessonId: v.id("lessons"),
    type: v.union(v.literal("content"), v.literal("diagram")),
    itemId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new Error("Lesson not found");
    }
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
  returns: v.null(),
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new Error("Lesson not found");
    }
    const currentItems = lesson.items ?? [];
    const newItems = currentItems
      .filter((item) => item.itemId !== args.itemId)
      .map((item, index) => ({ ...item, order: index }));
    await ctx.db.patch(args.lessonId, { items: newItems });
    return null;
  },
});

export const reorderLessonItems = mutation({
  args: {
    lessonId: v.id("lessons"),
    items: v.array(lessonItemValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new Error("Lesson not found");
    }
    await ctx.db.patch(args.lessonId, { items: args.items });
    return null;
  },
});

export const deleteLesson = mutation({
  args: {
    id: v.id("lessons"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});

