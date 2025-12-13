# Plan 5 — Client: Monaco editor, coding question authoring, and enhanced solve UI

## Goal

Add the polished client-facing UI needed to:

- Create coding questions (admin/creator flow) using the existing rich text editor for prompt + a testcase editor UI.
- **Upgrade** solve page with Monaco editor, language picker, run/submit actions.
- Enhanced submission results display.

This stage assumes:

- Schema + endpoints exist from plans 2–4
- Basic submission flow working from Plan 4.5 (submission hook, status component, simple solve page)

> **Architecture reference**: See `plans/feature-code-execution.md` for high-level architecture details.

---

## Deliverables

### 1) Install and wrap Monaco editor

In `app/` (Vite React):

- Add `@monaco-editor/react` (recommended wrapper).
- Create a reusable component in `app/src/components/editor/monaco-editor.tsx`:
  - props: `value`, `onChange`, `language`, `height`, `readOnly`
  - optional: `theme` (light/dark)

### 2) Coding question creation page

Add or extend an existing page (suggest: `app/src/pages/create-question.tsx` or a new `create-coding-question.tsx`):

UI sections:

- **Metadata**: title, allowed languages, default language, time/memory limits
- **Judging / comparison rules** (stored on the question, not per-run):
  - trim outputs (on/off)
  - normalize whitespace (on/off)
  - case sensitive (on/off)
- **Prompt**: reuse existing rich text editor component (`app/src/components/editor/rich-text-editor.tsx`)
- **Testcases**:
  - Public testcases list editor: add/remove rows, fields: name, stdin, expectedStdout, order
  - Hidden testcases list editor: same UI but marked “hidden”
  - Validation: at least 1 public testcase, at least 1 hidden testcase (optional but recommended)
- **Save**: calls `createCodingQuestion` mutation

### 3) Coding question solve page (upgrade from Plan 4.5)

Upgrade `app/src/pages/coding-solve.tsx` created in Plan 4.5:

UI sections:

- Prompt (render rich text)
- Public sample testcases display (read-only)
- **Replace textarea with Monaco editor**:
  - language picker mapped to Judge0 `languageId`
  - load `starterCode` for selected language (if present)
  - syntax highlighting, auto-complete
- Buttons:
  - **Run (public tests)**: optional shortcut that runs only public tests via code-exec `/v1/judge` with public tests returned by query (safe)
  - **Submit (all tests)**: uses existing `useCodingSubmission` hook from Plan 4.5
- Results panel (upgrade existing `SubmissionStatus` component):
  - Overall status with better styling
  - If failed: show first failure index, stdin, actual stdout, stderr/compile output
  - Syntax highlighting for code output
  - For hidden tests: avoid showing `expectedStdout` if you want Codeforces-like behavior

### 4) Submission history (upgrade from Plan 4.5)

Upgrade existing `SubmissionHistory` component:

- Better styling and layout
- Expandable submission details
- Code diff view (optional)
- Filter by status

---

## Verification checklist (stage 5)

1. Create coding question in UI with both public + hidden testcases.
2. Visit solve page:

- Prompt renders
- Monaco loads
- Public testcases shown

3. Run public tests:

- correct code passes
- wrong code shows mismatch

4. Submit:

- submission created and status updates to passed/failed

5. Confirm hidden expected outputs are not shown (if you chose to hide them).

---

## Out of scope (explicitly not in this stage)

- Advanced code templates per language (beyond starter code).
- Collaborative editing.
- Code formatting/linting.
