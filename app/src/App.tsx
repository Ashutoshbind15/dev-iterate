import { Link } from "react-router";
import {
  BookOpen,
  FileText,
  PenTool,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";

function App() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-linear-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Build interactive lessons with ease
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-6 tracking-tight">
            Create Beautiful
            <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {" "}
              Lessons{" "}
            </span>
            Effortlessly
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Combine rich text content and interactive diagrams to build engaging
            educational materials. Perfect for tutorials, courses, and
            documentation.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/create/lesson"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 
                       text-white font-medium rounded-xl transition-colors shadow-lg shadow-indigo-500/25"
            >
              <BookOpen className="h-5 w-5" />
              Create a Lesson
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/lessons"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200
                       text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Layers className="h-5 w-5" />
              View Lessons
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Link
            to="/create/content"
            className="group p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-200 
                     hover:shadow-lg hover:shadow-blue-500/5 transition-all"
          >
            <div
              className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 
                          group-hover:bg-blue-100 transition-colors"
            >
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Content Blocks
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              Create rich text content with headings, code blocks, lists, and
              more. Perfect for explanations and tutorials.
            </p>
            <span
              className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium 
                          group-hover:gap-2 transition-all"
            >
              Create content <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          <Link
            to="/create/diagram"
            className="group p-6 rounded-2xl bg-white border border-slate-200 hover:border-emerald-200 
                     hover:shadow-lg hover:shadow-emerald-500/5 transition-all"
          >
            <div
              className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 
                          group-hover:bg-emerald-100 transition-colors"
            >
              <PenTool className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Diagrams
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              Draw diagrams, flowcharts, and illustrations with the powerful
              Excalidraw whiteboard.
            </p>
            <span
              className="inline-flex items-center gap-1 text-emerald-600 text-sm font-medium 
                          group-hover:gap-2 transition-all"
            >
              Create diagram <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          <Link
            to="/create/lesson"
            className="group p-6 rounded-2xl bg-white border border-slate-200 hover:border-violet-200 
                     hover:shadow-lg hover:shadow-violet-500/5 transition-all"
          >
            <div
              className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center mb-4 
                          group-hover:bg-violet-100 transition-colors"
            >
              <BookOpen className="h-6 w-6 text-violet-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Lessons
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              Combine content blocks and diagrams into complete lessons with
              drag-and-drop ordering.
            </p>
            <span
              className="inline-flex items-center gap-1 text-violet-600 text-sm font-medium 
                          group-hover:gap-2 transition-all"
            >
              Create lesson <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>

        {/* How it works */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-8">
            How it works
          </h2>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-blue-50">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-medium flex items-center justify-center">
                1
              </span>
              <span className="text-slate-700 font-medium">
                Create content blocks
              </span>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-300 hidden md:block" />
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-emerald-50">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-sm font-medium flex items-center justify-center">
                2
              </span>
              <span className="text-slate-700 font-medium">Draw diagrams</span>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-300 hidden md:block" />
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-violet-50">
              <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-sm font-medium flex items-center justify-center">
                3
              </span>
              <span className="text-slate-700 font-medium">
                Combine into lessons
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
