"use client";

import type { CurrencyCode } from "@/app/context/global-settings";
import { useGlobalSettings } from "@/app/context/global-settings";
import {
  formatMoneyDisplay,
  formatNativeAnnualBaseSalaryDisplay,
  nativeToCanonicalUsd,
} from "@/app/lib/money-format";

const MARKS = [25, 50, 75, 90] as const;

export type OfferSliderBenchmarks = {
  p25: number;
  p50: number;
  p75: number;
  p90: number;
};

type Props = {
  id: string;
  label: string;
  /** Slider axis and value are in location-native currency units (USD or ILS). */
  marketNativeCurrency: CurrencyCode;
  value: number;
  onValueChange: (n: number) => void;
  min: number;
  max: number;
  step: number;
  benchmarks: OfferSliderBenchmarks;
  hint?: string;
  /** Pagaya “green zone”: native-axis band (e.g. external P50–P75). */
  approvedBandNative?: { min: number; max: number };
  /** Prominent marker — internal median (native axis). */
  internalMedianNative?: number;
  /** Overrides default benchmarks section title. */
  benchmarksHeading?: string;
  /** Base salary: ILS shows monthly `/ mo`, USD shows annual `/ yr` (slider math stays annual native). */
  displayBaseSalaryCadence?: boolean;
  /** Optional RSU estimate shown under the recommended dollar amount (annual equity ÷ share price). */
  estimatedShares?: number;
};

function pctNum(n: number, min: number, max: number): number {
  if (max - min < 0.1) {
    return 0;
  }
  return Math.max(0, Math.min(100, ((n - min) / (max - min)) * 100));
}

function posPct(n: number, min: number, max: number): string {
  return `${pctNum(n, min, max)}%`;
}

function formatNativeAxisAsDisplay(
  nativeAmt: number,
  marketNativeCurrency: CurrencyCode,
  displayCurrency: CurrencyCode,
  fxRate: number,
) {
  const usd = nativeToCanonicalUsd(nativeAmt, marketNativeCurrency, fxRate);
  return formatMoneyDisplay(usd, displayCurrency, fxRate);
}

function formatSliderAxisDisplay(
  nativeAmt: number,
  marketNativeCurrency: CurrencyCode,
  displayCurrency: CurrencyCode,
  fxRate: number,
  baseSalaryCadence: boolean | undefined,
) {
  if (baseSalaryCadence) {
    return formatNativeAnnualBaseSalaryDisplay(
      nativeAmt,
      marketNativeCurrency,
      displayCurrency,
      fxRate,
    );
  }
  return formatNativeAxisAsDisplay(
    nativeAmt,
    marketNativeCurrency,
    displayCurrency,
    fxRate,
  );
}

