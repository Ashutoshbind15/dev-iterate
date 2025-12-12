import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, Loader2, ThumbsUp } from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { all, createLowlight } from "lowlight";
import "@catppuccin/highlightjs/css/catppuccin-mocha.css";
import {
  Excalidraw,
  convertToExcalidrawElements,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

const lowlight = createLowlight(all);

function ContentViewer({ content }: { content: string }) {
  const editor = useEditor({
    extensions: [StarterKit, CodeBlockLowlight.configure({ lowlight })],
    content: JSON.parse(content),
    editable: false,
    editorProps: {
      attributes: {
        class: "prose prose-zinc max-w-none",
      },
    },
  });

  return <EditorContent editor={editor} />;
}

function isSkeletonFormat(elements: unknown[]): boolean {
  return elements.some(
    (el) =>
      typeof el === "object" &&
      el !== null &&
      "label" in el &&
      typeof (el as { label?: unknown }).label === "object"
  );
}

function DiagramViewer({
  elements,
  appState,
}: {
  elements: string;
  appState: string;
}) {
  const parsedElements = JSON.parse(elements);
  const parsedAppState = JSON.parse(appState);

  const finalElements = isSkeletonFormat(parsedElements)
    ? convertToExcalidrawElements(parsedElements)
    : parsedElements;

  return (
    <div className="h-[520px] rounded-sm overflow-hidden border border-zinc-200 grayscale bg-white">
      <Excalidraw
        initialData={{
          elements: finalElements,
          appState: { ...parsedAppState, viewModeEnabled: true },
        }}
        viewModeEnabled={true}
      />
    </div>
  );
}

export default function LessonViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useQuery(api.queries.user.getCurrentUser);
  const voteLesson = useMutation(api.mutations.lessons.voteLesson);

  const lessonId = id as Id<"lessons"> | undefined;
  const lesson = useQuery(
    api.queries.lessons.getLessonPublicWithItems,
    lessonId ? { id: lessonId } : "skip"
  );

  const handleUpvote = async () => {
    if (!lessonId) return;
    try {
      await voteLesson({ lessonId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upvote";
      toast.error(message);
      console.error(error);
    }
  };

  if (lesson === undefined) {
    return (
      <div className="min-h-screen bg-white p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
      </div>
    );
  }

  if (lesson === null) {
    return (
      <div className="min-h-screen bg-white p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 mb-4">
            Lesson not found
          </h1>
          <Link to="/lessons">
            <Button variant="outline">Back to Lessons</Button>
          </Link>
        </div>
      </div>
    );
  }

  const resolvedItems = lesson.resolvedItems ?? [];

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      <div className="w-full max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <Button
            variant="outline"
            onClick={() => navigate("/lessons")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lessons
          </Button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleUpvote}
              disabled={!currentUser}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded border text-sm transition-colors ${
                !currentUser
                  ? "text-zinc-300 border-zinc-200 cursor-not-allowed"
                  : "text-zinc-700 border-zinc-200 hover:text-green-700 hover:border-green-200 hover:bg-green-50"
              }`}
            >
              <ThumbsUp className="h-4 w-4" />
              Upvote
            </button>
            <span className="text-sm font-medium text-zinc-700 min-w-[2rem] text-center">
              {lesson.upvotes}
            </span>
          </div>
        </div>

        {/* Lesson Header */}
        <div className="mb-10 border-b border-zinc-200 pb-8">
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 mb-4">
            {lesson.title}
          </h1>
          {lesson.description && (
            <p className="text-xl text-zinc-500 font-light leading-relaxed">
              {lesson.description}
            </p>
          )}

          {lesson.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {lesson.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-6 mt-8 text-xs font-bold uppercase tracking-widest text-zinc-400">
            <span>{resolvedItems.length} sections</span>
            <span>
              {resolvedItems.filter((i) => i.type === "content").length} content
            </span>
            <span>
              {resolvedItems.filter((i) => i.type === "diagram").length} diagrams
            </span>
          </div>
        </div>

        {/* Lesson Content */}
        <div className="space-y-12">
          {resolvedItems.map((item, index) => {
            if (!item.data) return null;

            const isContent = item.type === "content";

            return (
              <section
                key={`${item.type}-${(item.data as { _id: string })._id}`}
                className="scroll-mt-6"
              >
                <div className="flex items-center gap-4 mb-6">
                  <span className="flex items-center justify-center w-8 h-8 rounded-sm bg-zinc-900 text-white text-sm font-bold">
                    {index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 border border-zinc-200 px-2 py-1 rounded-sm">
                      {isContent ? "Content" : "Diagram"}
                    </span>
                    <h3 className="text-lg font-bold text-zinc-900">
                      {(item.data as { title: string }).title}
                    </h3>
                  </div>
                </div>

                <div
                  className={`rounded-sm border border-zinc-200 bg-white shadow-sm overflow-hidden ${
                    !isContent ? "p-0" : ""
                  }`}
                >
                  <div className={isContent ? "p-8" : "p-0"}>
                    {isContent ? (
                      <ContentViewer
                        content={(item.data as { content: string }).content}
                      />
                    ) : (
                      <DiagramViewer
                        elements={(item.data as { elements: string }).elements}
                        appState={(item.data as { appState: string }).appState}
                      />
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {resolvedItems.length === 0 && (
          <div className="text-center py-24 text-zinc-400 border border-dashed border-zinc-200 rounded-sm">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium text-zinc-500">
              This lesson has no content yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


