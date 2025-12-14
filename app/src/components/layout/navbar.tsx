import { Link, useLocation } from "react-router";
import {
  BookOpen,
  Layers,
  User,
  HelpCircle,
  Sparkles,
  Code2,
} from "lucide-react";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useQuery,
} from "convex/react";
import { api } from "../../../convex/_generated/api";
import { SignIn } from "../utils/sign-in";
import { SignOut } from "../utils/sign-out";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const location = useLocation();
  const hasAnalysis = useQuery(api.queries.user.hasUserAnalysis) ?? false;
  const hasCodingAnalysis =
    useQuery(api.queries.user.hasCodingAnalysis) ?? false;

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
            Dev-iterate
          </span>
        </Link>

        {/* Navigation */}
        <NavigationMenu viewport={false}>
          <NavigationMenuList className="gap-1">
            {/* Lessons */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="rounded-sm">
                <span className="inline-flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Lessons
                </span>
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-1 w-[280px]">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link to="/lessons" data-active={isActive("/lessons")}>
                        <span className="font-medium">View lessons</span>
                        <span className="text-muted-foreground text-xs">
                          Browse and read lessons
                        </span>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/sys-lessons"
                        data-active={isActive("/sys-lessons")}
                      >
                        <span className="font-medium">System lessons</span>
                        <span className="text-muted-foreground text-xs">
                          Browse system-generated lessons
                        </span>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <Authenticated>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/manage/lessons"
                          data-active={isActive("/manage/lessons")}
                        >
                          <span className="font-medium">Manage lessons</span>
                          <span className="text-muted-foreground text-xs">
                            Create, edit, and delete lessons
                          </span>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </Authenticated>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Questions */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="rounded-sm">
                <span className="inline-flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Questions
                </span>
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-1 w-[320px]">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link to="/corpus" data-active={isActive("/corpus")}>
                        <span className="font-medium">Corpus</span>
                        <span className="text-muted-foreground text-xs">
                          Practice questions and quizzes
                        </span>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/leaderboard"
                        data-active={isActive("/leaderboard")}
                      >
                        <span className="font-medium">Leaderboard</span>
                        <span className="text-muted-foreground text-xs">
                          See top performers
                        </span>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <Authenticated>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/contribute"
                          data-active={isActive("/contribute")}
                        >
                          <span className="font-medium">Contribute</span>
                          <span className="text-muted-foreground text-xs">
                            Add questions to the corpus
                          </span>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </Authenticated>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Coding */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="rounded-sm">
                <span className="inline-flex items-center gap-2">
                  <Code2 className="h-4 w-4" />
                  Coding
                </span>
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-1 w-[320px]">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link to="/coding" data-active={isActive("/coding")}>
                        <span className="font-medium">Problems</span>
                        <span className="text-muted-foreground text-xs">
                          Browse coding challenges
                        </span>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Improve */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="rounded-sm">
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Improve
                </span>
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-1 w-[320px]">
                  <Authenticated>
                    {/* Personalized Questions */}
                    {hasAnalysis ? (
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            to="/personalized-questions"
                            data-active={isActive("/personalized-questions")}
                          >
                            <span className="font-medium">
                              Personalized questions
                            </span>
                            <span className="text-muted-foreground text-xs">
                              Focus on your weak areas
                            </span>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ) : (
                      <li>
                        <div
                          className={cn(
                            "flex flex-col gap-1 rounded-sm p-2 text-sm opacity-60 cursor-not-allowed select-none"
                          )}
                          aria-disabled="true"
                        >
                          <span className="font-medium">
                            Personalized questions
                          </span>
                          <span className="text-muted-foreground text-xs">
                            Answer 5 questions to unlock
                          </span>
                        </div>
                      </li>
                    )}
                    {/* Personalized Coding */}
                    {hasCodingAnalysis ? (
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            to="/personalized-coding"
                            data-active={isActive("/personalized-coding")}
                          >
                            <span className="font-medium">
                              Personalized coding
                            </span>
                            <span className="text-muted-foreground text-xs">
                              AI-generated coding challenges for you
                            </span>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ) : (
                      <li>
                        <div
                          className={cn(
                            "flex flex-col gap-1 rounded-sm p-2 text-sm opacity-60 cursor-not-allowed select-none"
                          )}
                          aria-disabled="true"
                        >
                          <span className="font-medium">
                            Personalized coding
                          </span>
                          <span className="text-muted-foreground text-xs">
                            Submit 10 coding solutions to unlock
                          </span>
                        </div>
                      </li>
                    )}
                  </Authenticated>
                  <Unauthenticated>
                    <li>
                      <div
                        className={cn(
                          "flex flex-col gap-1 rounded-sm p-2 text-sm opacity-60 select-none"
                        )}
                        aria-disabled="true"
                      >
                        <span className="font-medium">
                          Personalized questions
                        </span>
                        <span className="text-muted-foreground text-xs">
                          Sign in to access improve tools
                        </span>
                      </div>
                    </li>
                    <li>
                      <div
                        className={cn(
                          "flex flex-col gap-1 rounded-sm p-2 text-sm opacity-60 select-none"
                        )}
                        aria-disabled="true"
                      >
                        <span className="font-medium">Personalized coding</span>
                        <span className="text-muted-foreground text-xs">
                          Sign in to access improve tools
                        </span>
                      </div>
                    </li>
                  </Unauthenticated>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

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
