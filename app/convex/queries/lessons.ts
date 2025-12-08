import { query } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

export const getLessons = query({
  args: {},
  handler: async (ctx) => {
    const lessons = await ctx.db.query("lessons").collect();
    // Normalize lessons to always have items array
    return lessons.map((lesson) => ({
      ...lesson,
      items: lesson.items ?? [],
    }));
  },
});

export const getLesson = query({
  args: {
    id: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.id);
    if (!lesson) return null;
    return {
      ...lesson,
      items: lesson.items ?? [],
    };
  },
});

// Get lesson with all its content and diagram data resolved
export const getLessonWithItems = query({
  args: {
    id: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.id);
    if (!lesson) {
      return null;
    }

    const items = lesson.items ?? [];
    const resolvedItems = await Promise.all(
      items.map(async (item) => {
        if (item.type === "content") {
          const content = await ctx.db.get(item.itemId as Id<"contents">);
          return {
            type: "content" as const,
            order: item.order,
            data: content,
          };
        } else {
          const diagram = await ctx.db.get(item.itemId as Id<"diagrams">);
          return {
            type: "diagram" as const,
            order: item.order,
            data: diagram,
          };
        }
      })
    );

    return {
      _id: lesson._id,
      _creationTime: lesson._creationTime,
      title: lesson.title,
      description: lesson.description,
      resolvedItems: resolvedItems.sort((a, b) => a.order - b.order),
    };
  },
});
