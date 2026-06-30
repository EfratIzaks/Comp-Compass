/**
 * Client for the Workato "skill_genie" salary lookup.
 *
 * The actual Workato call happens server-side in app/api/web-search/route.ts
 * (server -> server, so no browser CORS, and the token stays on the server).
 * This module just POSTs the args to that internal route.
 */

export type WebSearchSalaryUsd = {
  p25: number;
  p50: number;
  p75: number;
  p90: number;
};

export type WebSearchArgs = {
  Title: string;
  Location: string;
  Years_of_experience: number;
  Level_List: string[];
};

export async function fetchWebSearchSalary(
  args: WebSearchArgs,
  init?: { signal?: AbortSignal },
): Promise<WebSearchSalaryUsd> {
  const res = await fetch("/api/web-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
    signal: init?.signal,
  });

  if (!res.ok) {
    let message = `Web search request failed: ${res.status} ${res.statusText}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(message);
  }

  return (await res.json()) as WebSearchSalaryUsd;
}
