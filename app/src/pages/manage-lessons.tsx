import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Link } from "react-router";
import {
  BookOpen,
  FileText,
  PenTool,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ManageLessonsPage() {
  const lessons = useQuery(api.queries.lessons.getLessons);
  const deleteLesson = useMutation(api.mutations.lessons.deleteLesson);

  const isLoading = lessons === undefined;

  const handleDelete = async (id: Id<"lessons">, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await deleteLesson({ id });
      toast.success("Lesson deleted");
    } catch (error) {
      toast.error("Failed to delete lesson");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-violet-50/30">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <Settings className="h-6 w-6 text-violet-600" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
                Manage Lessons
              </h1>
            </div>
            <p className="text-slate-500 ml-12">
              Edit or delete your existing lessons
            </p>
          </div>

          <Link to="/create/lesson">
            <Button className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Lesson
            </Button>
          </Link>
        </div>

        {/* Lessons List */}
        <div className="space-y-3">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          )}

          {!isLoading && lessons.length === 0 && (
            <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl bg-white">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30 text-slate-400" />
              <p className="text-lg font-medium text-slate-400">
                No lessons yet
              </p>
              <p className="text-sm text-slate-400 mb-4">
                Create your first lesson to get started
              </p>
              <Link to="/create/lesson">
                <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Lesson
                </Button>
              </Link>
            </div>
          )}

          {!isLoading &&
            lessons.map((lesson) => (
              <div
                key={lesson._id}
                className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-violet-500 shrink-0" />
                      <h3 className="font-semibold text-slate-800 truncate">
                        {lesson.title}
                      </h3>
                    </div>
                    {lesson.description && (
                      <p className="text-sm text-slate-500 mt-1 ml-8 truncate">
                        {lesson.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 ml-8 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {
                          lesson.items.filter((i) => i.type === "content")
                            .length
                        }{" "}
                        content
                      </span>
                      <span className="flex items-center gap-1">
                        <PenTool className="h-3 w-3" />
                        {
                          lesson.items.filter((i) => i.type === "diagram")
                            .length
                        }{" "}
                        diagrams
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link to={`/create/lesson/${lesson._id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-slate-600 hover:text-violet-600 hover:border-violet-300"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(lesson._id, lesson.title)}
                      className="text-slate-400 hover:text-red-500 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
