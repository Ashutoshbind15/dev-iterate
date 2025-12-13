/**
 * Judge0 language definitions.
 * These are the most commonly used languages supported by Judge0.
 * IDs match the default Judge0 language IDs.
 */
export interface Judge0Language {
  id: number;
  name: string;
  monacoId?: string; // Monaco editor language ID for syntax highlighting
}

export const JUDGE0_LANGUAGES: Judge0Language[] = [
  { id: 71, name: "Python 3", monacoId: "python" },
  { id: 70, name: "Python 2", monacoId: "python" },
  { id: 63, name: "JavaScript (Node.js)", monacoId: "javascript" },
  { id: 74, name: "TypeScript", monacoId: "typescript" },
  { id: 62, name: "Java", monacoId: "java" },
  { id: 54, name: "C++ (GCC)", monacoId: "cpp" },
  { id: 52, name: "C++ (Clang)", monacoId: "cpp" },
  { id: 50, name: "C (GCC)", monacoId: "c" },
  { id: 51, name: "C# (Mono)", monacoId: "csharp" },
  { id: 72, name: "Ruby", monacoId: "ruby" },
  { id: 73, name: "Rust", monacoId: "rust" },
  { id: 60, name: "Go", monacoId: "go" },
  { id: 78, name: "Kotlin", monacoId: "kotlin" },
  { id: 68, name: "PHP", monacoId: "php" },
  { id: 83, name: "Swift", monacoId: "swift" },
  { id: 61, name: "Haskell", monacoId: "haskell" },
];

/**
 * Get language by ID
 */
export function getLanguageById(id: number): Judge0Language | undefined {
  return JUDGE0_LANGUAGES.find((lang) => lang.id === id);
}

/**
 * Get language name by ID with fallback
 */
export function getLanguageName(id: number): string {
  return getLanguageById(id)?.name ?? `Language ${id}`;
}


