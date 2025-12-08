import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import RichTextEditor, {
  type RichTextEditorRef,
} from "@/components/editor/rich-text-editor";
import { Save, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router";

export default function CreateContentPage() {
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<RichTextEditorRef>(null);
  const createContent = useMutation(api.mutations.contents.createContent);
  const navigate = useNavigate();

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    const json = editorRef.current?.getJSON();
    if (!json) {
      toast.error("Editor not ready");
      return;
    }

    setIsSaving(true);
    try {
      const content = JSON.stringify(json);
      await createContent({ title: title.trim(), content });
      toast.success("Content saved successfully!");
      navigate("/create/lesson");
    } catch (error) {
      toast.error("Failed to save content");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between border-b border-zinc-200 pb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2 bg-zinc-900 text-white rounded-sm">
                <FileText className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900">
                New Content Block
              </h1>
            </div>
            <p className="text-zinc-500 ml-14 font-medium">
              Write rich text content that can be added to lessons
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-sm
                     flex items-center gap-2 transition-transform hover:scale-105"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Content"}
          </Button>
        </div>

        {/* Title Input */}
        <div className="mb-8">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a descriptive title..."
            className="w-full px-0 py-2 rounded-none border-b border-zinc-200 bg-transparent 
                     focus:outline-none focus:border-zinc-900
                     text-xl font-bold placeholder:text-zinc-400 transition-colors duration-200 ease-out"
          />
        </div>

        {/* Editor */}
        <div className="border border-zinc-200 rounded-sm overflow-hidden">
          <RichTextEditor
            ref={editorRef}
            isEditable={true}
            minHeight="400px"
            maxHeight="600px"
          />
        </div>
      </div>
    </div>
  );
}
