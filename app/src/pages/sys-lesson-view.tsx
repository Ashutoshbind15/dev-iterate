import { useEffect, useMemo, useRef, useState } from "react";
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
import { parseMermaidToExcalidraw } from "@excalidraw/mermaid-to-excalidraw";

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

function sanitizeMermaidForParsing(raw: string): string {
  // The mermaid-to-excalidraw parser is stricter than Mermaid itself:
  // emojis/spaces in IDs often cause lexical errors. We sanitize IDs while preserving labels.
  const lines = raw.split("\n");
  const idMap = new Map<string, string>();

  const toSafeId = (id: string): string => {
    const cleaned = id
      .replace(/[^\w]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
    const safe = cleaned.length > 0 ? cleaned : "id";
    return /^[A-Za-z_]/.test(safe) ? safe : `id_${safe}`;
  };

  const maybeCaptureId = (id: string) => {
    if (!id) return;
    if (!idMap.has(id)) idMap.set(id, toSafeId(id));
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("%%")) continue;

    // subgraph <id> ...
    const subgraphMatch = trimmed.match(/^subgraph\s+([^\s\[]+)\s*(.*)$/);
    if (subgraphMatch) {
      maybeCaptureId(subgraphMatch[1]);
      continue;
    }

    // Node definition like: ID[Label] / ID("Label") / ID{{Label}}
    const nodeMatch = trimmed.match(
      /^([^\s\-\>]+)\s*(\[\[|\[|\(\(|\(|\{\{|\{)/
    );
    if (nodeMatch) {
      maybeCaptureId(nodeMatch[1]);
    }
  }

  const entries = Array.from(idMap.entries()).sort(
    (a, b) => b[0].length - a[0].length
  );
  let out = raw;
  for (const [from, to] of entries) {
    if (from === to) continue;
    // replace all occurrences (IDs are used verbatim in edge lines too)
    out = out.split(from).join(to);
  }
  return out;
}

function SysDiagramViewer({
  diagram,
}: {
  diagram: {
    _id: string;
    mermaid: string;
    elements?: string;
    appState?: string;
  };
}) {
  const [elements, setElements] = useState<unknown[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const setSysDiagramExcalidraw = useMutation(
    api.mutations.sysDiagrams.setSysDiagramExcalidraw
  );
  const savingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setElements(null);
    setError(null);

    const run = async () => {
      try {
        // If we already cached Excalidraw JSON, render directly (no Mermaid parsing).
        if (diagram.elements && diagram.appState) {
          const parsedElements = JSON.parse(diagram.elements);
          const finalElements = isSkeletonFormat(parsedElements)
            ? convertToExcalidrawElements(parsedElements)
            : parsedElements;
          if (cancelled) return;
          setElements(finalElements);
          return;
        }

        const safeMermaid = sanitizeMermaidForParsing(diagram.mermaid);
        const parsed = await parseMermaidToExcalidraw(safeMermaid, {
          themeVariables: { fontSize: "20px" },
        });
        const excalidrawElements = convertToExcalidrawElements(parsed.elements);
        if (cancelled) return;
        setElements(excalidrawElements);

        // Cache on first successful render.
        if (!savingRef.current) {
          savingRef.current = true;
          try {
            const appState = JSON.stringify({
              viewBackgroundColor: "#ffffff",
              zoom: { value: 1 },
              scrollX: 0,
              scrollY: 0,
            });
            await setSysDiagramExcalidraw({
              diagramId: diagram._id as Id<"sysDiagrams">,
              elements: JSON.stringify(excalidrawElements),
              appState,
            });
          } catch {
            // Best-effort cache; ignore failures
          } finally {
            savingRef.current = false;
          }
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to render diagram";
        setError(msg);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    diagram._id,
    diagram.mermaid,
    diagram.elements,
    diagram.appState,
    setSysDiagramExcalidraw,
  ]);

  if (error) {
    return (
      <div className="rounded-sm border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!elements) {
    return (
      <div className="h-[520px] rounded-sm overflow-hidden border border-zinc-200 bg-white flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-900" />
      </div>
    );
  }

  return (
    <div className="h-[520px] rounded-sm overflow-hidden border border-zinc-200 grayscale bg-white">
      <Excalidraw
        initialData={{
          elements,
          appState: { viewModeEnabled: true, viewBackgroundColor: "#ffffff" },
        }}
        viewModeEnabled={true}
      />
    </div>
  );
}

export default function SysLessonViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useQuery(api.queries.user.getCurrentUser);
  const voteLesson = useMutation(api.mutations.sysLessons.voteSysLesson);

  const lessonId = id as Id<"sysLessons"> | undefined;
  const lesson = useQuery(
    api.queries.sysLessons.getSysLessonPublicWithItems,
    lessonId ? { id: lessonId } : "skip"
  );

  const handleUpvote = async () => {
    if (!lessonId) return;
    try {
      await voteLesson({ lessonId });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upvote";
      toast.error(message);
      console.error(error);
    }
  };

  const resolvedItems = useMemo(() => lesson?.resolvedItems ?? [], [lesson]);

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
          <Link to="/sys-lessons">
            <Button variant="outline">Back to System Lessons</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      <div className="w-full max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <Button
            variant="outline"
            onClick={() => navigate("/sys-lessons")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to System Lessons
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
              {resolvedItems.filter((i) => i.type === "diagram").length}{" "}
              diagrams
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
                      <SysDiagramViewer
                        diagram={
                          item.data as {
                            _id: string;
                            mermaid: string;
                            elements?: string;
                            appState?: string;
                          }
                        }
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
