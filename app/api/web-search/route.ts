/**
 * Server-side proxy for the Workato "skill_genie" salary lookup.
 *
 * The browser POSTs WebSearchArgs to /api/web-search; this handler calls
 * Workato server-side (no browser CORS) using a token kept in
 * process.env.WORKATO_WEB_SEARCH_TOKEN (injected from Secret Manager on
 * Cloud Run), then returns { p25, p50, p75, p90 }.
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORKATO_BASE = "https://11548.apim.mcp.workato.com";

type WebSearchArgs = {
  Title: string;
  Location: string;
  Years_of_experience: number;
  Level_List: string[];
};

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

function extractSalary(
  payload: unknown,
): { p25: number; p50: number; p75: number; p90: number } | null {
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

export async function POST(req: Request) {
  const token = process.env.WORKATO_WEB_SEARCH_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Server missing WORKATO_WEB_SEARCH_TOKEN" },
      { status: 500 },
    );
  }

  let args: WebSearchArgs;
  try {
    args = (await req.json()) as WebSearchArgs;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = {
    jsonrpc: "2.0" as const,
    method: "tools/call" as const,
    params: { name: "skill_genie", arguments: args },
    id: "1",
  };

  let res: Response;
  try {
    res = await fetch(`${WORKATO_BASE}?wkt_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Could not reach Workato: ${(e as Error).message}` },
      { status: 502 },
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: `Workato request failed: ${res.status} ${res.statusText}` },
      { status: 502 },
    );
  }

  const data = (await res.json()) as {
    result?: unknown;
    error?: { message?: string };
  };
  if (data && data.error) {
    return NextResponse.json(
      { error: `Workato error: ${data.error.message ?? "unknown"}` },
      { status: 502 },
    );
  }

  const salary = extractSalary(data.result);
  if (!salary) {
    return NextResponse.json(
      { error: "Workato response did not contain p25/p50/p75/p90 fields." },
      { status: 502 },
    );
  }

  return NextResponse.json(salary);
}
