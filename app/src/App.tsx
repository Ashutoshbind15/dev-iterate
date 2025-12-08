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
    <div className="min-h-[calc(100vh-64px)] bg-white text-zinc-900 font-sans">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-6 pt-24 pb-20">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 bg-white text-zinc-500 text-xs font-bold uppercase tracking-widest mb-8">
            <Sparkles className="h-3 w-3" />
            Build interactive lessons with ease
          </div>
          <h1 className="text-6xl md:text-7xl font-black text-zinc-900 mb-8 tracking-tighter leading-tight">
            Create Beautiful
            <br />
            <span className="text-zinc-500">Lessons Effortlessly</span>
          </h1>
          <p className="text-xl md:text-2xl text-zinc-500 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            Combine rich text content and interactive diagrams to build engaging
            educational materials. Perfect for tutorials, courses, and
            documentation.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/create/lesson"
              className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-900 hover:bg-zinc-800 
                       text-white font-medium rounded-sm transition-all transform hover:scale-105"
            >
              <BookOpen className="h-5 w-5" />
              Create a Lesson
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/lessons"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white border border-zinc-200
                       text-zinc-900 font-medium rounded-sm hover:bg-zinc-50 transition-all hover:border-zinc-900"
            >
              <Layers className="h-5 w-5" />
              View Lessons
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          <Link
            to="/create/content"
            className="group p-8 rounded-sm bg-white border border-zinc-200 hover:border-zinc-900 
                     transition-all hover:shadow-xl hover:-translate-y-1"
          >
            <div
              className="w-12 h-12 rounded-sm bg-zinc-100 flex items-center justify-center mb-6 
                          group-hover:bg-zinc-900 group-hover:text-white transition-colors"
            >
              <FileText className="h-6 w-6 text-zinc-900 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-3">
              Content Blocks
            </h3>
            <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
              Create rich text content with headings, code blocks, lists, and
              more. Perfect for explanations and tutorials.
            </p>
            <span
              className="inline-flex items-center gap-2 text-zinc-900 text-sm font-bold uppercase tracking-wider 
                          group-hover:gap-3 transition-all"
            >
              Create content <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          <Link
            to="/create/diagram"
            className="group p-8 rounded-sm bg-white border border-zinc-200 hover:border-zinc-900 
                     transition-all hover:shadow-xl hover:-translate-y-1"
          >
            <div
              className="w-12 h-12 rounded-sm bg-zinc-100 flex items-center justify-center mb-6 
                          group-hover:bg-zinc-900 group-hover:text-white transition-colors"
            >
              <PenTool className="h-6 w-6 text-zinc-900 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-3">
              Diagrams
            </h3>
            <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
              Draw diagrams, flowcharts, and illustrations with the powerful
              Excalidraw whiteboard.
            </p>
            <span
              className="inline-flex items-center gap-2 text-zinc-900 text-sm font-bold uppercase tracking-wider 
                          group-hover:gap-3 transition-all"
            >
              Create diagram <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          <Link
            to="/create/lesson"
            className="group p-8 rounded-sm bg-white border border-zinc-200 hover:border-zinc-900 
                     transition-all hover:shadow-xl hover:-translate-y-1"
          >
            <div
              className="w-12 h-12 rounded-sm bg-zinc-100 flex items-center justify-center mb-6 
                          group-hover:bg-zinc-900 group-hover:text-white transition-colors"
            >
              <BookOpen className="h-6 w-6 text-zinc-900 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-3">
              Lessons
            </h3>
            <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
              Combine content blocks and diagrams into complete lessons with
              drag-and-drop ordering.
            </p>
            <span
              className="inline-flex items-center gap-2 text-zinc-900 text-sm font-bold uppercase tracking-wider 
                          group-hover:gap-3 transition-all"
            >
              Create lesson <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>

        {/* How it works */}
        <div className="text-center mb-16">
          <h2 className="text-2xl font-black text-zinc-900 mb-12 uppercase tracking-widest">
            How it works
          </h2>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="flex items-center gap-4 px-6 py-4 rounded-sm border border-zinc-200 bg-white shadow-sm">
              <span className="w-8 h-8 rounded-sm bg-zinc-900 text-white text-sm font-bold flex items-center justify-center">
                1
              </span>
              <span className="text-zinc-900 font-bold">
                Create content blocks
              </span>
            </div>
            <ArrowRight className="h-6 w-6 text-zinc-300 hidden md:block" />
            <div className="flex items-center gap-4 px-6 py-4 rounded-sm border border-zinc-200 bg-white shadow-sm">
              <span className="w-8 h-8 rounded-sm bg-zinc-900 text-white text-sm font-bold flex items-center justify-center">
                2
              </span>
              <span className="text-zinc-900 font-bold">Draw diagrams</span>
            </div>
            <ArrowRight className="h-6 w-6 text-zinc-300 hidden md:block" />
            <div className="flex items-center gap-4 px-6 py-4 rounded-sm border border-zinc-200 bg-white shadow-sm">
              <span className="w-8 h-8 rounded-sm bg-zinc-900 text-white text-sm font-bold flex items-center justify-center">
                3
              </span>
              <span className="text-zinc-900 font-bold">
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
