# Dev-Iterate

Dev-Iterate is an **AI-powered learning platform** that continuously generates fresh lessons (rich text + diagrams), delivers **coding challenges with real-time judging**, and adapts the learning path using **decision-making AI workflows**.

At its core, this repo is a **Convex ↔ Kestra** system:
- **Convex** is the realtime database + API that powers the product UI.
- **Kestra** is the orchestration brain for long-running pipelines: multi-agent research, summarization, lesson generation, RAG indexing, and personalization.

---

### What it does (from the home page)

The landing experience (“AI-Powered Learning Platform”) highlights four pillars:
- **AI lessons**: lessons + diagrams generated automatically from trending topics.
- **Coding challenges**: solve problems with **real-time code execution** and instant feedback.
- **Question corpus**: community quiz questions (MCQ + descriptive).
- **Personalized learning**: AI analyzes your quiz answers + coding submissions, then generates targeted practice.

It also calls out the “Behind the Scenes” pipeline: **Web Research**, **RAG Agent**, **RSS Summarizer**, and **Daily Lessons**, plus **on-demand AI diagram generation**.

---

### Architecture overview

#### Core components

- **`app/` (web + Convex)**
  - React/Vite UI and a full Convex backend (`app/convex`) for data, auth, and realtime client updates.
- **`kestra/flows/` (orchestration)**
  - Kestra flows implement the long-running AI pipelines and fan-out/fan-in workflows.
- **`code-execution/` (judge runner gateway)**
  - A Node/Express service that fetches testcases from Convex, runs code against a Judge0 instance, and posts results back to Convex.
- **External systems**
  - **LLM providers** via OpenRouter (multiple models used across flows).
  - **Tavily** web search for research summarization.
  - **MongoDB Atlas Vector Search** for RAG ingestion + retrieval.
  - **Postgres** for Kestra’s internal repository/queue/storage metadata.
  - **Self-hosted Judge0** for compiling/running code at scale.

#### Convex → Kestra (triggering flows)

When we need orchestration (AI-heavy, slow, or multi-step), Convex triggers Kestra using a **Convex action** (often an `internalAction`). The standard webhook trigger pattern is:

```text
POST {KESTRA_BASE_URL}/api/v1/executions/webhook/{namespace}/{flowId}/{WEBHOOK_TRIGGER_KEY}
Authorization: Basic {KESTRA_BASIC_AUTH_ENCODED}
Content-Type: application/json
```

In practice:
- Convex actions in `app/convex/actionsdir/*` build the webhook request, attach Basic Auth, and send a JSON payload.
- Triggers are often used as fire-and-forget, so the UI stays fast and Convex keeps doing what it’s best at: validation + persistence + realtime updates.

#### Kestra → Convex (callbacks)

After processing, Kestra flows POST results back to **Convex HTTP endpoints** (see `app/convex/http.ts`). Convex stores the results; clients see updates instantly via Convex realtime subscriptions.

Key callback endpoints include:
- **Lessons pipeline**: `/sys-lesson`, `/sys-lesson-content/pending`, `/sys-lesson-content`, `/sys-lesson-diagram/pending`, `/sys-lesson-diagram`
- **Topic research**: `/topics`, `/topic-research-summary`
- **RSS summaries**: `/feed`
- **Personalization**: `/personalized-questions`, `/personalized-coding-questions`
- **Weakness/remark updates**: `/user-weakness`, `/coding-user-weakness`
- **Judging integration**: `/coding/testcases`, `/coding/submission-running`, `/coding/submission-result` and personalized equivalents

#### Code execution + Judge0

`code-execution/` exposes a queue-style API (`POST /v1/judge-question`) that:
1. Marks a submission as “running” in Convex (HTTP action).
2. Fetches **public + hidden testcases** from Convex (HTTP action).
3. Executes code via **Judge0** (self-hosted).
4. Posts pass/fail results back to Convex (HTTP action).

This keeps the core product responsive while handling compilation/runtime work off the main app path.

---

### Kestra, in depth (flows, subflows, agents, and decision-making)

