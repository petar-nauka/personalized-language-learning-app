const SUPABASE_URL = (process.env.SUPABASE_URL || "https://your-project.supabase.co").replace(/\/$/, "");
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY || "";

interface RestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  params?: Record<string, string>;
  body?: unknown;
  prefer?: string;
}

export async function supaFetch<T = unknown>(tableOrPath: string, opts: RestOptions = {}): Promise<T> {
  if (!SERVICE_ROLE_KEY) {
    throw new Error("Missing SERVICE_ROLE_KEY in server environment");
  }
  const url = new URL(`${SUPABASE_URL}/rest/v1/${tableOrPath.replace(/^\//, "")}`);
  if (opts.params) {
    for (const [k, v] of Object.entries(opts.params)) {
      url.searchParams.set(k, v);
    }
  }

  const headers: Record<string, string> = {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
  if (opts.prefer) {
    headers["Prefer"] = opts.prefer;
  }

  const res = await fetch(url.toString(), {
    method: opts.method || "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase REST error (${res.status} on ${tableOrPath}): ${errText}`);
  }

  const text = await res.text();
  if (!text) return [] as unknown as T;
  return JSON.parse(text) as T;
}
