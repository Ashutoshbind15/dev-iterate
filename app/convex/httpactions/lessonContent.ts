import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export const saveLessonContent = httpAction(async (ctx, req) => {
  // TODO: add m2m token auth like other endpoints
  const body = await req.json();
  const { topic, content } = body ?? {};

  if (!topic) {
    return new Response(
      JSON.stringify({ error: "Missing required field: topic" }),
      {
        status: 400,
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

    const contentId = await ctx.runMutation(
      api.mutations.contents.createContent,
      {
        title,
        content:
          typeof content === "string" ? content : JSON.stringify(content),
      }
    );

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

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
