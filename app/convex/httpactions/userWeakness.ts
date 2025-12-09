import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

export const saveUserWeakness = httpAction(async (ctx, req) => {
  // TODO: add your m2m token auth like you mentioned in getFeed
  const body = await req.json();
  const { userId, remark, questionIds } = body ?? {};

  if (!userId || !remark || !questionIds || !Array.isArray(questionIds)) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: userId, remark, questionIds" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Validate that questionIds are strings (IDs are strings at runtime)
  const validQuestionIds = questionIds.filter(
    (id): id is Id<"questions"> => typeof id === "string"
  );

  if (validQuestionIds.length !== questionIds.length) {
    return new Response(
      JSON.stringify({ error: "Invalid questionIds format" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  await ctx.runMutation(internal.mutations.userWeakness.saveRemark, {
    userId: userId as Id<"users">,
    remark,
    questionIds: validQuestionIds,
  });

  return new Response(
    JSON.stringify({ ok: true }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
});

