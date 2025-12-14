import { useRef, useCallback, useEffect, useState } from "react";
import Editor, { type OnMount, type Monaco } from "@monaco-editor/react";
import type * as MonacoEditor from "monaco-editor";
import { Loader2 } from "lucide-react";

// Catppuccin Mocha color palette
const catppuccinMocha = {
  base: "#1e1e2e",
  mantle: "#181825",
  crust: "#11111b",
  text: "#cdd6f4",
  subtext1: "#bac2de",
  subtext0: "#a6adc8",
  overlay2: "#9399b2",
  overlay1: "#7f849c",
  overlay0: "#6c7086",
  surface2: "#585b70",
  surface1: "#45475a",
  surface0: "#313244",
  blue: "#89b4fa",
  lavender: "#b4befe",
  sapphire: "#74c7ec",
  sky: "#89dceb",
  teal: "#94e2d5",
  green: "#a6e3a1",
  yellow: "#f9e2af",
  peach: "#fab387",
  maroon: "#eba0ac",
  red: "#f38ba8",
  mauve: "#cba6f7",
  pink: "#f5c2e7",
  flamingo: "#f2cdcd",
  rosewater: "#f5e0dc",
};

// Define Catppuccin Mocha theme for Monaco
function defineCatppuccinTheme(monaco: Monaco) {
  monaco.editor.defineTheme("catppuccin-mocha", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: catppuccinMocha.text.slice(1) },
      {
        token: "comment",
        foreground: catppuccinMocha.overlay0.slice(1),
        fontStyle: "italic",
      },
      { token: "keyword", foreground: catppuccinMocha.mauve.slice(1) },
      { token: "keyword.control", foreground: catppuccinMocha.mauve.slice(1) },
      { token: "keyword.operator", foreground: catppuccinMocha.sky.slice(1) },
      { token: "string", foreground: catppuccinMocha.green.slice(1) },
      { token: "string.escape", foreground: catppuccinMocha.pink.slice(1) },
      { token: "number", foreground: catppuccinMocha.peach.slice(1) },
      { token: "constant", foreground: catppuccinMocha.peach.slice(1) },
      {
        token: "constant.language",
        foreground: catppuccinMocha.lavender.slice(1),
      },
      { token: "variable", foreground: catppuccinMocha.text.slice(1) },
      {
        token: "variable.predefined",
        foreground: catppuccinMocha.red.slice(1),
      },
      {
        token: "variable.parameter",
        foreground: catppuccinMocha.maroon.slice(1),
      },
      { token: "function", foreground: catppuccinMocha.blue.slice(1) },
      {
        token: "function.declaration",
        foreground: catppuccinMocha.blue.slice(1),
      },
      { token: "type", foreground: catppuccinMocha.yellow.slice(1) },
      { token: "type.identifier", foreground: catppuccinMocha.yellow.slice(1) },
      { token: "class", foreground: catppuccinMocha.yellow.slice(1) },
      { token: "interface", foreground: catppuccinMocha.yellow.slice(1) },
      { token: "struct", foreground: catppuccinMocha.yellow.slice(1) },
      { token: "operator", foreground: catppuccinMocha.sky.slice(1) },
      { token: "delimiter", foreground: catppuccinMocha.overlay2.slice(1) },
      {
        token: "delimiter.bracket",
        foreground: catppuccinMocha.overlay2.slice(1),
      },
      { token: "tag", foreground: catppuccinMocha.mauve.slice(1) },
      { token: "attribute.name", foreground: catppuccinMocha.blue.slice(1) },
      { token: "attribute.value", foreground: catppuccinMocha.green.slice(1) },
      { token: "regexp", foreground: catppuccinMocha.pink.slice(1) },
      { token: "annotation", foreground: catppuccinMocha.yellow.slice(1) },
      { token: "invalid", foreground: catppuccinMocha.red.slice(1) },
    ],
    colors: {
      "editor.background": catppuccinMocha.base,
      "editor.foreground": catppuccinMocha.text,
      "editorLineNumber.foreground": catppuccinMocha.surface1,
      "editorLineNumber.activeForeground": catppuccinMocha.lavender,
      "editorCursor.foreground": catppuccinMocha.rosewater,
      "editor.selectionBackground": catppuccinMocha.surface2 + "80",
      "editor.selectionHighlightBackground": catppuccinMocha.surface1 + "60",
      "editor.wordHighlightBackground": catppuccinMocha.surface1 + "60",
      "editor.lineHighlightBackground": catppuccinMocha.surface0 + "40",
      "editorIndentGuide.background1": catppuccinMocha.surface0,
      "editorIndentGuide.activeBackground1": catppuccinMocha.surface2,
      "editorBracketMatch.background": catppuccinMocha.surface2 + "60",
      "editorBracketMatch.border": catppuccinMocha.lavender,
      "scrollbarSlider.background": catppuccinMocha.surface0 + "80",
      "scrollbarSlider.hoverBackground": catppuccinMocha.surface1,
      "scrollbarSlider.activeBackground": catppuccinMocha.surface2,
      "editorWidget.background": catppuccinMocha.mantle,
      "editorWidget.border": catppuccinMocha.surface0,
      "editorSuggestWidget.background": catppuccinMocha.mantle,
      "editorSuggestWidget.border": catppuccinMocha.surface0,
      "editorSuggestWidget.selectedBackground": catppuccinMocha.surface0,
      "editorHoverWidget.background": catppuccinMocha.mantle,
      "editorHoverWidget.border": catppuccinMocha.surface0,
    },
  });
}

