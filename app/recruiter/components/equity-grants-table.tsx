"use client";

import type { InternalEquityByPercentile } from "@/app/recruiter/mock-data";
import {
  PERCENTILE_COLUMN_ORDER,
  medianColumnClass,
  PercentileTransposedThead,
} from "@/app/recruiter/percentile-transposed-table";
import { useGlobalSettings } from "@/app/context/global-settings";
import { formatMoneyDisplay } from "@/app/lib/money-format";

type Props = {
  rows: InternalEquityByPercentile[];
};

export function EquityGrantsTable({ rows }: Props) {
  const { currency, fxRate } = useGlobalSettings();

  const byPercentile = new Map(
    rows.map((r) => [r.percentile, r] as [number, InternalEquityByPercentile]),
  );

  return (
    <section
      aria-labelledby="equity-grants-heading"
      className="overflow-hidden rounded-xl border border-amber-200/90 bg-white shadow-sm ring-1 ring-amber-200/30"
    >
      <div className="border-b border-amber-100/80 bg-amber-50/50 px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-800/90">
          Total target comp
        </p>
        <h3
          id="equity-grants-heading"
          className="mt-1 text-sm font-semibold text-slate-900"
        >
          Equity comparison
        </h3>
        <p className="mt-0.5 text-xs text-amber-900/70">
          Current internal equity by percentile (mock). Annualized grant values.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <PercentileTransposedThead />
          <tbody>
            <tr className="border-b border-slate-100 bg-white hover:bg-amber-50/30">
              <th
                scope="row"
                className="px-4 py-3.5 font-medium text-slate-800 sm:px-5"
              >
                Current internal equity{" "}
                <span className="text-xs text-slate-400 font-normal ml-1">(n=24)</span>
              </th>
              {PERCENTILE_COLUMN_ORDER.map((pct) => {
                const row = byPercentile.get(pct);
                const isMedian = pct === 50;
                return (
                  <td
                    key={`eq-int-${pct}`}
                    className={medianColumnClass(
                      isMedian,
                      "border-b border-slate-100 px-4 py-3.5 text-center font-mono tabular-nums text-slate-700 sm:px-5",
                    )}
                  >
                    {row
                      ? formatMoneyDisplay(row.currentInternalUsd, currency, fxRate)
                      : "—"}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
