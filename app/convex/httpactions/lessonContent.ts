import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

export const saveLessonContent = httpAction(async (ctx, req) => {
  // TODO: add m2m token auth like other endpoints
  const body = await req.json();
  const { topic, content, contentId, errorMessage } = body ?? {};

  if (!topic) {
    return new Response(
      JSON.stringify({ error: "Missing required field: topic" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (!contentId) {
    return new Response(
      JSON.stringify({ error: "Missing required field: contentId" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // If there's an error message, mark generation as failed
  if (errorMessage && typeof errorMessage === "string") {
    await ctx.runMutation(internal.mutations.contents.markGeneratedContentFailed, {
      contentId: contentId as Id<"contents">,
      errorMessage,
    });

    return new Response(
      JSON.stringify({ ok: true, message: "Content marked as failed" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (!content) {
    return new Response(
      JSON.stringify({ error: "Missing required field: content" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Extract title from the TipTap document (first heading or use topic as fallback)
    let title = topic;
    try {
      const contentObj =
        typeof content === "string" ? JSON.parse(content) : content;
      if (contentObj?.content && Array.isArray(contentObj.content)) {
        type TipTapNode = {
          type: string;
          content?: TipTapNode[];
          text?: string;
        };
        const firstHeading = contentObj.content.find(
          (node: TipTapNode) => node.type === "heading" && node.content
        );
        if (firstHeading?.content?.[0]?.text) {
          title = firstHeading.content[0].text;
        }
      }
    } catch {
      // If parsing fails, just use topic as title
    }

    await ctx.runMutation(internal.mutations.contents.completeGeneratedContent, {
      contentId: contentId as Id<"contents">,
      title,
      content: typeof content === "string" ? content : JSON.stringify(content),
    });

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Lesson content saved successfully",
        contentId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to save lesson content";

    // Best-effort: mark failed
    try {
      await ctx.runMutation(internal.mutations.contents.markGeneratedContentFailed, {
        contentId: contentId as Id<"contents">,
        errorMessage,
      });
    } catch (markError) {
      console.error("Failed to mark content generation as failed:", markError);
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
