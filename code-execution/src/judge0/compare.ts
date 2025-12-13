/**
 * Output comparison utilities for judge submissions.
 *
 * Comparison settings can be defined per-question (future) or use service defaults.
 */

export interface CompareOptions {
  /** Trim trailing whitespace from outputs (default: true) */
  trimOutputs?: boolean;
  /** Collapse runs of spaces/tabs to single spaces per line (default: false) */
  normalizeWhitespace?: boolean;
  /** Case-sensitive comparison (default: true) */
  caseSensitive?: boolean;
}

const DEFAULT_OPTIONS: Required<CompareOptions> = {
  trimOutputs: true,
  normalizeWhitespace: false,
  caseSensitive: true,
};

/**
 * Normalize a single line based on options.
 */
function normalizeLine(line: string, opts: Required<CompareOptions>): string {
  let result = line;

  if (opts.normalizeWhitespace) {
    // Collapse runs of spaces/tabs into single space
    result = result.replace(/[ \t]+/g, " ");
  }

  if (!opts.caseSensitive) {
    result = result.toLowerCase();
  }

  return result;
}

/**
 * Normalize entire output based on options.
 */
function normalizeOutput(
  output: string,
  opts: Required<CompareOptions>
): string {
  // Convert CRLF to LF
  let result = output.replace(/\r\n/g, "\n");

  if (opts.trimOutputs) {
    // Trim trailing whitespace from entire output
    result = result.trimEnd();
  }

  // Normalize each line
  const lines = result.split("\n");
  const normalizedLines = lines.map((line) => {
    let normalized = normalizeLine(line, opts);
    if (opts.trimOutputs) {
      // Also trim trailing whitespace per line
      normalized = normalized.trimEnd();
    }
    return normalized;
  });

  return normalizedLines.join("\n");
}

export interface CompareResult {
  match: boolean;
  normalizedExpected: string;
  normalizedActual: string;
}

/**
 * Compare actual output against expected output.
 */
export function compareOutputs(
  actual: string,
  expected: string,
  options?: CompareOptions
): CompareResult {
  const opts: Required<CompareOptions> = { ...DEFAULT_OPTIONS, ...options };

  const normalizedActual = normalizeOutput(actual, opts);
  const normalizedExpected = normalizeOutput(expected, opts);

  return {
    match: normalizedActual === normalizedExpected,
    normalizedExpected,
    normalizedActual,
  };
}
