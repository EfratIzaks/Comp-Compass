/** Shared transposed percentile table: columns Type, 25th, 50th (Median), 75th, 90th. */

export const PERCENTILE_COLUMN_ORDER = [25, 50, 75, 90] as const;

export type PercentileKey = (typeof PERCENTILE_COLUMN_ORDER)[number];

export function medianColumnClass(isMedian: boolean, extra?: string) {
  return [
    extra,
    isMedian
      ? "bg-sky-50/85 ring-1 ring-inset ring-sky-200/60"
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function PercentileTransposedThead() {
  return (
    <thead>
      <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <th scope="col" className="px-4 py-3 sm:px-5">
          Type
        </th>
        {PERCENTILE_COLUMN_ORDER.map((pct) => {
          const isMedian = pct === 50;
          return (
            <th
              key={pct}
              scope="col"
              className={medianColumnClass(
                isMedian,
                "whitespace-nowrap px-4 py-3 text-center sm:px-5",
              )}
            >
              {pct === 50 ? (
                <span className="normal-case">
                  <span className="tabular-nums">50th</span>{" "}
                  <span className="font-semibold text-sky-700">(Median)</span>
                </span>
              ) : (
                <span className="tabular-nums">{pct}th</span>
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
