import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";

export const createSysLesson = httpAction(async (ctx, req) => {
  // TODO: add m2m token auth like other endpoints
  const body = await req.json();
  const { title, description, tags } = body ?? {};

  if (!title || typeof title !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing required field: title" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const lessonId = await ctx.runMutation(
      internal.mutations.sysLessons.createSysLesson,
      {
        title,
        description: typeof description === "string" ? description : undefined,
        tags: Array.isArray(tags) ? tags : undefined,
      }
    );

    return new Response(JSON.stringify({ ok: true, lessonId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create system lesson";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
