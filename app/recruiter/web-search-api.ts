/**
 * Workato MCP "skill_genie" tool client.
 *
 * SECURITY: the wkt_token below is sent from the browser, so anyone using the
 * recruiter portal can read it. For anything beyond a quick demo, move this
 * call into a Next.js Route Handler (e.g. app/api/web-search/route.ts) and
 * keep the token in process.env on the server.
 */

const WEB_SEARCH_MCP_URL =
  "https://11548.apim.mcp.workato.com?wkt_token=1d8668bc6ddf1adf86676aa56228be66f5d35f3697e3faa40344ff983bac70cd";

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

type JsonRpcSuccess = {
  jsonrpc: "2.0";
  id: string | number;
  result: unknown;
};
type JsonRpcError = {
  jsonrpc: "2.0";
  id: string | number;
  error: { code: number; message: string; data?: unknown };
};
type JsonRpcResponse = JsonRpcSuccess | JsonRpcError;

function pickNumber(
  obj: Record<string, unknown>,
  keys: string[],
): number | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = Number(v.replace(/[^0-9.\-]/g, ""));
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

/** Recursively look for { p25, p50, p75, p90 } (with common variants) anywhere in the payload. */
function extractSalary(payload: unknown): WebSearchSalaryUsd | null {
  if (payload == null) return null;
  if (typeof payload === "string") {
    try {
      return extractSalary(JSON.parse(payload));
    } catch {
      return null;
    }
  }
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const found = extractSalary(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof payload !== "object") return null;
  const o = payload as Record<string, unknown>;
  const p25 = pickNumber(o, ["p25", "P25", "25", "pct25", "p_25"]);
  const p50 = pickNumber(o, ["p50", "P50", "50", "pct50", "p_50", "median"]);
  const p75 = pickNumber(o, ["p75", "P75", "75", "pct75", "p_75"]);
  const p90 = pickNumber(o, ["p90", "P90", "90", "pct90", "p_90"]);
  if (
    typeof p25 === "number" &&
    typeof p50 === "number" &&
    typeof p75 === "number" &&
    typeof p90 === "number"
  ) {
    return { p25, p50, p75, p90 };
  }
  for (const v of Object.values(o)) {
    const nested = extractSalary(v);
    if (nested) return nested;
  }
  return null;
}

export async function fetchWebSearchSalary(
  args: WebSearchArgs,
  init?: { signal?: AbortSignal },
): Promise<WebSearchSalaryUsd> {
  const payload = {
    jsonrpc: "2.0" as const,
    method: "tools/call" as const,
    params: {
      name: "skill_genie",
      arguments: args,
    },
    id: "1",
  };

  console.log("Sending Workato Payload:", payload);

  const res = await fetch(WEB_SEARCH_MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    signal: init?.signal,
  });

  if (!res.ok) {
    throw new Error(
      `Web search request failed: ${res.status} ${res.statusText}`,
    );
  }

  const data = (await res.json()) as JsonRpcResponse;
  console.log("Received Workato Response:", data);

  if ("error" in data && data.error) {
    throw new Error(`Web search error: ${data.error.message}`);
  }

  const salary = extractSalary((data as JsonRpcSuccess).result);
  if (!salary) {
    throw new Error(
      "Web search response did not contain p25/p50/p75/p90 salary fields.",
    );
  }
  return salary;
}
