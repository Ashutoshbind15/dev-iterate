import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

export const createPendingSysLessonDiagram = httpAction(async (ctx, req) => {
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
    const diagramId = await ctx.runMutation(
      internal.mutations.sysDiagrams.createPendingSysDiagram,
      { topic }
    );

    await ctx.runMutation(internal.mutations.sysLessons.addItemToSysLesson, {
      lessonId: lessonId as Id<"sysLessons">,
      item: { type: "diagram", itemId: diagramId, order },
    });

    return new Response(JSON.stringify({ ok: true, diagramId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to create pending system diagram";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

export const saveSysLessonDiagram = httpAction(async (ctx, req) => {
  // TODO: add m2m token auth like other endpoints
  const body = await req.json();
  const { diagramId, title, mermaid, errorMessage } = body ?? {};

  if (!diagramId) {
    return new Response(
      JSON.stringify({ error: "Missing required field: diagramId" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (errorMessage && typeof errorMessage === "string") {
    await ctx.runMutation(internal.mutations.sysDiagrams.markGeneratedSysDiagramFailed, {
      diagramId: diagramId as Id<"sysDiagrams">,
      errorMessage,
    });
    return new Response(JSON.stringify({ ok: true, message: "Diagram marked as failed" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (typeof title !== "string" || typeof mermaid !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing required fields: title, mermaid" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    await ctx.runMutation(internal.mutations.sysDiagrams.completeGeneratedSysDiagram, {
      diagramId: diagramId as Id<"sysDiagrams">,
      title,
      mermaid,
    });

    return new Response(
      JSON.stringify({ ok: true, message: "System lesson diagram saved", diagramId }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to save system lesson diagram";
    try {
      await ctx.runMutation(internal.mutations.sysDiagrams.markGeneratedSysDiagramFailed, {
        diagramId: diagramId as Id<"sysDiagrams">,
        errorMessage: msg,
      });
    } catch (markError) {
      console.error("Failed to mark sys diagram generation as failed:", markError);
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});


