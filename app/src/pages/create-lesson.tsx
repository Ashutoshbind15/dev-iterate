import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  X,
} from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { all, createLowlight } from "lowlight";
import {
  Excalidraw,
  convertToExcalidrawElements,
} from "@excalidraw/excalidraw";
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

  // Convert skeleton elements (with label properties) to native Excalidraw format if needed
  const finalElements = isSkeletonFormat(parsedElements)
    ? convertToExcalidrawElements(parsedElements)
    : parsedElements;

  return (
    <div className="h-[300px] grayscale">
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

export default function CreateLessonPage() {
  const { id: lessonId } = useParams<{ id?: string }>();
  const isEditing = !!lessonId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedItems, setSelectedItems] = useState<LessonItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "diagram">("content");
  const [isInitialized, setIsInitialized] = useState(false);

  // todo: [medium] optimize, so that we fetch only the contents that are created by this user, also add auth rows to the content and dg schemas
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
      setTags(existingLesson.tags ?? []);
      setSelectedItems(existingLesson.items);
      setIsInitialized(true);
    }
  }, [isEditing, existingLesson, isInitialized]);

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    } else if (tags.includes(trimmedTag)) {
      toast.error("Tag already exists");
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const addItem = (type: "content" | "diagram", itemId: string) => {
    if (type === "content") {
      const content = contents?.find((c) => c._id === itemId);
      const status = (content as { status?: string } | undefined)?.status ?? "completed";
      if (status === "pending") {
        toast.error("This content is still generating. Please wait.");
        return;
      }
      if (status === "failed") {
        toast.error("This content failed to generate.");
        return;
      }
    }
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
          tags: tags,
          items: selectedItems,
        });
        toast.success("Lesson updated successfully!");
      } else {
        await createLesson({
          title: title.trim(),
          description: description.trim() || undefined,
          tags: tags,
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
  if (isEditing && existingLesson === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
      </div>
    );
  }

  // If editing but lesson doesn't exist or user doesn't have access
  if (isEditing && existingLesson === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">
            Lesson not found
          </h1>
          <p className="text-sm text-zinc-500 mb-6">
            This lesson may have been deleted, or you may not have access to it.
          </p>
          <Link
            to="/manage/lessons"
            className="text-zinc-900 text-sm hover:underline font-semibold"
          >
            Back to Manage Lessons →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Panel - Selector */}
        <div className="w-[420px] border-r border-zinc-200 bg-white flex flex-col">
          <div className="p-6 border-b border-zinc-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-zinc-900 text-white rounded-sm">
                <BookOpen className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900">
                {isEditing ? "Edit Lesson" : "Create Lesson"}
              </h1>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Lesson title..."
                className="w-full px-0 py-2 rounded-none border-b border-zinc-200 bg-transparent 
                         focus:outline-none focus:border-zinc-900
                         text-lg font-bold placeholder:text-zinc-300 transition-colors duration-200 ease-out"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)..."
                rows={2}
                className="w-full px-3 py-2 rounded-sm border border-zinc-200 bg-zinc-50 
                         focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900
                         text-xs text-zinc-700 placeholder:text-zinc-400 transition-all resize-none"
              />
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    placeholder="Add tag..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-sm
                             flex items-center gap-1 transition-all"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="flex items-center gap-1 px-2 py-1 text-xs"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:bg-zinc-100 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-zinc-200">
            <button
              onClick={() => setActiveTab("content")}
              className={`flex-1 px-4 py-4 text-sm font-medium transition-all flex items-center justify-center gap-2
                ${
                  activeTab === "content"
                    ? "text-zinc-900 border-b-2 border-zinc-900 bg-zinc-50"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50/50"
                }`}
            >
              <FileText className="h-4 w-4" />
              Content
            </button>
            <button
              onClick={() => setActiveTab("diagram")}
              className={`flex-1 px-4 py-4 text-sm font-medium transition-all flex items-center justify-center gap-2
                ${
                  activeTab === "diagram"
                    ? "text-zinc-900 border-b-2 border-zinc-900 bg-zinc-50"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50/50"
                }`}
            >
              <PenTool className="h-4 w-4" />
              Diagrams
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 bg-zinc-50/30">
            {activeTab === "content" && (
              <div className="space-y-2">
                {contents?.length === 0 && (
                  <div className="text-center py-12 text-zinc-500">
                    <FileText className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">No content blocks yet</p>
                    <Link
                      to="/create/content"
                      className="text-zinc-900 text-sm hover:underline mt-2 inline-block font-semibold"
                    >
                      Create one →
                    </Link>
                  </div>
                )}
                {contents?.map((content) => (
                  (() => {
                    const status =
                      (content as { status?: string }).status ?? "completed";
                    const isPending = status === "pending";
                    const isFailed = status === "failed";
                    const isSelected = selectedItems.some(
                      (i) => i.itemId === content._id
                    );
                    return (
                  <div
                    key={content._id}
                    className={`p-4 rounded-sm border transition-all group
                      ${
                        isSelected
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : isPending
                          ? "border-zinc-200 bg-white opacity-70 cursor-not-allowed"
                          : isFailed
                          ? "border-red-200 bg-white opacity-80 cursor-not-allowed"
                          : "border-zinc-200 hover:border-zinc-400 bg-white cursor-pointer"
                      }`}
                    onClick={() => addItem("content", content._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText
                          className={`h-4 w-4 ${
                            isSelected
                              ? "text-zinc-300"
                              : "text-zinc-500"
                          }`}
                        />
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium truncate">
                            {content.title}
                          </span>
                          {isPending && (
                            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                              Generating…
                            </span>
                          )}
                          {isFailed && (
                            <span className="text-xs font-semibold uppercase tracking-wider text-red-600">
                              Failed
                            </span>
                          )}
                        </div>
                      </div>
                      <Plus
                        className={`h-4 w-4 ${
                          isSelected
                            ? "text-zinc-300"
                            : isPending || isFailed
                            ? "text-zinc-300"
                            : "text-zinc-400 group-hover:text-zinc-900"
                        }`}
                      />
                    </div>
                  </div>
                    );
                  })()
                ))}
              </div>
            )}

            {activeTab === "diagram" && (
              <div className="space-y-2">
                {diagrams?.length === 0 && (
                  <div className="text-center py-12 text-zinc-500">
                    <PenTool className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">No diagrams yet</p>
                    <Link
                      to="/create/diagram"
                      className="text-zinc-900 text-sm hover:underline mt-2 inline-block font-semibold"
                    >
                      Create one →
                    </Link>
                  </div>
                )}
                {diagrams?.map((diagram) => (
                  <div
                    key={diagram._id}
                    className={`p-4 rounded-sm border transition-all cursor-pointer group
                      ${
                        selectedItems.some((i) => i.itemId === diagram._id)
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 hover:border-zinc-400 bg-white"
                      }`}
                    onClick={() => addItem("diagram", diagram._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <PenTool
                          className={`h-4 w-4 ${
                            selectedItems.some((i) => i.itemId === diagram._id)
                              ? "text-zinc-300"
                              : "text-zinc-500"
                          }`}
                        />
                        <span className="font-medium">{diagram.title}</span>
                      </div>
                      <Plus
                        className={`h-4 w-4 ${
                          selectedItems.some((i) => i.itemId === diagram._id)
                            ? "text-zinc-300"
                            : "text-zinc-400 group-hover:text-zinc-900"
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Create Links */}
          <div className="p-4 border-t border-zinc-200 bg-white">
            <p className="text-xs uppercase tracking-wider text-zinc-400 font-bold mb-3">
              Quick Create
            </p>
            <div className="flex gap-3">
              <Link
                to="/create/content"
                className="flex-1 text-center py-2.5 px-3 rounded-sm border border-zinc-200 bg-zinc-50
                         text-sm font-medium text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 hover:bg-white transition-all"
              >
                + Content
              </Link>
              <Link
                to="/create/diagram"
                className="flex-1 text-center py-2.5 px-3 rounded-sm border border-zinc-200 bg-zinc-50
                         text-sm font-medium text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 hover:bg-white transition-all"
              >
                + Diagram
              </Link>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 flex flex-col bg-zinc-50/50">
          <div className="p-4 border-b border-zinc-200 bg-white flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-3 text-zinc-600">
              <Eye className="h-4 w-4" />
              <span className="text-sm font-semibold tracking-wide uppercase">
                Preview
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 font-medium">
                {selectedItems.length} items
              </span>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-sm
                       flex items-center gap-2 transition-all transform hover:scale-105"
            >
              <Save className="h-4 w-4" />
              {isSaving
                ? "Saving..."
                : isEditing
                ? "Update Lesson"
                : "Save Lesson"}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {selectedItems.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-zinc-400">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-10" />
                  <p className="text-xl font-bold text-zinc-300">
                    No items added yet
                  </p>
                  <p className="text-sm mt-2">
                    Select content or diagrams from the left panel
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-w-3xl mx-auto">
                {selectedItems.map((item, index) => {
                  const isContent = item.type === "content";
                  const data = isContent
                    ? getContentById(item.itemId)
                    : getDiagramById(item.itemId);

                  if (!data) return null;

                  return (
                    <div
                      key={item.itemId}
                      className="rounded-sm border border-zinc-200 bg-white shadow-sm overflow-hidden group"
                    >
                      {/* Item Header */}
                      <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-100 bg-zinc-50/30">
                        <div className="flex items-center gap-4">
                          <GripVertical className="h-4 w-4 text-zinc-300 cursor-grab active:cursor-grabbing" />
                          <span className="text-xs font-bold px-2 py-1 rounded-sm bg-zinc-100 text-zinc-600 uppercase tracking-wider">
                            {isContent ? "Content" : "Diagram"}
                          </span>
                          <span className="font-semibold text-zinc-900">
                            {data.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => moveItem(index, "up")}
                            disabled={index === 0}
                            className="p-2 rounded-sm hover:bg-zinc-200 disabled:opacity-30 text-zinc-500 transition-colors"
                          >
                            <ChevronRight className="h-4 w-4 -rotate-90" />
                          </button>
                          <button
                            onClick={() => moveItem(index, "down")}
                            disabled={index === selectedItems.length - 1}
                            className="p-2 rounded-sm hover:bg-zinc-200 disabled:opacity-30 text-zinc-500 transition-colors"
                          >
                            <ChevronRight className="h-4 w-4 rotate-90" />
                          </button>
                          <button
                            onClick={() => removeItem(item.itemId)}
                            className="p-2 rounded-sm hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Item Preview */}
                      <div className="p-6">
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
