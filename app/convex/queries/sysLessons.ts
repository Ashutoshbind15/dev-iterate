import { query } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";

export const getAllSysLessonTags = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const lessons = await ctx.db.query("sysLessons").collect();
    const allTags = new Set<string>();
    lessons.forEach((l) => {
      (l.tags ?? []).forEach((tag) => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  },
});

export const getSysLessonPublicWithItems = query({
  args: {
    id: v.id("sysLessons"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("sysLessons"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      tags: v.array(v.string()),
      upvotes: v.number(),
      resolvedItems: v.array(
        v.object({
          type: v.union(v.literal("content"), v.literal("diagram")),
          order: v.number(),
          data: v.any(),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.id);
    if (!lesson) return null;

    const items = lesson.items ?? [];
    const resolvedItems = await Promise.all(
      items.map(async (item) => {
        if (item.type === "content") {
          const content = await ctx.db.get(item.itemId as Id<"sysContents">);
          return {
            type: "content" as const,
            order: item.order,
            data: content,
          };
        }
        const diagram = await ctx.db.get(item.itemId as Id<"sysDiagrams">);
        return {
          type: "diagram" as const,
          order: item.order,
          data: diagram,
        };
      })
    );

    return {
      _id: lesson._id,
      _creationTime: lesson._creationTime,
      title: lesson.title,
      description: lesson.description,
      tags: lesson.tags ?? [],
      upvotes: lesson.upvotes ?? 0,
      resolvedItems: resolvedItems.sort((a, b) => a.order - b.order),
    };
  },
});

export const listSysLessonsPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    sortBy: v.optional(v.union(v.literal("newest"), v.literal("upvotes"))),
    tag: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("sysLessons"),
        _creationTime: v.number(),
        title: v.string(),
        description: v.optional(v.string()),
        tags: v.array(v.string()),
        upvotes: v.number(),
        itemCount: v.number(),
        hasUpvoted: v.boolean(),
      })
    ),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    const search = (args.search ?? "").trim().toLowerCase();
    const hasClientSideFilters = !!args.tag || search.length > 0;

    if (hasClientSideFilters) {
      const allLessons = await ctx.db.query("sysLessons").collect();
      const normalized = allLessons.map((l) => ({
        ...l,
        tags: l.tags ?? [],
        upvotes: l.upvotes ?? 0,
        items: l.items ?? [],
      }));

      const searched =
        search.length > 0
          ? normalized.filter((l) => {
              const title = l.title.toLowerCase();
              const description = (l.description ?? "").toLowerCase();
              return title.includes(search) || description.includes(search);
            })
          : normalized;

      const filtered = args.tag
        ? searched.filter((l) => l.tags.includes(args.tag!))
        : searched;

      const sorted = [...filtered];
      if (args.sortBy === "upvotes") {
        sorted.sort((a, b) => (b.upvotes ?? 0) - (a.upvotes ?? 0));
      } else {
        sorted.sort((a, b) => b._creationTime - a._creationTime);
      }

      const pageSize = args.paginationOpts.numItems;
      const cursor = args.paginationOpts.cursor;
      let startIdx = 0;
      if (cursor) {
        const parsed = Number.parseInt(cursor, 10);
        if (Number.isFinite(parsed) && parsed >= 0) startIdx = parsed;
      }
      const page = sorted.slice(startIdx, startIdx + pageSize);
      const isDone = startIdx + pageSize >= sorted.length;
      const continueCursor = isDone ? "" : String(startIdx + page.length);

      const enrichedPage = await Promise.all(
        page.map(async (lesson) => {
          let hasUpvoted = false;
          if (userId) {
            const vote = await ctx.db
              .query("sysLessonVotes")
              .withIndex("by_lessonId_and_userId", (q) =>
                q.eq("lessonId", lesson._id).eq("userId", userId)
              )
              .first();
            hasUpvoted = vote !== null;
          }

          return {
            _id: lesson._id,
            _creationTime: lesson._creationTime,
            title: lesson.title,
            description: lesson.description,
            tags: lesson.tags ?? [],
            upvotes: lesson.upvotes ?? 0,
            itemCount: (lesson.items ?? []).length,
            hasUpvoted,
          };
        })
      );

      return { page: enrichedPage, isDone, continueCursor };
    }

    const sortBy = args.sortBy ?? "newest";
    const base =
      sortBy === "upvotes"
        ? ctx.db.query("sysLessons").withIndex("by_upvotes", (q) => q)
        : ctx.db.query("sysLessons");

    const results = await base.order("desc").paginate(args.paginationOpts);

    const enrichedPage = await Promise.all(
      results.page.map(async (lesson) => {
        let hasUpvoted = false;
        if (userId) {
          const vote = await ctx.db
            .query("sysLessonVotes")
            .withIndex("by_lessonId_and_userId", (q) =>
              q.eq("lessonId", lesson._id).eq("userId", userId)
            )
            .first();
          hasUpvoted = vote !== null;
        }

        return {
          _id: lesson._id,
          _creationTime: lesson._creationTime,
          title: lesson.title,
          description: lesson.description,
          tags: lesson.tags ?? [],
          upvotes: lesson.upvotes ?? 0,
          itemCount: (lesson.items ?? []).length,
          hasUpvoted,
        };
      })
    );

    return {
      continueCursor: results.continueCursor ?? "",
      page: enrichedPage,
      isDone: results.isDone,
    };
  },
});
