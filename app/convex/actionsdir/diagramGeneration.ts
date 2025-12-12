import { action } from "../_generated/server";
import { v } from "convex/values";

const triggerSyncFlow = async (payload: { description: string }) => {
  const encodedCredentials = process.env.KESTRA_BASIC_AUTH_ENCODED;
  if (!encodedCredentials) {
    throw new Error("KESTRA_BASIC_AUTH_ENCODED is not set");
  }

  const WORKFLOWS_BASE_URL = "http://localhost:8080/api/v1/executions";
  const WORKFLOWS_NAMESPACE = "main";
  const WORKFLOW_ID = "diagram_generator";

  const url = `${WORKFLOWS_BASE_URL}/${WORKFLOWS_NAMESPACE}/${WORKFLOW_ID}?wait=true`;

  // Kestra's execution endpoint requires multipart/form-data
  const formData = new FormData();
  formData.append("description", payload.description);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${encodedCredentials}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to trigger diagram generation: ${response.status} - ${errorText}`
    );
  }

  return response.json();
};

export const triggerDiagramGeneration = action({
  args: {
    description: v.string(),
  },
  handler: async (_ctx, args) => {
    const result = await triggerSyncFlow({
      description: args.description,
    });

    const title =
      result?.outputs?.title?.value ?? result?.outputs?.title ?? null;
    const mermaid =
      result?.outputs?.mermaid?.value ?? result?.outputs?.mermaid ?? null;

    if (typeof title !== "string" || typeof mermaid !== "string") {
      throw new Error("Kestra response missing title or mermaid outputs");
    }

    return { title, mermaid };
  },
});