Kestra is the “control plane” for Dev-Iterate’s AI system. The flows are intentionally modular: **webhooks start work**, **subflows compose behaviors**, **AI agents make structured decisions**, and Convex acts as the source-of-truth system.

#### Content discovery + research fan-out

- **`topicsextractor.yml`**
  - Pulls trending titles from Hacker News (Node task in a Docker runner).
  - Uses an **AIAgent** to propose **2–4 high-level topics** as valid JSON.
  - Sends topics to Convex via `POST {{ACTIONS_BASE_URL}}/topics`.

- **`topicsiterator.yml`**
  - Webhook-triggered fan-out controller.
  - `ForEach` over `{ topic, topicId }` pairs.
  - Runs two subflows per topic:
    - `websearch_summarizer` (live web research)
    - `topic_rag_summarizer` (knowledge-base retrieval)

- **`webresearch.yml` (flow id: `websearch_summarizer`)**
  - A multi-tool **AIAgent** that uses:
    - `TavilyWebSearch` to fetch sources
    - a nested “writer” agent to produce a concise summary
  - Posts results back to Convex: `POST /topic-research-summary`.

- **`topic_rag_summarizer.yml`**
  - Uses `ai.rag.ChatCompletion` with:
    - **MongoDB Atlas embeddings** (vector search)
    - OpenRouter embedding model (`qwen/qwen3-embedding-4b`)
  - Then summarizes with an AIAgent and POSTs back to `POST /topic-research-summary` (kind: `rag`).

#### RSS ingestion + summarization

- **`rss_summarizer.yml`**
  - Iterates over a KV-configured list of RSS URLs and calls a subflow per feed.

- **`rss_single_summarizer.yml`**
  - Clones the repo and runs `automation-scripts/rssreader.py` to fetch/normalize feed content.
  - Uses an AIAgent to summarize the feed into high-signal sentences.
  - Sends summaries to Convex via `POST /feed`.

#### Daily lesson planning → lesson creation (fan-in + structured generation)

- **`main_summarizer.yml`**
  - Fetches recent summaries from Convex (`GET /summaries`) across multiple sources (RSS + research + RAG).
  - Uses an AIAgent to generate **3–5 lesson titles + descriptions** (strict JSON schema).
  - Starts `create_lessons` as a subflow for actual lesson creation.

- **`create_lessons.yml`**
  - `ForEach` over generated lessons:
    1. Creates a system lesson record in Convex via `POST /sys-lesson`
    2. Runs a “creator” **AIAgent** with **tools** that call Kestra subflows:
       - `rte_sys_creator` (rich-text section generator)
       - `dg_sys_creator` (diagram section generator)
  - The agent is constrained (3–5 sections total, ≤5 tool calls, at least 1 diagram), which makes the pipeline repeatable and debuggable.

- **`rte_sys_creator.yml`**
  - Creates a “pending” content section in Convex (`POST /sys-lesson-content/pending`)
  - Generates TipTap/ProseMirror JSON (rich content) with a strict schema
  - Saves the content to Convex (`POST /sys-lesson-content`)

- **`dg_sys_creator.yml`**
  - Creates a “pending” diagram section in Convex (`POST /sys-lesson-diagram/pending`)
  - Generates Mermaid syntax + title (strict JSON)
  - Saves the diagram to Convex (`POST /sys-lesson-diagram`)

#### Indexing into the knowledge base (RAG ingestion)

- **`content_submission_indexer.yml`**
  - Webhook entrypoint for indexing submitted content (expects a stringified TipTap JSON doc).
  - Delegates to `jsontomdindex`.

- **`jsontomdindex.yml`**
  - Converts TipTap JSON → Markdown using `automation-scripts/contentjsontomd.py`.
  - Ingests the markdown into **MongoDB Atlas Vector Search** via `ai.rag.IngestDocument`.
  - Uses chunking settings (segment size + overlap) to optimize retrieval quality.

#### Personalization & decision logic (branching by learner profile)

