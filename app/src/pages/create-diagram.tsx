import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import DiagramsEditor, {
  type DiagramsEditorRef,
} from "@/components/editor/diagrams-editor";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { Save, PenTool } from "lucide-react";

export default function CreateDiagramPage() {
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<DiagramsEditorRef>(null);
  const createDiagram = useMutation(api.mutations.diagrams.createDiagram);
  const navigate = useNavigate();

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    const elements = editorRef.current?.getElements();
    if (!elements || elements.length === 0) {
      toast.error("Please draw something before saving");
      return;
    }

    setIsSaving(true);
    try {
      const elementsJson = JSON.stringify(elements);
      const appStateJson = JSON.stringify(editorRef.current?.getAppState());

      await createDiagram({
        title: title.trim(),
        elements: elementsJson,
        appState: appStateJson,
      });
      toast.success("Diagram saved successfully!");
      navigate("/create/lesson");
    } catch (error) {
      toast.error("Failed to save diagram");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <PenTool className="h-6 w-6 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
                Create Diagram
              </h1>
            </div>
            <p className="text-slate-500 ml-12">
              Draw diagrams and illustrations for your lessons
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg
                     flex items-center gap-2 transition-colors"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Diagram"}
          </Button>
        </div>

        {/* Title Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Diagram Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Component Lifecycle Diagram"
            className="w-full max-w-md px-4 py-3 rounded-xl border border-slate-200 bg-white 
                     focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400
                     text-slate-800 placeholder:text-slate-400 transition-all"
          />
        </div>

        {/* Diagram Editor */}
        <DiagramsEditor ref={editorRef} isEditable={true} />
      </div>
    </div>
  );
}
