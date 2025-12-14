import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

export const createPendingSysLessonContent = httpAction(async (ctx, req) => {
  // TODO: add m2m token auth like other endpoints
  const body = await req.json();
  const { topic, lessonId, order } = body ?? {};

  if (!topic || typeof topic !== "string") {
    return new Response(JSON.stringify({ error: "Missing required field: topic" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!lessonId || typeof lessonId !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing required field: lessonId" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (typeof order !== "number") {
    return new Response(JSON.stringify({ error: "Missing required field: order" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const contentId = await ctx.runMutation(
      internal.mutations.sysContents.createPendingSysContent,
      { topic }
    );

    await ctx.runMutation(internal.mutations.sysLessons.addItemToSysLesson, {
      lessonId: lessonId as Id<"sysLessons">,
      item: { type: "content", itemId: contentId, order },
    });

    return new Response(JSON.stringify({ ok: true, contentId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to create pending system content";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

export const saveSysLessonContent = httpAction(async (ctx, req) => {
  // TODO: add m2m token auth like other endpoints
  const body = await req.json();
  const { topic, content, contentId, errorMessage } = body ?? {};

  if (!topic) {
    return new Response(JSON.stringify({ error: "Missing required field: topic" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!contentId) {
    return new Response(
      JSON.stringify({ error: "Missing required field: contentId" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (errorMessage && typeof errorMessage === "string") {
    await ctx.runMutation(internal.mutations.sysContents.markGeneratedSysContentFailed, {
      contentId: contentId as Id<"sysContents">,
      errorMessage,
    });

    return new Response(JSON.stringify({ ok: true, message: "Content marked as failed" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!content) {
    return new Response(
      JSON.stringify({ error: "Missing required field: content" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Extract title from TipTap doc (first heading) or fallback to topic
    let title = topic;
    try {
      const contentObj = typeof content === "string" ? JSON.parse(content) : content;
      if (contentObj?.content && Array.isArray(contentObj.content)) {
        type TipTapNode = { type: string; content?: TipTapNode[]; text?: string };
        const firstHeading = contentObj.content.find(
          (node: TipTapNode) => node.type === "heading" && node.content
        );
        if (firstHeading?.content?.[0]?.text) title = firstHeading.content[0].text;
      }
    } catch {
      // ignore parse errors; use topic
    }

    await ctx.runMutation(internal.mutations.sysContents.completeGeneratedSysContent, {
      contentId: contentId as Id<"sysContents">,
      title,
      content: typeof content === "string" ? content : JSON.stringify(content),
    });

    return new Response(
      JSON.stringify({ ok: true, message: "System lesson content saved", contentId }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to save system lesson content";
    try {
      await ctx.runMutation(internal.mutations.sysContents.markGeneratedSysContentFailed, {
        contentId: contentId as Id<"sysContents">,
        errorMessage: msg,
      });
    } catch (markError) {
      console.error("Failed to mark sys content generation as failed:", markError);
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});


