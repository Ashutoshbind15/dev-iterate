import { Link, useLocation } from "react-router";
import {
  BookOpen,
  Plus,
  FileText,
  PenTool,
  Layers,
  Settings,
} from "lucide-react";

const Navbar = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-1.5 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 group-hover:shadow-lg transition-shadow">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-slate-800">LessonForge</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-1">
          <Link
            to="/lessons"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${
                isActive("/lessons")
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
          >
            <Layers className="h-4 w-4" />
            Lessons
          </Link>

          {/* Create Dropdown */}
          <div className="relative group">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${
                  isActive("/create") || isActive("/manage")
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              <Plus className="h-4 w-4" />
              Create
            </button>

            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-1 w-56 py-2 bg-white rounded-xl shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <Link
                to="/create/content"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <FileText className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="font-medium">Content Block</div>
                  <div className="text-xs text-slate-400">
                    Rich text content
                  </div>
                </div>
              </Link>
              <Link
                to="/create/diagram"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <PenTool className="h-4 w-4 text-emerald-500" />
                <div>
                  <div className="font-medium">Diagram</div>
                  <div className="text-xs text-slate-400">
                    Excalidraw drawing
                  </div>
                </div>
              </Link>
              <div className="border-t border-slate-100 my-2" />
              <Link
                to="/create/lesson"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <BookOpen className="h-4 w-4 text-violet-500" />
                <div>
                  <div className="font-medium">New Lesson</div>
                  <div className="text-xs text-slate-400">
                    Combine content & diagrams
                  </div>
                </div>
              </Link>
              <Link
                to="/manage/lessons"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <Settings className="h-4 w-4 text-slate-500" />
                <div>
                  <div className="font-medium">Manage Lessons</div>
                  <div className="text-xs text-slate-400">
                    Edit or delete lessons
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
