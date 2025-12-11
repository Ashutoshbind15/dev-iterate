import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { BookOpen, ChevronRight, Layers, Loader2 } from "lucide-react";
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

// Content viewer component (read-only)
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

// Check if elements are in skeleton format (have label properties instead of bound text elements)
function isSkeletonFormat(elements: unknown[]): boolean {
  return elements.some(
    (el) =>
      typeof el === "object" &&
      el !== null &&
      "label" in el &&
      typeof (el as { label?: unknown }).label === "object"
  );
}

// Diagram viewer component (read-only)
function DiagramViewer({
  elements,
  appState,
}: {
  elements: string;
  appState: string;
}) {
  const parsedElements = JSON.parse(elements);
  const parsedAppState = JSON.parse(appState);

  // Convert skeleton elements (with label properties) to native Excalidraw format if needed
  // This handles backwards compatibility with diagrams saved before the fix
  const finalElements = isSkeletonFormat(parsedElements)
    ? convertToExcalidrawElements(parsedElements)
    : parsedElements;

  return (
    <div className="h-[500px] rounded-sm overflow-hidden border border-zinc-200 grayscale">
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

export default function LessonsPage() {
  const [selectedLessonId, setSelectedLessonId] =
    useState<Id<"lessons"> | null>(null);
  const lessons = useQuery(api.queries.lessons.getLessons);
  const selectedLesson = useQuery(
    api.queries.lessons.getLessonWithItems,
    selectedLessonId ? { id: selectedLessonId } : "skip"
  );

  const isLoadingLessons = lessons === undefined;
  const isLoadingSelectedLesson =
    selectedLessonId && selectedLesson === undefined;
  const resolvedItems = selectedLesson?.resolvedItems ?? [];

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar - Lessons List (View Only) */}
        <div className="w-80 border-r border-zinc-200 bg-white flex flex-col">
          <div className="p-6 border-b border-zinc-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-900 text-white rounded-sm">
                  <Layers className="h-5 w-5" />
                </div>
                <h2 className="font-bold tracking-tight text-zinc-900">
                  Lessons
                </h2>
              </div>
            </div>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider ml-12">
              Library
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {isLoadingLessons && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-900" />
              </div>
            )}

            {!isLoadingLessons && lessons.length === 0 && (
              <div className="text-center py-12 text-zinc-500">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No lessons yet</p>
              </div>
            )}

            {!isLoadingLessons && lessons.length > 0 && (
              <div className="space-y-1">
                {lessons.map((lesson) => (
                  <button
                    key={lesson._id}
                    onClick={() => setSelectedLessonId(lesson._id)}
                    className={`w-full text-left p-4 rounded-sm transition-all group border-l-2
                      ${
                        selectedLessonId === lesson._id
                          ? "bg-zinc-50 border-zinc-900"
                          : "hover:bg-zinc-50 border-transparent hover:border-zinc-200"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`font-semibold truncate ${
                            selectedLessonId === lesson._id
                              ? "text-zinc-900"
                              : "text-zinc-600 group-hover:text-zinc-900"
                          }`}
                        >
                          {lesson.title}
                        </span>
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 transition-transform ${
                          selectedLessonId === lesson._id
                            ? "text-zinc-900"
                            : "text-zinc-300 group-hover:text-zinc-500"
                        }`}
                      />
                    </div>
                    {lesson.description && (
                      <p className="text-xs text-zinc-500 mt-1 truncate pl-1">
                        {lesson.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3 pl-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        {lesson.items.length} items
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area (View Only) */}
        <div className="flex-1 overflow-y-auto bg-zinc-50/30">
          {isLoadingSelectedLesson ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
            </div>
          ) : !selectedLesson ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-zinc-400">
                <BookOpen className="h-20 w-20 mx-auto mb-6 opacity-10" />
                <p className="text-xl font-bold text-zinc-900 mb-2">
                  Select a lesson
                </p>
                <p className="text-sm text-zinc-500">
                  Choose from the sidebar to view content
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto py-12 px-8">
              {/* Lesson Header */}
              <div className="mb-12 border-b border-zinc-200 pb-8">
                <h1 className="text-4xl font-black tracking-tight text-zinc-900 mb-4">
                  {selectedLesson.title}
                </h1>
                {selectedLesson.description && (
                  <p className="text-xl text-zinc-500 font-light leading-relaxed">
                    {selectedLesson.description}
                  </p>
                )}
                <div className="flex items-center gap-6 mt-8 text-xs font-bold uppercase tracking-widest text-zinc-400">
                  <span>{resolvedItems.length} sections</span>
                  <span>
                    {resolvedItems.filter((i) => i.type === "content").length}{" "}
                    content blocks
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
                      key={`${item.type}-${item.data._id}`}
                      className="scroll-mt-6"
                    >
                      {/* Section Header */}
                      <div className="flex items-center gap-4 mb-6">
                        <span className="flex items-center justify-center w-8 h-8 rounded-sm bg-zinc-900 text-white text-sm font-bold">
                          {index + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 border border-zinc-200 px-2 py-1 rounded-sm">
                            {isContent ? "Content" : "Diagram"}
                          </span>
                          <h3 className="text-lg font-bold text-zinc-900">
                            {item.data.title}
                          </h3>
                        </div>
                      </div>

                      {/* Section Content */}
                      <div
                        className={`rounded-sm border border-zinc-200 bg-white shadow-sm overflow-hidden
                          ${!isContent ? "p-0" : ""}`}
                      >
                        <div className={isContent ? "p-8" : "p-0"}>
                          {isContent ? (
                            <ContentViewer
                              content={
                                (item.data as { content: string }).content
                              }
                            />
                          ) : (
                            <DiagramViewer
                              elements={
                                (item.data as { elements: string }).elements
                              }
                              appState={
                                (item.data as { appState: string }).appState
                              }
                            />
                          )}
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>

              {/* Empty State */}
              {resolvedItems.length === 0 && (
                <div className="text-center py-24 text-zinc-400 border border-dashed border-zinc-200 rounded-sm">
                  <Layers className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium text-zinc-500">
                    This lesson has no content yet
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