export function OfferSlider({
  id,
  label,
  marketNativeCurrency,
  value,
  onValueChange,
  min,
  max,
  step,
  benchmarks,
  hint,
  approvedBandNative,
  internalMedianNative,
  benchmarksHeading = "Benchmarks (by percentile)",
  displayBaseSalaryCadence,
  estimatedShares,
}: Props) {
  const { currency, fxRate } = useGlobalSettings();
  const markValues = {
    25: benchmarks.p25,
    50: benchmarks.p50,
    75: benchmarks.p75,
    90: benchmarks.p90,
  } as const;

  const v = Math.max(min, Math.min(max, value));

  const outOfApprovedBand =
    approvedBandNative != null &&
    (v < approvedBandNative.min || v > benchmarks.p90);

  const bandLeftPct = approvedBandNative
    ? pctNum(approvedBandNative.min, min, max)
    : 0;
  const bandWidthPct = approvedBandNative
    ? Math.max(0, pctNum(approvedBandNative.max, min, max) - bandLeftPct)
    : 0;

  const percentileTickClass =
    internalMedianNative != null && approvedBandNative != null
      ? "bg-sky-600/90"
      : "bg-slate-500";

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h4 className="text-sm font-semibold text-slate-900" id={id + "-label"}>
          {label}
        </h4>
        {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      </div>

      {/* Recommended value: above the control so it never collides with the thumb */}
      <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
          Recommended
        </p>
        <p
          className={
            outOfApprovedBand
              ? "mt-1 font-mono text-2xl font-bold tabular-nums tracking-tight text-amber-600"
              : "mt-1 font-mono text-2xl font-bold tabular-nums tracking-tight text-sky-950"
          }
          aria-live="polite"
        >
          {formatSliderAxisDisplay(
            v,
            marketNativeCurrency,
            currency,
            fxRate,
            displayBaseSalaryCadence,
          )}
        </p>
        {estimatedShares !== undefined ? (
          <p className="mt-1 text-sm tabular-nums text-slate-500" aria-live="polite">
            ~{estimatedShares.toLocaleString("en-US")} RSUs
          </p>
        ) : null}
      </div>

      <div className="relative mt-5 px-0.5">
        {internalMedianNative != null ? (
          <div className="pointer-events-none absolute -top-8 left-0 right-0 z-20">
            <div
              className="absolute top-0 flex w-0 flex-col items-center"
              style={{
                left: posPct(internalMedianNative, min, max),
                transform: "translateX(-50%)",
              }}
            >
              <span className="whitespace-nowrap rounded-md bg-violet-700 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-md ring-1 ring-violet-900/20">
                Internal median
              </span>
              <div className="mt-0.5 h-4 w-0.5 rounded-full bg-violet-600 shadow-sm" />
            </div>
          </div>
        ) : null}

        <div className="relative flex h-10 items-center">
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-slate-200/90 ring-1 ring-slate-200/80"
            aria-hidden
          />
          {approvedBandNative ? (
            <div
              className="pointer-events-none absolute top-1/2 h-3 -translate-y-1/2 rounded-full bg-teal-400/50 shadow-inner ring-1 ring-teal-600/25"
              style={{
                left: `${bandLeftPct}%`,
                width: `${bandWidthPct}%`,
              }}
              aria-hidden
            />
          ) : null}
          <input
            type="range"
            id={id}
            className="relative z-30 h-10 w-full cursor-pointer bg-transparent align-middle accent-sky-600
              [&::-webkit-slider-runnable-track]:h-3
              [&::-webkit-slider-runnable-track]:rounded-full
              [&::-webkit-slider-runnable-track]:bg-transparent
              [&::-moz-range-track]:h-3
              [&::-moz-range-track]:rounded-full
              [&::-moz-range-track]:bg-transparent
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:w-4
              [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:w-4"
            min={min}
            max={max}
            step={step}
            value={v}
            onChange={(e) => onValueChange(Number(e.target.value))}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={v}
            aria-labelledby={id + "-label"}
          />
        </div>
      </div>

      {/* Benchmark ticks + labels: separated so they never sit under the thumb */}
      <div
        className="mt-6 border-t border-slate-100 pt-4"
        role="presentation"
        aria-hidden
      >
        <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">
          {benchmarksHeading}
        </p>
        <div className="relative h-1 border-b border-slate-200/90">
          {MARKS.map((k) => {
            const b = markValues[k];
            return (
              <div
                key={k}
                className={[
                  "absolute bottom-0 w-0.5 -translate-x-1/2 translate-y-px",
                  percentileTickClass,
                ].join(" ")}
                style={{ left: posPct(b, min, max), height: 6 }}
              />
            );
          })}
        </div>
        <div className="relative mt-3 min-h-[3.25rem] sm:min-h-14">
          {MARKS.map((k) => {
            const b = markValues[k];
            return (
              <div
                key={k}
                className="absolute w-[4.2rem] max-w-[23%] -translate-x-1/2 text-center sm:w-auto sm:max-w-none"
                style={{ left: posPct(b, min, max) }}
              >
                <p className="whitespace-nowrap text-[10px] font-medium text-slate-500">
                  {k}th
                </p>
                <p className="mt-0.5 font-mono text-[9px] tabular-nums text-slate-400 sm:text-[10px]">
                  {formatSliderAxisDisplay(
                    b,
                    marketNativeCurrency,
                    currency,
                    fxRate,
                    displayBaseSalaryCadence,
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex justify-between border-t border-slate-100 pt-3 text-[10px] text-slate-400 sm:text-xs">
        <span>
          Min:{" "}
          {formatSliderAxisDisplay(
            min,
            marketNativeCurrency,
            currency,
            fxRate,
            displayBaseSalaryCadence,
          )}
        </span>
        <span>
          Max:{" "}
          {formatSliderAxisDisplay(
            max,
            marketNativeCurrency,
            currency,
            fxRate,
            displayBaseSalaryCadence,
          )}
        </span>
      </div>
    </div>
  );
}
