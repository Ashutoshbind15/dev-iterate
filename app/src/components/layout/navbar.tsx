import { Link, useLocation } from "react-router";
import {
  BookOpen,
  Plus,
  FileText,
  PenTool,
  Layers,
  Settings,
  User,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { SignIn } from "../utils/sign-in";
import { SignOut } from "../utils/sign-out";

const Navbar = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="h-16 border-b border-zinc-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="p-2 bg-zinc-900 rounded-sm group-hover:scale-105 transition-transform duration-300">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-zinc-900">
            LessonForge
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-2">
          <Link
            to="/lessons"
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 border border-transparent rounded-sm
              ${
                isActive("/lessons")
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:text-zinc-900 hover:border-zinc-200"
              }`}
          >
            <Layers className="h-4 w-4" />
            Lessons
          </Link>
          <Link
            to="/corpus"
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 border border-transparent rounded-sm
              ${
                isActive("/corpus")
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:text-zinc-900 hover:border-zinc-200"
              }`}
          >
            <HelpCircle className="h-4 w-4" />
            Corpus
          </Link>

          {/* Create Dropdown */}
          <div className="relative group">
            <button
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 border border-transparent rounded-sm
                ${
                  isActive("/create") || isActive("/manage")
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:text-zinc-900 hover:border-zinc-200"
                }`}
            >
              <Plus className="h-4 w-4" />
              Create
            </button>

            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-64 p-2 bg-white border border-zinc-200 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
              <Link
                to="/create/content"
                className="flex items-start gap-3 px-4 py-3 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
              >
                <FileText className="h-5 w-5 mt-0.5" />
                <div>
                  <div className="font-semibold text-zinc-900">
                    Content Block
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    Rich text content editor
                  </div>
                </div>
              </Link>
              <Link
                to="/create/diagram"
                className="flex items-start gap-3 px-4 py-3 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
              >
                <PenTool className="h-5 w-5 mt-0.5" />
                <div>
                  <div className="font-semibold text-zinc-900">Diagram</div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    Visual diagram editor
                  </div>
                </div>
              </Link>
              <div className="border-t border-zinc-100 my-1" />
              <Link
                to="/create/lesson"
                className="flex items-start gap-3 px-4 py-3 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
              >
                <BookOpen className="h-5 w-5 mt-0.5" />
                <div>
                  <div className="font-semibold text-zinc-900">New Lesson</div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    Combine content & diagrams
                  </div>
                </div>
              </Link>
              <Link
                to="/manage/lessons"
                className="flex items-start gap-3 px-4 py-3 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
              >
                <Settings className="h-5 w-5 mt-0.5" />
                <div>
                  <div className="font-semibold text-zinc-900">
                    Manage Lessons
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    Edit or delete lessons
                  </div>
                </div>
              </Link>
              <div className="border-t border-zinc-100 my-1" />
              <Link
                to="/contribute"
                className="flex items-start gap-3 px-4 py-3 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
              >
                <MessageSquare className="h-5 w-5 mt-0.5" />
                <div>
                  <div className="font-semibold text-zinc-900">
                    Contribute Question
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    Add MCQ or descriptive questions
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
        <AuthLoading>Loading...</AuthLoading>
        <Unauthenticated>
          <SignIn />
        </Unauthenticated>
        <Authenticated>
          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 border border-transparent rounded-sm
                ${
                  isActive("/profile")
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:text-zinc-900 hover:border-zinc-200"
                }`}
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <SignOut />
          </div>
        </Authenticated>
      </div>
    </nav>
  );
};

export default Navbar;
