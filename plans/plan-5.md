# Plan 5 — Client: Monaco editor, coding question authoring, and solve UI

## Goal
Add the client-facing UI needed to:

- Create coding questions (admin/creator flow) using the existing rich text editor for prompt + a testcase editor UI.
- Solve coding questions with Monaco editor, language picker, run/submit actions.
- View submission results (passed/failed + first failure).

This stage assumes schema + endpoints exist from plans 2–4.

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

### 3) Coding question solve page
Add a route/page like `app/src/pages/coding-question-view.tsx` (or extend existing question view):

UI sections:
- Prompt (render rich text)
- Public sample testcases display (read-only)
- Monaco editor:
  - language picker mapped to Judge0 `languageId`
  - load `starterCode` for selected language (if present)
- Buttons:
  - **Run (public tests)**: optional shortcut that runs only public tests via code-exec `/v1/judge` with public tests returned by query (safe)
  - **Submit (all tests)**: calls plan-4 flow (`createCodingSubmission` then `/v1/judge-question`)
- Results panel:
  - Overall status
  - If failed: show first failure index, stdin, actual stdout, stderr/compile output
  - For hidden tests: avoid showing `expectedStdout` if you want Codeforces-like behavior

### 4) Submission history
On the solve page or a separate tab:
- list submissions for this question (latest first)
- click to view details

---

## Verification checklist (stage 5)
1) Create coding question in UI with both public + hidden testcases.
2) Visit solve page:
- Prompt renders
- Monaco loads
- Public testcases shown
3) Run public tests:
- correct code passes
- wrong code shows mismatch
4) Submit:
- submission created and status updates to passed/failed
5) Confirm hidden expected outputs are not shown (if you chose to hide them).

---

## Out of scope (explicitly not in this stage)
- Advanced code templates per language (beyond starter code).
- Collaborative editing.
- Code formatting/linting.


