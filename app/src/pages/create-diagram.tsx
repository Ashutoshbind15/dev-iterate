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
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between border-b border-zinc-200 pb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2 bg-zinc-900 text-white rounded-sm">
                <PenTool className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900">
                New Diagram
              </h1>
            </div>
            <p className="text-zinc-500 ml-14 font-medium">
              Draw diagrams and illustrations for your lessons
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-sm
                     flex items-center gap-2 transition-transform hover:scale-105"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Diagram"}
          </Button>
        </div>

        {/* Title Input */}
        <div className="mb-8">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a descriptive title..."
            className="w-full max-w-xl px-0 py-2 rounded-none border-b border-zinc-200 bg-transparent 
                     focus:outline-none focus:border-zinc-900
                     text-xl font-bold placeholder:text-zinc-400 transition-colors duration-200 ease-out"
          />
        </div>

        {/* Diagram Editor */}
        <div className="border border-zinc-200 rounded-sm overflow-hidden grayscale">
          <DiagramsEditor ref={editorRef} isEditable={true} />
        </div>
      </div>
    </div>
  );
}
