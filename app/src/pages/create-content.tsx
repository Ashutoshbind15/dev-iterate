import { useState, useRef } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import RichTextEditor, {
  type RichTextEditorRef,
} from "@/components/editor/rich-text-editor";
import { Save, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router";

export default function CreateContentPage() {
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const editorRef = useRef<RichTextEditorRef>(null);
  const createContent = useMutation(api.mutations.contents.createContent);
  const triggerLessonGeneration = useAction(api.actionsdir.lessonContent.triggerLessonContentGeneration);
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

  const handleGenerateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setIsGenerating(true);
    try {
      await triggerLessonGeneration({ topic: topic.trim() });
      toast.success("Lesson generation job submitted successfully!");
      setTopic("");
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Failed to submit lesson generation job");
      console.error(error);
    } finally {
      setIsGenerating(false);
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
          <div className="flex items-center gap-3">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="px-6 py-2 border-zinc-300 hover:bg-zinc-50 text-zinc-900 rounded-sm
                           flex items-center gap-2 transition-transform hover:scale-105"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate with AI
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleGenerateLesson}>
                  <DialogHeader>
                    <DialogTitle>Generate Lesson Content</DialogTitle>
                    <DialogDescription>
                      Enter a topic and AI will generate comprehensive lesson content for you.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-3">
                      <Label htmlFor="topic">Topic</Label>
                      <Input
                        id="topic"
                        name="topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., JavaScript closures, React hooks, Python decorators"
                        disabled={isGenerating}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline" disabled={isGenerating}>
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isGenerating}>
                      {isGenerating ? "Submitting..." : "Generate"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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
