import { Link } from "react-router";
import {
  BookOpen,
  Code2,
  Trophy,
  Sparkles,
  ArrowRight,
  Target,
  Zap,
  GraduationCap,
  TrendingUp,
  Search,
  Database,
  Rss,
  CalendarClock,
  Wand2,
  Brain,
  FileText,
  PenTool,
} from "lucide-react";

function App() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-white text-zinc-900 font-sans">
      {/* Hero Section */}
      <div className="relative border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-24">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 bg-white text-zinc-600 text-xs font-bold uppercase tracking-widest mb-8">
              <Zap className="h-3 w-3" />
              AI-Powered Learning Platform
            </div>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-zinc-900 mb-8 tracking-tighter leading-[0.9]">
              Learn Smarter
              <br />
              <span className="text-zinc-500">With AI</span>
            </h1>
            <p className="text-xl md:text-2xl text-zinc-500 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
              Interactive lessons, coding challenges, and intelligent
              personalization — powered by AI agents that adapt to how you
              learn.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                to="/sys-lessons"
                className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-900 hover:bg-zinc-800 
                         text-white font-medium rounded-sm transition-all transform hover:-translate-y-0.5"
              >
                <GraduationCap className="h-5 w-5" />
                Start Learning
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/coding"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white border border-zinc-200
                         text-zinc-900 font-medium rounded-sm hover:bg-zinc-50 hover:border-zinc-300 transition-all"
              >
                <Code2 className="h-5 w-5" />
                Practice Coding
              </Link>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center justify-center gap-12 flex-wrap text-center border-t border-zinc-100 pt-12">
            <div>
              <div className="text-3xl font-black text-zinc-900 tracking-tight">
                Multi-Agent
              </div>
              <div className="text-sm text-zinc-500 font-bold uppercase tracking-wider mt-1">
                AI System
              </div>
            </div>
            <div className="h-8 w-px bg-zinc-200 hidden sm:block" />
            <div>
              <div className="text-3xl font-black text-zinc-900 tracking-tight">
                Real-time
              </div>
              <div className="text-sm text-zinc-500 font-bold uppercase tracking-wider mt-1">
                Code Execution
              </div>
            </div>
            <div className="h-8 w-px bg-zinc-200 hidden sm:block" />
            <div>
              <div className="text-3xl font-black text-zinc-900 tracking-tight">
                Personalized
              </div>
              <div className="text-sm text-zinc-500 font-bold uppercase tracking-wider mt-1">
                Learning Path
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Core Features Section */}
      <div className="max-w-6xl mx-auto px-6 py-24 border-b border-zinc-200">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-zinc-900 mb-6 tracking-tight">
            Learn, Practice, Improve
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto text-lg">
            Core learning experiences designed to help you master new skills
            effectively.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* AI Lessons */}
          <Link
            to="/sys-lessons"
            className="group relative p-8 rounded-sm bg-white border border-zinc-200
                     hover:border-zinc-900 transition-all hover:shadow-xl hover:-translate-y-1"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-sm bg-zinc-100 flex items-center justify-center mb-6 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                <Sparkles className="h-6 w-6 text-zinc-900 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">
                AI Lessons
              </h3>
              <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
                Comprehensive lessons with rich content and diagrams, generated
                daily by our AI pipeline from trending topics.
              </p>
              <span className="inline-flex items-center gap-2 text-zinc-900 text-sm font-bold uppercase tracking-wider group-hover:gap-3 transition-all">
                Browse lessons <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>

          {/* Coding Problems */}
          <Link
            to="/coding"
            className="group relative p-8 rounded-sm bg-white border border-zinc-200
                     hover:border-zinc-900 transition-all hover:shadow-xl hover:-translate-y-1"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-sm bg-zinc-100 flex items-center justify-center mb-6 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                <Code2 className="h-6 w-6 text-zinc-900 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">
                Coding Challenges
              </h3>
              <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
                Algorithmic problems with real-time code execution. Submit
                solutions and get instant feedback.
              </p>
              <span className="inline-flex items-center gap-2 text-zinc-900 text-sm font-bold uppercase tracking-wider group-hover:gap-3 transition-all">
                Start coding <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>

          {/* Quiz Corpus */}
          <Link
            to="/corpus"
            className="group relative p-8 rounded-sm bg-white border border-zinc-200
                     hover:border-zinc-900 transition-all hover:shadow-xl hover:-translate-y-1"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-sm bg-zinc-100 flex items-center justify-center mb-6 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                <Brain className="h-6 w-6 text-zinc-900 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">
                Question Corpus
              </h3>
              <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
                Community quiz questions with MCQs and descriptive answers. Test
                your knowledge across topics.
              </p>
              <span className="inline-flex items-center gap-2 text-zinc-900 text-sm font-bold uppercase tracking-wider group-hover:gap-3 transition-all">
                Take quizzes <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Content Blocks & Creator Tools */}
      <div className="bg-zinc-50 border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-zinc-900 mb-6 tracking-tight">
              Creator Tools
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto text-lg">
              Build your own learning materials with our powerful editor tools.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Content Blocks */}
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

            {/* Diagrams */}
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
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Diagrams</h3>
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

            {/* Lessons */}
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
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Lessons</h3>
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
        </div>
      </div>

      {/* AI Personalization Section */}
      <div className="max-w-6xl mx-auto px-6 py-24 border-b border-zinc-200">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 bg-white text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">
            <Sparkles className="h-3 w-3" />
            AI-Powered
          </div>
          <h2 className="text-3xl font-black text-zinc-900 mb-6 tracking-tight">
            Personalized Learning
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto text-lg">
            Our AI analyzes your performance and creates custom challenges
            targeting your specific areas for improvement.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Personalized Questions */}
          <Link
            to="/personalized-questions"
            className="group p-8 rounded-sm bg-white border border-zinc-200 
                     hover:border-zinc-900 hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-sm bg-zinc-100 flex items-center justify-center mb-6 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
              <Target className="h-6 w-6 text-zinc-900 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-3">
              Personalized Quizzes
            </h3>
            <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
              AI analyzes your answers and generates tailored questions that
              target your weak areas.
            </p>
            <span className="inline-flex items-center gap-2 text-zinc-900 text-sm font-bold uppercase tracking-wider group-hover:gap-3 transition-all">
              Get personalized <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          {/* Personalized Coding */}
          <Link
            to="/personalized-coding"
            className="group p-8 rounded-sm bg-white border border-zinc-200 
                     hover:border-zinc-900 hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-sm bg-zinc-100 flex items-center justify-center mb-6 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
              <TrendingUp className="h-6 w-6 text-zinc-900 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-3">
              Adaptive Coding
            </h3>
            <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
              Based on your submission history, AI creates coding problems at
              the right difficulty level.
            </p>
            <span className="inline-flex items-center gap-2 text-zinc-900 text-sm font-bold uppercase tracking-wider group-hover:gap-3 transition-all">
              Level up <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          {/* Leaderboard */}
          <Link
            to="/leaderboard"
            className="group p-8 rounded-sm bg-white border border-zinc-200 
                     hover:border-zinc-900 hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-sm bg-zinc-100 flex items-center justify-center mb-6 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
              <Trophy className="h-6 w-6 text-zinc-900 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-3">
              Leaderboard
            </h3>
            <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
              Compete with others and track your progress. Earn points for
              correct answers.
            </p>
            <span className="inline-flex items-center gap-2 text-zinc-900 text-sm font-bold uppercase tracking-wider group-hover:gap-3 transition-all">
              View rankings <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </div>

      {/* AI Pipeline Section */}
      <div className="bg-zinc-50 border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 bg-white text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">
              <Zap className="h-3 w-3" />
              Behind the Scenes
            </div>
            <h2 className="text-3xl font-black text-zinc-900 mb-6 tracking-tight">
              AI Content Pipeline
            </h2>
            <p className="text-zinc-500 max-w-2xl mx-auto text-lg">
              Our multi-agent system continuously researches, indexes, and
              generates fresh educational content automatically.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Web Researcher */}
            <div className="p-6 rounded-sm bg-white border border-zinc-200 shadow-sm">
              <div className="w-10 h-10 rounded-sm bg-zinc-100 flex items-center justify-center mb-4">
                <Search className="h-5 w-5 text-zinc-900" />
              </div>
              <h4 className="font-bold text-zinc-900 mb-2">Web Researcher</h4>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                AI agent searches the web for trending topics and creates
                concise summaries using Tavily.
              </p>
            </div>

            {/* RAG Agent */}
            <div className="p-6 rounded-sm bg-white border border-zinc-200 shadow-sm">
              <div className="w-10 h-10 rounded-sm bg-zinc-100 flex items-center justify-center mb-4">
                <Database className="h-5 w-5 text-zinc-900" />
              </div>
              <h4 className="font-bold text-zinc-900 mb-2">RAG Agent</h4>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                Retrieval-augmented generation from our vector knowledge base
                with MongoDB Atlas embeddings.
              </p>
            </div>

            {/* RSS Summarizer */}
            <div className="p-6 rounded-sm bg-white border border-zinc-200 shadow-sm">
              <div className="w-10 h-10 rounded-sm bg-zinc-100 flex items-center justify-center mb-4">
                <Rss className="h-5 w-5 text-zinc-900" />
              </div>
              <h4 className="font-bold text-zinc-900 mb-2">RSS Summarizer</h4>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                Fetches and summarizes RSS feeds from tech blogs and news
                sources automatically.
              </p>
            </div>

            {/* Daily Lesson Pipeline */}
            <div className="p-6 rounded-sm bg-white border border-zinc-200 shadow-sm">
              <div className="w-10 h-10 rounded-sm bg-zinc-100 flex items-center justify-center mb-4">
                <CalendarClock className="h-5 w-5 text-zinc-900" />
              </div>
              <h4 className="font-bold text-zinc-900 mb-2">Daily Lessons</h4>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                Combines all summaries to generate lesson titles and creates
                full lessons with diagrams.
              </p>
            </div>
          </div>

          {/* On-demand AI generation */}
          <div className="mt-8 p-8 rounded-sm bg-white border border-zinc-200 shadow-sm">
            <div className="flex items-start gap-8 flex-col md:flex-row">
              <div className="w-16 h-16 rounded-sm bg-zinc-100 flex items-center justify-center shrink-0">
                <Wand2 className="h-8 w-8 text-zinc-900" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-zinc-900 mb-3">
                  On-Demand AI Diagram Generation
                </h3>
                <p className="text-zinc-500 text-sm mb-6 leading-relaxed max-w-2xl">
                  Describe what you want to visualize and our AI generates
                  interactive Excalidraw diagrams using Mermaid syntax. Perfect
                  for system architectures, flowcharts, and process diagrams.
                </p>
                <Link
                  to="/create/diagram"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-zinc-200
                           text-zinc-900 text-sm font-bold uppercase tracking-wider rounded-sm hover:bg-zinc-50 hover:border-zinc-300 transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  Try AI Diagrams
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-2xl font-black text-zinc-900 mb-16 uppercase tracking-widest">
            How Personalization Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-sm bg-zinc-900 text-white text-2xl font-bold flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                  1
                </div>
              </div>
              <h4 className="font-bold text-zinc-900 mb-3">Practice</h4>
              <p className="text-sm text-zinc-500 font-medium">
                Answer quiz questions or solve coding problems
              </p>
            </div>
            <div className="text-center group">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-sm bg-white border-2 border-zinc-900 text-zinc-900 text-2xl font-bold flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                  2
                </div>
              </div>
              <h4 className="font-bold text-zinc-900 mb-3">AI Analysis</h4>
              <p className="text-sm text-zinc-500 font-medium">
                Your responses are analyzed to identify patterns
              </p>
            </div>
            <div className="text-center group">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-sm bg-zinc-900 text-white text-2xl font-bold flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                  3
                </div>
              </div>
              <h4 className="font-bold text-zinc-900 mb-3">Generation</h4>
              <p className="text-sm text-zinc-500 font-medium">
                New problems are created targeting your weak areas
              </p>
            </div>
            <div className="text-center group">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-sm bg-white border-2 border-zinc-900 text-zinc-900 text-2xl font-bold flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                  4
                </div>
              </div>
              <h4 className="font-bold text-zinc-900 mb-3">Improve</h4>
              <p className="text-sm text-zinc-500 font-medium">
                Focus on what matters most for your growth
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-zinc-900 text-white border-t border-zinc-200">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <h2 className="text-4xl font-black text-white mb-6 tracking-tight">
            Ready to start learning?
          </h2>
          <p className="text-zinc-400 mb-10 max-w-lg mx-auto text-lg font-light">
            Jump into AI-generated lessons or challenge yourself with coding
            problems. Your personalized learning journey starts now.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/sys-lessons"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-zinc-900 font-bold rounded-sm hover:bg-zinc-200 transition-all uppercase tracking-wider"
            >
              <Sparkles className="h-5 w-5" />
              Explore AI Lessons
            </Link>
            <Link
              to="/coding"
              className="inline-flex items-center gap-2 px-8 py-4 bg-transparent border border-zinc-700
                       text-white font-bold rounded-sm hover:bg-zinc-800 hover:border-zinc-600 transition-all uppercase tracking-wider"
            >
              <Code2 className="h-5 w-5" />
              Start Coding
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
