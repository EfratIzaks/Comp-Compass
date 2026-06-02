"use client";

import { useGlobalSettings } from "@/app/context/global-settings";
import { formatBaseSalaryDisplay } from "@/app/lib/money-format";

type Props = {
  /** Wider comparison span on the chart (USD canonical — internal vs external extents). */
  contextRangeUsd: { min: number; max: number };
  /** Pagaya approved band: internal median → external P75 (USD canonical). */
  approvedRangeUsd: {
    internalMedianUsd: number;
    externalP75Usd: number;
  };
};

export function PagayaBenchmarkRange({
  contextRangeUsd,
  approvedRangeUsd,
}: Props) {
  const { currency, fxRate } = useGlobalSettings();

  const span = contextRangeUsd.max - contextRangeUsd.min || 1;
  const toPct = (v: number) =>
    Math.min(100, Math.max(0, ((v - contextRangeUsd.min) / span) * 100));

  const lo = Math.min(
    approvedRangeUsd.internalMedianUsd,
    approvedRangeUsd.externalP75Usd,
  );
  const hi = Math.max(
    approvedRangeUsd.internalMedianUsd,
    approvedRangeUsd.externalP75Usd,
  );

  const bandLeftPct = toPct(lo);
  const bandRightPct = toPct(hi);
  const widthPct = Math.max(0, bandRightPct - bandLeftPct);

  const internalPct = toPct(approvedRangeUsd.internalMedianUsd);
  const externalPct = toPct(approvedRangeUsd.externalP75Usd);
  const midUsd = Math.round((approvedRangeUsd.internalMedianUsd + approvedRangeUsd.externalP75Usd) / 2);
  const midPct = (internalPct + externalPct) / 2;

  const markers = [
    {
      key: "int-p50",
      label: "Internal median (P50)",
      valueUsd: approvedRangeUsd.internalMedianUsd,
      pct: internalPct,
    },
    {
      key: "mid",
      label: "Mid",
      valueUsd: midUsd,
      pct: midPct,
    },
    {
      key: "ext-p75",
      label: "External P75",
      valueUsd: approvedRangeUsd.externalP75Usd,
      pct: externalPct,
    },
  ] as const;

  return (
    <section
      aria-labelledby="pagaya-benchmark-heading"
      className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3
            id="pagaya-benchmark-heading"
            className="text-sm font-semibold text-slate-900"
          >
            Pagaya approved range
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Internal median through external P75 — hybrid benchmark (mock)
          </p>
        </div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-teal-700/90">
          Target zone · Internal median → External P75
        </p>
      </div>

      <div className="relative mt-8 px-1">
        <div
          className="relative h-3 overflow-hidden rounded-full bg-slate-200/90 ring-1 ring-slate-200/80"
          role="img"
          aria-label={`Approved band from internal median ${formatBaseSalaryDisplay(approvedRangeUsd.internalMedianUsd, currency, fxRate)} to external P75 ${formatBaseSalaryDisplay(approvedRangeUsd.externalP75Usd, currency, fxRate)}`}
        >
          <div
            className="absolute inset-y-0 rounded-full bg-teal-400/85 shadow-inner ring-1 ring-teal-600/25"
            style={{ left: `${bandLeftPct}%`, width: `${widthPct}%` }}
          />
          {markers.map(({ key, pct }) => (
            <div
              key={key}
              className="absolute top-1/2 z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white shadow-md ring-2 ring-teal-600/45"
              style={{ left: `${pct}%` }}
            />
          ))}
        </div>

        <div className="relative mt-6 min-h-[4.5rem]">
          {markers.map(({ key, label, valueUsd, pct }) => (
            <div
              key={key}
              className="absolute top-0 w-[33%] max-w-[9rem] -translate-x-1/2 text-center"
              style={{ left: `${pct}%` }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {label}
              </p>
              <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-slate-900">
                {formatBaseSalaryDisplay(valueUsd, currency, fxRate)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
