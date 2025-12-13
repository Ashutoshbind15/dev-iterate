import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";

export const getFeed = httpAction(async (ctx, req) => {
  // Todo: [high] add some m2m token auth for calling from kestra workflows
  const contentType = req.headers.get("content-type") || "";

  let summary: unknown;
  let feedUrl: unknown;
  let feedTitle: unknown;

  if (contentType.includes("application/json")) {
    const body = await req.json();
    summary = body?.summary;
    feedUrl = body?.feedUrl;
    feedTitle = body?.feedTitle;
  } else {
    const formData = await req.formData();
    summary = formData.get("summary");
    feedUrl = formData.get("feedUrl");
    feedTitle = formData.get("feedTitle");
  }

  if (!summary || typeof summary !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing or invalid summary field" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (!feedUrl || typeof feedUrl !== "string" || feedUrl.trim().length === 0) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid feedUrl field" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const normalizedFeedTitle =
    typeof feedTitle === "string" && feedTitle.trim().length > 0
      ? feedTitle.trim()
      : undefined;

  const summaryId: string = await ctx.runMutation(
    internal.mutations.rssSummaries.insertRssSummary,
    {
      feedUrl: feedUrl.trim(),
      feedTitle: normalizedFeedTitle,
      summaryText: summary,
    }
  );

  return new Response(
    JSON.stringify({
      message: "Summary saved successfully",
      id: summaryId,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
});
