export type HttpResult =
  | { ok: true; status: number; text: string }
  | { ok: false; status: number | null; error: string };

export async function fetchTextWithTimeout(
  url: string,
  opts: { method?: string; headers?: Record<string, string>; timeoutMs: number },
): Promise<HttpResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs);
  try {
    const res = await fetch(url, {
      method: opts.method ?? "GET",
      headers: opts.headers,
      signal: controller.signal,
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) return { ok: false, status: res.status, error: text || res.statusText };
    return { ok: true, status: res.status, text };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown fetch error";
    return { ok: false, status: null, error: msg };
  } finally {
    clearTimeout(timeout);
  }
}


