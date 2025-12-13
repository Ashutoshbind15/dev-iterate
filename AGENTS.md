# AGENTS.md

### Architecture: Convex ↔ Kestra

- **Convex**: realtime DB + API. When a mutation/httpAction updates data, clients see it immediately.
- **Kestra**: orchestration for long-running jobs (AI, automation). Flows live in `kestra/flows/*.yml`.

### Convex → Kestra (triggering flows)

- Pattern: when we need to execute a Kestra webhook trigger, we call a **Convex action** (usually an `internalAction`).
- The action sends a JSON body to Kestra’s webhook execution endpoint:

```text
POST {KESTRA_BASE_URL}/api/v1/executions/webhook/{namespace}/{flowId}/{WEBHOOK_TRIGGER_KEY}
Authorization: Basic {KESTRA_BASIC_AUTH_ENCODED}
Content-Type: application/json
```

- Typically invoked as fire-and-forget via `ctx.scheduler.runAfter(0, internal.actionsdir.*.trigger..., payload)`.

### Kestra → Convex (callbacks)

- After processing, Kestra usually POSTs results back to **Convex HTTP endpoints** using `io.kestra.plugin.core.http.Request`.
- Convex persists/updates records; clients consume the updated state directly (realtime).

### Key decisions / repo rules

- **Use `pnpm`** for installs.
- **Do not manually edit `package.json`** to add deps. Install via `pnpm add <pkg>` (and `pnpm add -D <pkg>` for dev deps).
- Use Kestra for work that is **slow, external, or AI-heavy**, and keep Convex functions focused on validation + persistence.
