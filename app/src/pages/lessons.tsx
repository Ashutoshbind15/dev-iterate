import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  BookOpen,
  FileText,
  PenTool,
  ChevronRight,
  Layers,
  Loader2,
} from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { all, createLowlight } from "lowlight";
import "@catppuccin/highlightjs/css/catppuccin-mocha.css";
import { Excalidraw } from "@excalidraw/excalidraw";
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
        class: "prose prose-base max-w-none",
      },
    },
  });

  return <EditorContent editor={editor} />;
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

  return (
    <div className="h-[500px] rounded-lg overflow-hidden border border-slate-200">
      <Excalidraw
        initialData={{
          elements: parsedElements,
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
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar - Lessons List (View Only) */}
        <div className="w-72 border-r border-slate-200 bg-white flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-600" />
                <h2 className="font-semibold text-slate-800">Lessons</h2>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {isLoadingLessons && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            )}

            {!isLoadingLessons && lessons.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No lessons yet</p>
              </div>
            )}

            {!isLoadingLessons && lessons.length > 0 && (
              <div className="space-y-1">
                {lessons.map((lesson) => (
                  <button
                    key={lesson._id}
                    onClick={() => setSelectedLessonId(lesson._id)}
                    className={`w-full text-left p-3 rounded-lg transition-all group
                      ${
                        selectedLessonId === lesson._id
                          ? "bg-indigo-50 border-indigo-200 border"
                          : "hover:bg-slate-50 border border-transparent"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen
                          className={`h-4 w-4 shrink-0 ${
                            selectedLessonId === lesson._id
                              ? "text-indigo-600"
                              : "text-slate-400"
                          }`}
                        />
                        <span
                          className={`font-medium truncate ${
                            selectedLessonId === lesson._id
                              ? "text-indigo-700"
                              : "text-slate-700"
                          }`}
                        >
                          {lesson.title}
                        </span>
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 transition-transform ${
                          selectedLessonId === lesson._id
                            ? "text-indigo-600 rotate-90"
                            : "text-slate-300 group-hover:text-slate-400"
                        }`}
                      />
                    </div>
                    {lesson.description && (
                      <p className="text-xs text-slate-500 mt-1 ml-6 truncate">
                        {lesson.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 ml-6">
                      <span className="text-xs text-slate-400">
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
        <div className="flex-1 overflow-y-auto">
          {isLoadingSelectedLesson ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : !selectedLesson ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-slate-500">
                <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium text-slate-400">
                  Select a lesson to view
                </p>
                <p className="text-sm">Choose from the sidebar</p>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto py-8 px-6">
              {/* Lesson Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">
                  {selectedLesson.title}
                </h1>
                {selectedLesson.description && (
                  <p className="text-lg text-slate-500">
                    {selectedLesson.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-4 text-sm text-slate-400">
                  <span>{resolvedItems.length} sections</span>
                  <span>•</span>
                  <span>
                    {resolvedItems.filter((i) => i.type === "content").length}{" "}
                    content blocks
                  </span>
                  <span>•</span>
                  <span>
                    {resolvedItems.filter((i) => i.type === "diagram").length}{" "}
                    diagrams
                  </span>
                </div>
              </div>

              {/* Lesson Content */}
              <div className="space-y-8">
                {resolvedItems.map((item, index) => {
                  if (!item.data) return null;

                  const isContent = item.type === "content";

                  return (
                    <section
                      key={`${item.type}-${item.data._id}`}
                      className="scroll-mt-6"
                    >
                      {/* Section Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-sm font-medium">
                          {index + 1}
                        </span>
                        <div
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
                            ${
                              isContent
                                ? "bg-blue-50 text-blue-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                        >
                          {isContent ? (
                            <FileText className="h-3.5 w-3.5" />
                          ) : (
                            <PenTool className="h-3.5 w-3.5" />
                          )}
                          {item.data.title}
                        </div>
                      </div>

                      {/* Section Content */}
                      <div
                        className={`rounded-xl border bg-white shadow-sm overflow-hidden
                          ${
                            isContent ? "border-blue-100" : "border-emerald-100"
                          }`}
                      >
                        <div className="p-6">
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
                <div className="text-center py-16 text-slate-500">
                  <Layers className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium text-slate-400">
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
