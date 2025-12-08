import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Link } from "react-router";
import {
  BookOpen,
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
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between border-b border-zinc-200 pb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2 bg-zinc-900 text-white rounded-sm">
                <Settings className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-zinc-900">
                Manage Lessons
              </h1>
            </div>
            <p className="text-zinc-500 ml-14 font-medium">
              Edit or delete your existing lessons
            </p>
          </div>

          <Link to="/create/lesson">
            <Button className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-sm flex items-center gap-2 transition-transform hover:scale-105">
              <Plus className="h-4 w-4" />
              New Lesson
            </Button>
          </Link>
        </div>

        {/* Lessons List */}
        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
            </div>
          )}

          {!isLoading && lessons.length === 0 && (
            <div className="text-center py-24 border-2 border-dashed border-zinc-200 rounded-sm bg-zinc-50">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20 text-zinc-500" />
              <p className="text-xl font-bold text-zinc-400">
                No lessons yet
              </p>
              <p className="text-sm text-zinc-500 mb-6">
                Create your first lesson to get started
              </p>
              <Link to="/create/lesson">
                <Button className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-sm px-8">
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
                className="p-6 rounded-sm border border-zinc-200 bg-white hover:border-zinc-400 transition-all group hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4">
                      <BookOpen className="h-5 w-5 text-zinc-400 group-hover:text-zinc-900 transition-colors shrink-0" />
                      <h3 className="text-lg font-bold text-zinc-900 truncate">
                        {lesson.title}
                      </h3>
                    </div>
                    {lesson.description && (
                      <p className="text-sm text-zinc-500 mt-2 ml-9 truncate">
                        {lesson.description}
                      </p>
                    )}
                    <div className="flex items-center gap-6 mt-3 ml-9 text-xs font-bold uppercase tracking-wider text-zinc-400">
                      <span>
                        {
                          lesson.items.filter((i) => i.type === "content")
                            .length
                        }{" "}
                        content
                      </span>
                      <span>
                        {
                          lesson.items.filter((i) => i.type === "diagram")
                            .length
                        }{" "}
                        diagrams
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-6 opacity-50 group-hover:opacity-100 transition-opacity">
                    <Link to={`/create/lesson/${lesson._id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-900 rounded-sm"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(lesson._id, lesson.title)}
                      className="border-zinc-200 text-zinc-400 hover:text-red-600 hover:border-red-600 rounded-sm"
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