export interface MonacoEditorProps {
  /** Current editor value */
  value: string;
  /** Callback when value changes */
  onChange?: (value: string) => void;
  /** Monaco language ID (e.g., 'python', 'javascript', 'typescript') */
  language?: string;
  /** Editor height (CSS value) */
  height?: string;
  /** Read-only mode */
  readOnly?: boolean;
  /** Editor theme: 'vs' (light), 'vs-dark' (dark), 'catppuccin-mocha' */
  theme?: "vs" | "vs-dark" | "catppuccin-mocha";
  /** Additional CSS class */
  className?: string;
  /** Placeholder text when empty */
  placeholder?: string;
}

export function MonacoCodeEditor({
  value,
  onChange,
  language = "javascript",
  height = "400px",
  readOnly = false,
  theme = "catppuccin-mocha",
  className = "",
  placeholder,
}: MonacoEditorProps) {
  const editorRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(
    null
  );
  const monacoRef = useRef<Monaco | null>(null);
  const [themeReady, setThemeReady] = useState(theme !== "catppuccin-mocha");

  const handleEditorWillMount = useCallback((monaco: Monaco) => {
    // Define custom themes before editor mounts
    defineCatppuccinTheme(monaco);
    setThemeReady(true);
  }, []);

  const handleEditorDidMount: OnMount = useCallback(
    (editor, monacoInstance) => {
      editorRef.current = editor;
      monacoRef.current = monacoInstance;

      // Focus the editor
      editor.focus();
    },
    []
  );

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      if (onChange && newValue !== undefined) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  // Update editor options when readOnly changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly });
    }
  }, [readOnly]);

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={handleChange}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
        theme={themeReady ? theme : "vs-dark"}
        loading={
          <div className="flex items-center justify-center h-full bg-zinc-900 text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading editor...
          </div>
        }
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          padding: { top: 12, bottom: 12 },
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
          suggest: {
            showKeywords: true,
            showSnippets: true,
          },
          quickSuggestions: true,
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
        }}
      />
      {/* Placeholder overlay when empty */}
      {placeholder && !value && (
        <div className="absolute top-3 left-16 text-zinc-500 pointer-events-none text-sm font-mono">
          {placeholder}
        </div>
      )}
    </div>
  );
}

export default MonacoCodeEditor;
