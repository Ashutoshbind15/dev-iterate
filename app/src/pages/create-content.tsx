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
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
              Create Content Block
            </h1>
          </div>
          <p className="text-slate-500 ml-12">
            Write rich text content that can be added to lessons
          </p>
        </div>

        {/* Title Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Content Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Introduction to React Hooks"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white 
                     focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                     text-slate-800 placeholder:text-slate-400 transition-all"
          />
        </div>

        {/* Editor */}
        <RichTextEditor
          ref={editorRef}
          isEditable={true}
          minHeight="400px"
          maxHeight="600px"
        />

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                     flex items-center gap-2 transition-colors"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Content"}
          </Button>
        </div>
      </div>
    </div>
  );
}
