"use client";

import { useRef, useState } from "react";
import { type PercentileRow } from "@/app/recruiter/mock-data";
import { useGlobalSettings } from "@/app/context/global-settings";
import { formatBaseSalaryDisplay } from "@/app/lib/money-format";
import {
  PERCENTILE_COLUMN_ORDER,
  medianColumnClass,
  PercentileTransposedThead,
} from "@/app/recruiter/percentile-transposed-table";
import type { WebSearchSalaryUsd } from "@/app/recruiter/web-search-api";

const WEB_SEARCH_SOURCES: ReadonlyArray<{ label: string; href: string }> = [
  { label: "Google Jobs", href: "https://www.google.com/search?q=salary&ibp=htl;jobs" },
  { label: "Levels.fyi", href: "https://www.levels.fyi" },
  { label: "Glassdoor", href: "https://www.glassdoor.com/Salaries/index.htm" },
];

type Props = {
  rows: PercentileRow[];
  showWebSearch?: boolean;
  /** Live web-search data; when null/undefined, cells render `—`. */
  webSearchData?: WebSearchSalaryUsd | null;
  webSearchLoading?: boolean;
  webSearchError?: string | null;
};

export function ComparisonTable({
  rows,
  showWebSearch = false,
  webSearchData = null,
  webSearchLoading = false,
  webSearchError = null,
}: Props) {
  const { currency, fxRate } = useGlobalSettings();

  const webSearchByPercentile = webSearchData
    ? ({
        25: webSearchData.p25,
        50: webSearchData.p50,
        75: webSearchData.p75,
        90: webSearchData.p90,
      } as Record<(typeof PERCENTILE_COLUMN_ORDER)[number], number>)
    : null;

  const byPercentile = new Map(
    rows.map((r) => [r.percentile, r] as [number, PercentileRow]),
  );

  const sourcesIconRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [sourcesAnchor, setSourcesAnchor] = useState<{
    left: number;
    top: number;
  } | null>(null);

  const openSourcesTooltip = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    const el = sourcesIconRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      setSourcesAnchor({
        left: rect.left + rect.width / 2,
        top: rect.bottom + 8,
      });
    }
  };

  const scheduleCloseSourcesTooltip = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      setSourcesAnchor(null);
      closeTimerRef.current = null;
    }, 120);
  };

  return (
    <section
      aria-labelledby="comparison-heading"
      className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm"
    >
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 id="comparison-heading" className="text-sm font-semibold text-slate-900">
          Salary comparison
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Current internal vs industry standard by percentile (mock). With ILS selected, figures are
          monthly; with USD, annual.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <PercentileTransposedThead />
          <tbody>
            <tr className="border-b border-slate-100 bg-white hover:bg-slate-50/60">
              <th
                scope="row"
                className="px-4 py-3.5 font-medium text-slate-800 sm:px-5"
              >
                Current Internal Salary{" "}
                <span className="text-xs text-slate-400 font-normal ml-1">(n=24)</span>
              </th>
              {PERCENTILE_COLUMN_ORDER.map((pct) => {
                const row = byPercentile.get(pct);
                const isMedian = pct === 50;
                return (
                  <td
                    key={`int-${pct}`}
                    className={medianColumnClass(
                      isMedian,
                      "px-4 py-3.5 text-center font-mono tabular-nums text-slate-700 sm:px-5",
                    )}
                  >
                    {row
                      ? formatBaseSalaryDisplay(row.currentInternalUsd, currency, fxRate)
                      : "—"}
                  </td>
                );
              })}
            </tr>
            <tr className="border-b border-slate-100 bg-white hover:bg-slate-50/60">
              <th
                scope="row"
                className="px-4 py-3.5 font-medium text-slate-800 sm:px-5"
              >
                Industry Standard{" "}
                <span className="text-xs font-normal text-slate-400 ml-1">(n=856)</span>
              </th>
              {PERCENTILE_COLUMN_ORDER.map((pct) => {
                const row = byPercentile.get(pct);
                const isMedian = pct === 50;
                return (
                  <td
                    key={`ind-${pct}`}
                    className={medianColumnClass(
                      isMedian,
                      "px-4 py-3.5 text-center font-mono tabular-nums text-slate-700 sm:px-5",
                    )}
                  >
                    {row
                      ? formatBaseSalaryDisplay(row.industryStandardUsd, currency, fxRate)
                      : "—"}
                  </td>
                );
              })}
            </tr>
            {showWebSearch ? (
              <tr className="border-t border-slate-100 bg-slate-50/50 transition-all">
                <th
                  scope="row"
                  className="px-4 py-3.5 font-medium text-slate-800 sm:px-5"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span>Web Search</span>
                    <button
                      ref={sourcesIconRef}
                      type="button"
                      aria-label="View web search sources"
                      onMouseEnter={openSourcesTooltip}
                      onMouseLeave={scheduleCloseSourcesTooltip}
                      onFocus={openSourcesTooltip}
                      onBlur={scheduleCloseSourcesTooltip}
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
                    >
                      <svg
                        aria-hidden
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3.5 w-3.5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                    </button>
                  </span>
                </th>
                {PERCENTILE_COLUMN_ORDER.map((pct) => {
                  const isMedian = pct === 50;
                  const usd = webSearchByPercentile?.[pct];
                  return (
                    <td
                      key={`web-${pct}`}
                      className={medianColumnClass(
                        isMedian,
                        [
                          "px-4 py-3.5 text-center font-mono text-sm tabular-nums sm:px-5",
                          isMedian ? "font-bold text-slate-700" : "text-slate-600",
                        ].join(" "),
                      )}
                    >
                      {webSearchLoading
                        ? "…"
                        : usd != null
                          ? formatBaseSalaryDisplay(usd, currency, fxRate)
                          : "—"}
                    </td>
                  );
                })}
              </tr>
            ) : null}
            {showWebSearch && webSearchError ? (
              <tr className="bg-rose-50/60">
                <td
                  colSpan={1 + PERCENTILE_COLUMN_ORDER.length}
                  className="px-4 py-2 text-xs text-rose-700 sm:px-5"
                >
                  Web search failed: {webSearchError}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {sourcesAnchor ? (
        <div
          role="tooltip"
          onMouseEnter={openSourcesTooltip}
          onMouseLeave={scheduleCloseSourcesTooltip}
          style={{
            position: "fixed",
            left: sourcesAnchor.left,
            top: sourcesAnchor.top,
            transform: "translateX(-50%)",
          }}
          className="z-50 w-44 rounded-lg border border-slate-200 bg-white p-1.5 text-xs shadow-lg"
        >
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Sources
          </div>
          <ul className="flex flex-col">
            {WEB_SEARCH_SOURCES.map((src) => (
              <li key={src.href}>
                <a
                  href={src.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                >
                  {src.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
