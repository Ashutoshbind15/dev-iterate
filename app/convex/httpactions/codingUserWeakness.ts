import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

export const saveCodingUserWeakness = httpAction(async (ctx, req) => {
  // TODO: add your m2m token auth like you mentioned in getFeed
  const rawBody = await req.text();
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch (err) {
    console.error("Invalid JSON body for /coding-user-weakness", {
      error: String(err),
      bodyPreview: rawBody.slice(0, 500),
    });
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const parsed = (body ?? {}) as Record<string, unknown>;
  const userId = parsed.userId;
  const remark = parsed.remark;
  const submissionIdsRaw = parsed.submissionIds;

  // Some callers may send submissionIds as a stringified JSON array.
  let submissionIds: Array<unknown>;
  if (Array.isArray(submissionIdsRaw)) {
    submissionIds = submissionIdsRaw;
  } else if (typeof submissionIdsRaw === "string") {
    try {
      const decoded = JSON.parse(submissionIdsRaw) as unknown;
      if (!Array.isArray(decoded)) {
        return new Response(
          JSON.stringify({ error: "submissionIds must be an array" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      submissionIds = decoded;
    } catch {
      return new Response(
        JSON.stringify({ error: "submissionIds must be a JSON array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  } else {
    submissionIds = [];
  }

  if (
    typeof userId !== "string" ||
    typeof remark !== "string" ||
    submissionIds.length === 0
  ) {
    return new Response(
      JSON.stringify({
        error: "Missing required fields: userId, remark, submissionIds",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Validate that submissionIds are strings (IDs are strings at runtime)
  const validSubmissionIds = submissionIds.filter(
    (id): id is Id<"codingSubmissions"> => typeof id === "string"
  );

  if (validSubmissionIds.length !== submissionIds.length) {
    return new Response(
      JSON.stringify({ error: "Invalid submissionIds format" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  await ctx.runMutation(internal.mutations.codingUserWeakness.saveRemark, {
    userId: userId as Id<"users">,
    remark,
    submissionIds: validSubmissionIds,
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
