import { useState, useRef, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate } from "react-router";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Code2,
  Save,
  Loader2,
} from "lucide-react";
import { Link } from "react-router";
import RichTextEditor, {
  type RichTextEditorRef,
} from "@/components/editor/rich-text-editor";
import { JUDGE0_LANGUAGES } from "@/components/coding/language-constants";

type Difficulty = "easy" | "medium" | "hard";
type Visibility = "public" | "hidden";

interface TestCase {
  id: string;
  visibility: Visibility;
  name: string;
  stdin: string;
  expectedStdout: string;
}

interface OutputComparison {
  trimOutputs: boolean;
  normalizeWhitespace: boolean;
  caseSensitive: boolean;
}

export default function CreateCodingQuestionPage() {
  const navigate = useNavigate();
  const currentUser = useQuery(api.queries.user.getCurrentUser);
  const createQuestion = useMutation(
    api.mutations.codingQuestions.createCodingQuestion
  );

  // Rich text editor ref
  const editorRef = useRef<RichTextEditorRef>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [tags, setTags] = useState("");
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(2);
  const [memoryLimitMb, setMemoryLimitMb] = useState(256);
  const [selectedLanguageIds, setSelectedLanguageIds] = useState<number[]>([
    71, 63, 74,
  ]); // Python 3, JS, TS
  const [defaultLanguageId, setDefaultLanguageId] = useState<number>(71);

  // Output comparison settings
  const [outputComparison, setOutputComparison] = useState<OutputComparison>({
    trimOutputs: true,
    normalizeWhitespace: false,
    caseSensitive: true,
  });

  // Test cases
  const [testCases, setTestCases] = useState<TestCase[]>([
    {
      id: crypto.randomUUID(),
      visibility: "public",
      name: "Sample 1",
      stdin: "",
      expectedStdout: "",
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add test case
  const addTestCase = useCallback((visibility: Visibility) => {
    setTestCases((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        visibility,
        name: visibility === "public" ? `Sample ${prev.length + 1}` : "",
        stdin: "",
        expectedStdout: "",
      },
    ]);
  }, []);

  // Remove test case
  const removeTestCase = useCallback((id: string) => {
    setTestCases((prev) => prev.filter((tc) => tc.id !== id));
  }, []);

  // Update test case
  const updateTestCase = useCallback(
    (id: string, updates: Partial<TestCase>) => {
      setTestCases((prev) =>
        prev.map((tc) => (tc.id === id ? { ...tc, ...updates } : tc))
      );
    },
    []
  );

  // Toggle language selection
  const toggleLanguage = useCallback((langId: number) => {
    setSelectedLanguageIds((prev) => {
      if (prev.includes(langId)) {
        // Don't allow removing all languages
        if (prev.length <= 1) return prev;
        return prev.filter((id) => id !== langId);
      }
      return [...prev, langId];
    });
  }, []);

  // Handle submission
  const handleSubmit = async () => {
    if (!currentUser) {
      toast.error("Please sign in to create a question");
      return;
    }

    // Validation
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    const promptRichText = editorRef.current?.getJSON();
    if (!promptRichText) {
      toast.error("Please add problem description");
      return;
    }

    const publicTestCases = testCases.filter(
      (tc) => tc.visibility === "public"
    );
    if (publicTestCases.length === 0) {
      toast.error("At least one public test case is required");
      return;
    }

    // Ensure default language is in selected
    if (!selectedLanguageIds.includes(defaultLanguageId)) {
      toast.error("Default language must be in selected languages");
      return;
    }

    setIsSubmitting(true);
    try {
      const questionId = await createQuestion({
        title: title.trim(),
        promptRichText: JSON.stringify(promptRichText),
        difficulty,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
        languageIdsAllowed: selectedLanguageIds,
        defaultLanguageId,
        timeLimitSeconds,
        memoryLimitMb,
        outputComparison,
        testCases: testCases.map((tc) => ({
          visibility: tc.visibility,
          stdin: tc.stdin,
          expectedStdout: tc.expectedStdout,
          name: tc.name || undefined,
        })),
      });

      toast.success("Coding question created!");
      navigate(`/coding/${questionId}/solve`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create question";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const publicCount = testCases.filter(
    (tc) => tc.visibility === "public"
  ).length;
  const hiddenCount = testCases.filter(
    (tc) => tc.visibility === "hidden"
  ).length;

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/coding"
            className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Problems
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-900 rounded-lg">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                Create Coding Problem
              </h1>
              <p className="text-zinc-500 mt-1">
                Add a new coding challenge with test cases
              </p>
            </div>
          </div>
        </div>

        {/* Basic Info Section */}
        <div className="mb-8 p-6 bg-zinc-50 rounded-xl border border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <Label
                htmlFor="title"
                className="text-sm font-medium text-zinc-700"
              >
                Title *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Two Sum"
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-zinc-700">
                  Difficulty *
                </Label>
                <div className="flex gap-2 mt-1.5">
                  {(["easy", "medium", "hard"] as const).map((d) => (
                    <Button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      variant={difficulty === d ? "default" : "outline"}
                      size="sm"
                      className={
                        difficulty === d
                          ? d === "easy"
                            ? "bg-green-600 hover:bg-green-700"
                            : d === "medium"
                            ? "bg-yellow-600 hover:bg-yellow-700"
                            : "bg-red-600 hover:bg-red-700"
                          : ""
                      }
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label
                  htmlFor="tags"
                  className="text-sm font-medium text-zinc-700"
                >
                  Tags (comma-separated)
                </Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="arrays, hash-table, two-pointers"
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Languages Section */}
        <div className="mb-8 p-6 bg-zinc-50 rounded-xl border border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Languages
          </h2>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-zinc-700 mb-2 block">
                Allowed Languages
              </Label>
              <div className="flex flex-wrap gap-2">
                {JUDGE0_LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => toggleLanguage(lang.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      selectedLanguageIds.includes(lang.id)
                        ? "bg-zinc-900 text-white border-zinc-900"
                        : "bg-white text-zinc-700 border-zinc-300 hover:border-zinc-400"
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-zinc-700">
                Default Language
              </Label>
              <Select
                value={defaultLanguageId.toString()}
                onValueChange={(v) => setDefaultLanguageId(Number(v))}
              >
                <SelectTrigger className="w-48 mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JUDGE0_LANGUAGES.filter((l) =>
                    selectedLanguageIds.includes(l.id)
                  ).map((lang) => (
                    <SelectItem key={lang.id} value={lang.id.toString()}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Limits & Judging Section */}
        <div className="mb-8 p-6 bg-zinc-50 rounded-xl border border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Limits & Judging
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 max-w-xs">
              <div>
                <Label className="text-sm font-medium text-zinc-700">
                  Time Limit (s)
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={timeLimitSeconds}
                  onChange={(e) => setTimeLimitSeconds(Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-zinc-700">
                  Memory (MB)
                </Label>
                <Input
                  type="number"
                  min={16}
                  max={512}
                  value={memoryLimitMb}
                  onChange={(e) => setMemoryLimitMb(Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-zinc-700 mb-2 block">
                Output Comparison
              </Label>
              <div className="space-y-2">
                {[
                  {
                    key: "trimOutputs" as const,
                    label: "Trim whitespace from ends",
                  },
                  {
                    key: "normalizeWhitespace" as const,
                    label: "Normalize internal whitespace",
                  },
                  { key: "caseSensitive" as const, label: "Case sensitive" },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={outputComparison[key]}
                      onChange={(e) =>
                        setOutputComparison((prev) => ({
                          ...prev,
                          [key]: e.target.checked,
                        }))
                      }
                      className="rounded border-zinc-300"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Problem Statement Section */}
        <div className="mb-8 p-6 bg-zinc-50 rounded-xl border border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Problem Statement *
          </h2>
          <RichTextEditor
            ref={editorRef}
            isEditable={true}
            minHeight="250px"
            maxHeight="400px"
          />
        </div>

        {/* Test Cases Section */}
        <div className="mb-8 p-6 bg-zinc-50 rounded-xl border border-zinc-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Test Cases
              </h2>
              <p className="text-sm text-zinc-500">
                {publicCount} public, {hiddenCount} hidden
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addTestCase("public")}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Public
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addTestCase("hidden")}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Hidden
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {testCases.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                No test cases yet. Add at least one public test case.
              </div>
            ) : (
              testCases.map((tc, index) => (
                <TestCaseEditor
                  key={tc.id}
                  testCase={tc}
                  index={index}
                  onUpdate={(updates) => updateTestCase(tc.id, updates)}
                  onRemove={() => removeTestCase(tc.id)}
                  canRemove={testCases.length > 1}
                />
              ))
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate("/coding")}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !currentUser}
            className="bg-zinc-900 hover:bg-zinc-800 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Problem
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Test Case Editor Component
interface TestCaseEditorProps {
  testCase: TestCase;
  index: number;
  onUpdate: (updates: Partial<TestCase>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function TestCaseEditor({
  testCase,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: TestCaseEditorProps) {
  const isPublic = testCase.visibility === "public";

  return (
    <div
      className={`rounded-lg border p-4 ${
        isPublic
          ? "bg-green-50 border-green-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-zinc-600">
            Test #{index + 1}
          </span>
          <button
            type="button"
            onClick={() =>
              onUpdate({
                visibility: isPublic ? "hidden" : "public",
              })
            }
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              isPublic
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-amber-100 text-amber-700 hover:bg-amber-200"
            }`}
          >
            {isPublic ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3" />
            )}
            {isPublic ? "Public" : "Hidden"}
          </button>
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-8 w-8 p-0 text-zinc-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {isPublic && (
          <div>
            <Label className="text-xs text-zinc-600">Name (optional)</Label>
            <Input
              value={testCase.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="Example 1"
              className="mt-1 h-8 text-sm bg-white"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-zinc-600">Input (stdin)</Label>
            <Textarea
              value={testCase.stdin}
              onChange={(e) => onUpdate({ stdin: e.target.value })}
              placeholder="5&#10;1 2 3 4 5"
              rows={4}
              className="mt-1 text-sm font-mono bg-white resize-none"
            />
          </div>
          <div>
            <Label className="text-xs text-zinc-600">
              Expected Output (stdout)
            </Label>
            <Textarea
              value={testCase.expectedStdout}
              onChange={(e) => onUpdate({ expectedStdout: e.target.value })}
              placeholder="15"
              rows={4}
              className="mt-1 text-sm font-mono bg-white resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
