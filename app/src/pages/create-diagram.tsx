import { useState, useRef } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import DiagramsEditor, {
  type DiagramsEditorRef,
} from "@/components/editor/diagrams-editor";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { Save, PenTool, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { parseMermaidToExcalidraw } from "@excalidraw/mermaid-to-excalidraw";
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";

export default function CreateDiagramPage() {
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [description, setDescription] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const editorRef = useRef<DiagramsEditorRef>(null);
  const createDiagram = useMutation(api.mutations.diagrams.createDiagram);
  const triggerGeneration = useAction(
    api.actionsdir.diagramGeneration.triggerDiagramGeneration
  );
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

  const handleGenerateDiagram = async () => {
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setIsModalOpen(false);

    try {
      const result = await triggerGeneration({
        description: description.trim(),
      });
      const { elements: skeletonElements } = await parseMermaidToExcalidraw(
        result.mermaid,
        { themeVariables: { fontSize: "20px" } }
      );
      // Convert skeleton elements (with label properties) to native Excalidraw elements (with bound text elements)
      const excalidrawElements = convertToExcalidrawElements(skeletonElements);
      await createDiagram({
        title: result.title,
        elements: JSON.stringify(excalidrawElements),
        appState: JSON.stringify({ viewBackgroundColor: "#ffffff" }),
      });
      toast.success("Diagram generated successfully!");
      editorRef.current?.setElements(excalidrawElements);
    } catch (error) {
      toast.error("Failed to trigger diagram generation");
      console.error(error);
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

          <div className="flex items-center gap-3">
            {/* AI Generate Button */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="px-6 py-2 border-zinc-300 hover:bg-zinc-50 text-zinc-700 rounded-sm
                           flex items-center gap-2 transition-transform hover:scale-105"
                >
                  <Sparkles className="h-4 w-4" />
                  AI Generate
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-white">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-zinc-900">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Generate Diagram with AI
                  </DialogTitle>
                  <DialogDescription className="text-zinc-500">
                    Describe the system, process, or architecture you want to
                    visualize. Be detailed for better results.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Example: A video processing pipeline where users upload videos to a client app, which sends them to a backend server. The server queues transcoding jobs that workers pick up, transcode to HLS format, and upload segments to cloud storage. Users can then stream videos via presigned URLs..."
                    className="w-full min-h-[200px] p-4 border border-zinc-200 rounded-sm bg-white
                             text-zinc-900 placeholder:text-zinc-400 resize-none
                             focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent
                             font-mono text-sm"
                  />
                  <p className="text-xs text-zinc-400 mt-2">
                    Tip: Include component names, data flows, and relationships
                    for the best results.
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateDiagram}
                    disabled={!description.trim()}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

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
