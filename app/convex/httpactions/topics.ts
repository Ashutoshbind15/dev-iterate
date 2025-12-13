import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";

export const saveTopics = httpAction(async (ctx, req) => {
  // TODO: add m2m token auth like other endpoints
  const body = await req.json();

  const topics = body?.topics;
  if (!topics || !Array.isArray(topics)) {
    return new Response(JSON.stringify({ error: "Missing topics array" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log("topics", topics);

  // Upsert topics and get their IDs back.
  const inserted = await ctx.runMutation(
    internal.mutations.topics.upsertSystemTopics,
    {
      topics: topics,
      generatedBy: "system",
    }
  );

  // Trigger Kestra fanout (topicsiterator)
  try {
    await ctx.runAction(internal.actionsdir.topics.triggerTopicsIterator, {
      topics: inserted.map((t: { topic: string; topicId: string }) => ({
        topic: t.topic,
        topicId: t.topicId,
      })),
    });
  } catch (e) {
    // Don't fail ingestion if fanout fails; caller can retry webhook trigger later.
    console.error("Failed to trigger topicsiterator:", e);
  }

  return new Response(JSON.stringify({ ok: true, topics: inserted }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