- **`personalized_question_generator.yml`**
  - Evaluates learner analysis → produces:
    - **novelty score (1–10)**
    - **learner category** (`advanced` / `needs_support` / `general`)
  - Uses Kestra `If` branching to generate different counts + difficulty mixes.
  - Posts generated questions to Convex via `POST /personalized-questions`.

- **`personalized_coding_question_generator.yml`**
  - Similar branching logic, but produces **coding problems** that include:
    - TipTap rich prompt
    - difficulty/tags
    - **Judge0 language IDs**, time/memory limits, output comparison rules
    - public/hidden testcases
  - Posts to Convex via `POST /personalized-coding-questions`.

- **`user_weakness_analyzer.yml`** and **`coding_user_weakness_analyzer.yml`**
  - Generate short, actionable “coach remarks” from recent performance batches.
  - Post back to Convex (`/user-weakness` and `/coding-user-weakness`) so the UI can show progress guidance.

#### On-demand diagram generation

- **`diagram_generator.yml`**
  - A synchronous “generate a diagram now” flow that returns `{ title, mermaid }`.
  - Convex also exposes an action (`app/convex/actionsdir/diagramGeneration.ts`) that calls Kestra’s execution endpoint with `?wait=true` for interactive UX.

---

### Directory structure (repo tour)

- **`app/`**: the product app
  - **`app/src/`**: React UI (routes/pages, editor UI, coding UI, lesson views)
  - **`app/convex/`**: Convex backend (realtime DB + API)
    - **`actionsdir/`**: outbound integrations (trigger Kestra flows, diagram generation, etc.)
    - **`http.ts` + `httpactions/`**: inbound HTTP endpoints (Kestra callbacks, code-exec callbacks)
    - **`mutations/` + `queries/`**: core data operations used by the UI and workflows
    - **`schema.ts`**: Convex data model

- **`kestra/`**
  - **`kestra/flows/`**: orchestration workflows (AI agents, subflows, research, RAG, lesson generation, personalization)

- **`code-execution/`**
  - Node/Express service that integrates with Judge0 and Convex:
    - fetches testcases from Convex endpoints
    - executes against Judge0
    - posts results back to Convex endpoints

- **`automation-scripts/`**
  - Utility scripts used by Kestra flows (RSS parsing, TipTap JSON → Markdown conversion for indexing).

- **`docker-compose.yml`**
  - Local Kestra + Postgres stack (Kestra server runs with a mounted Docker socket for task runners).

- **`plans/`**
  - Project planning docs / design notes.

---

### Local development (high-level)

Prereqs: **Node 18+**, **pnpm**, and **Docker**.

- **Install workspace deps**
  - `pnpm -w install`

- **Kestra**
  - Start: `docker compose up -d`
  - Flows live in `kestra/flows/*.yml` and are typically triggered via Convex actions → webhook executions.

- **App (UI)**
  - `pnpm --filter app dev`

- **Code execution service**
  - `pnpm --filter code-execution dev`
  - Configure `CONVEX_SITE_URL` so it can reach Convex HTTP actions.
  - Bring up Judge0 using the helper scripts referenced in `code-execution/README.md`.

---

### Notes on configuration (what the flows expect)

Common knobs referenced across flows:
- **`ACTIONS_BASE_URL`** (Kestra secret): base URL for Convex HTTP endpoints (Kestra → Convex callbacks).
- **`WEBHOOK_TRIGGER_KEY`**: Kestra webhook trigger key (Convex → Kestra).
- **`KESTRA_BASIC_AUTH_ENCODED`**: Basic auth header value (Convex → Kestra, and some synchronous executions).
- **`OPENROUTER_API_KEY`**: LLM access for AIAgent + RAG providers.
- **`TAV_API_KEY`**: Tavily web search.
- **MongoDB Atlas KV/secret entries** for RAG ingestion and retrieval (host, db, collection, vector index, credentials).

---

### Where to look next

- **Kestra pipelines**: `kestra/flows/`
- **Convex endpoints used for callbacks**: `app/convex/http.ts`
- **Convex → Kestra triggers**: `app/convex/actionsdir/`
- **Judge integration**: `code-execution/` and Convex endpoints under `/coding/*`


