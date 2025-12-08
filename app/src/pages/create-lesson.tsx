import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate, Link, useParams } from "react-router";
import {
  Save,
  BookOpen,
  FileText,
  PenTool,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { all, createLowlight } from "lowlight";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

const lowlight = createLowlight(all);

type LessonItem = {
  type: "content" | "diagram";
  itemId: string;
  order: number;
};

// Preview component for content
function ContentPreview({ content }: { content: string }) {
  const editor = useEditor({
    extensions: [StarterKit, CodeBlockLowlight.configure({ lowlight })],
    content: JSON.parse(content),
    editable: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none p-4",
      },
    },
  });

  return <EditorContent editor={editor} />;
}

// Preview component for diagram
function DiagramPreview({
  elements,
  appState,
}: {
  elements: string;
  appState: string;
}) {
  const parsedElements = JSON.parse(elements);
  const parsedAppState = JSON.parse(appState);

  return (
    <div className="h-[300px] pointer-events-none">
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

export default function CreateLessonPage() {
  const { id: lessonId } = useParams<{ id?: string }>();
  const isEditing = !!lessonId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedItems, setSelectedItems] = useState<LessonItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "diagram">("content");
  const [isInitialized, setIsInitialized] = useState(false);

  const contents = useQuery(api.queries.contents.getContents);
  const diagrams = useQuery(api.queries.diagrams.getDiagrams);
  const existingLesson = useQuery(
    api.queries.lessons.getLesson,
    lessonId ? { id: lessonId as Id<"lessons"> } : "skip"
  );

  const createLesson = useMutation(api.mutations.lessons.createLesson);
  const updateLesson = useMutation(api.mutations.lessons.updateLesson);
  const navigate = useNavigate();

  // Load existing lesson data when editing
  useEffect(() => {
    if (isEditing && existingLesson && !isInitialized) {
      setTitle(existingLesson.title);
      setDescription(existingLesson.description ?? "");
      setSelectedItems(existingLesson.items);
      setIsInitialized(true);
    }
  }, [isEditing, existingLesson, isInitialized]);

  const addItem = (type: "content" | "diagram", itemId: string) => {
    if (selectedItems.some((item) => item.itemId === itemId)) {
      toast.error("This item is already added");
      return;
    }
    setSelectedItems([
      ...selectedItems,
      { type, itemId, order: selectedItems.length },
    ]);
  };

  const removeItem = (itemId: string) => {
    setSelectedItems(
      selectedItems
        .filter((item) => item.itemId !== itemId)
        .map((item, index) => ({ ...item, order: index }))
    );
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const newItems = [...selectedItems];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newItems.length) return;
    [newItems[index], newItems[newIndex]] = [
      newItems[newIndex],
      newItems[index],
    ];
    setSelectedItems(newItems.map((item, i) => ({ ...item, order: i })));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a lesson title");
      return;
    }
    if (selectedItems.length === 0) {
      toast.error("Please add at least one content or diagram");
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && lessonId) {
        await updateLesson({
          id: lessonId as Id<"lessons">,
          title: title.trim(),
          description: description.trim() || undefined,
          items: selectedItems,
        });
        toast.success("Lesson updated successfully!");
      } else {
        await createLesson({
          title: title.trim(),
          description: description.trim() || undefined,
          items: selectedItems,
        });
        toast.success("Lesson created successfully!");
      }
      navigate("/lessons");
    } catch (error) {
      toast.error(
        isEditing ? "Failed to update lesson" : "Failed to create lesson"
      );
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const getContentById = (id: string) => contents?.find((c) => c._id === id);
  const getDiagramById = (id: string) => diagrams?.find((d) => d._id === id);

  // Show loading state when editing and lesson not yet loaded
  if (isEditing && !existingLesson) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-violet-50/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-violet-50/30">
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Panel - Selector */}
        <div className="w-[400px] border-r border-slate-200 bg-white flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <BookOpen className="h-5 w-5 text-violet-600" />
              </div>
              <h1 className="text-xl font-semibold text-slate-800">
                {isEditing ? "Edit Lesson" : "Create Lesson"}
              </h1>
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lesson title..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white 
                       focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400
                       text-slate-800 placeholder:text-slate-400 transition-all mb-3"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white 
                       focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400
                       text-slate-800 placeholder:text-slate-400 transition-all resize-none"
            />
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab("content")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2
                ${
                  activeTab === "content"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                    : "text-slate-500 hover:text-slate-700"
                }`}
            >
              <FileText className="h-4 w-4" />
              Content
            </button>
            <button
              onClick={() => setActiveTab("diagram")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2
                ${
                  activeTab === "diagram"
                    ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50"
                    : "text-slate-500 hover:text-slate-700"
                }`}
            >
              <PenTool className="h-4 w-4" />
              Diagrams
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "content" && (
              <div className="space-y-2">
                {contents?.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No content blocks yet</p>
                    <Link
                      to="/create/content"
                      className="text-blue-600 text-sm hover:underline mt-2 inline-block"
                    >
                      Create one →
                    </Link>
                  </div>
                )}
                {contents?.map((content) => (
                  <div
                    key={content._id}
                    className={`p-3 rounded-lg border transition-all cursor-pointer
                      ${
                        selectedItems.some((i) => i.itemId === content._id)
                          ? "border-blue-400 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    onClick={() => addItem("content", content._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-slate-700">
                          {content.title}
                        </span>
                      </div>
                      <Plus className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "diagram" && (
              <div className="space-y-2">
                {diagrams?.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <PenTool className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No diagrams yet</p>
                    <Link
                      to="/create/diagram"
                      className="text-emerald-600 text-sm hover:underline mt-2 inline-block"
                    >
                      Create one →
                    </Link>
                  </div>
                )}
                {diagrams?.map((diagram) => (
                  <div
                    key={diagram._id}
                    className={`p-3 rounded-lg border transition-all cursor-pointer
                      ${
                        selectedItems.some((i) => i.itemId === diagram._id)
                          ? "border-emerald-400 bg-emerald-50"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    onClick={() => addItem("diagram", diagram._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PenTool className="h-4 w-4 text-emerald-500" />
                        <span className="font-medium text-slate-700">
                          {diagram.title}
                        </span>
                      </div>
                      <Plus className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Create Links */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <p className="text-xs text-slate-500 mb-2">Quick create:</p>
            <div className="flex gap-2">
              <Link
                to="/create/content"
                className="flex-1 text-center py-2 px-3 rounded-lg border border-slate-200 bg-white
                         text-sm text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
              >
                + Content
              </Link>
              <Link
                to="/create/diagram"
                className="flex-1 text-center py-2 px-3 rounded-lg border border-slate-200 bg-white
                         text-sm text-slate-600 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
              >
                + Diagram
              </Link>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600">
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">Preview</span>
              <span className="text-slate-400">
                ({selectedItems.length} items)
              </span>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg
                       flex items-center gap-2 transition-colors"
            >
              <Save className="h-4 w-4" />
              {isSaving
                ? "Saving..."
                : isEditing
                ? "Update Lesson"
                : "Save Lesson"}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {selectedItems.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-slate-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium text-slate-400">
                    No items added yet
                  </p>
                  <p className="text-sm">
                    Select content or diagrams from the left panel
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl mx-auto">
                {selectedItems.map((item, index) => {
                  const isContent = item.type === "content";
                  const data = isContent
                    ? getContentById(item.itemId)
                    : getDiagramById(item.itemId);

                  if (!data) return null;

                  return (
                    <div
                      key={item.itemId}
                      className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                    >
                      {/* Item Header */}
                      <div
                        className={`px-4 py-3 flex items-center justify-between border-b
                          ${
                            isContent
                              ? "bg-blue-50/50 border-blue-100"
                              : "bg-emerald-50/50 border-emerald-100"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-slate-400" />
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full
                              ${
                                isContent
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                          >
                            {isContent ? "Content" : "Diagram"}
                          </span>
                          <span className="font-medium text-slate-700">
                            {data.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveItem(index, "up")}
                            disabled={index === 0}
                            className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-500"
                          >
                            <ChevronRight className="h-4 w-4 -rotate-90" />
                          </button>
                          <button
                            onClick={() => moveItem(index, "down")}
                            disabled={index === selectedItems.length - 1}
                            className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-500"
                          >
                            <ChevronRight className="h-4 w-4 rotate-90" />
                          </button>
                          <button
                            onClick={() => removeItem(item.itemId)}
                            className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Item Preview */}
                      <div className="p-4">
                        {isContent ? (
                          <ContentPreview
                            content={(data as { content: string }).content}
                          />
                        ) : (
                          <DiagramPreview
                            elements={(data as { elements: string }).elements}
                            appState={(data as { appState: string }).appState}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
