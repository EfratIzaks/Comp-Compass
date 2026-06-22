"use client";

import type { CurrencyCode } from "@/app/context/global-settings";
import { amountInDisplayCurrency, formatMoneyDisplay } from "@/app/lib/money-format";

const BONUS_SLIDER_STEP_USD = 1_000;

/** Max values for slider scale and benchmark marker positioning. */
const bonusMax = 50_000;
const signingMax = 50_000;
const oneTimeMax = 50_000;

export type PercentileBenchmarksUsd = {
  p25: number;
  p50: number;
  p75: number;
  p90: number;
};

type BonusBreakdownSectionProps = {
  currency: CurrencyCode;
  fxRate: number;
  offerBonusUsd: number;
  onOfferBonusChange: (usd: number) => void;
  signingBonusUsd: number;
  onSigningBonusChange: (usd: number) => void;
  oneTimeBonusUsd: number;
  onOneTimeBonusChange: (usd: number) => void;
  recommendedBonusUsd: number;
  recommendedSigningUsd: number;
  recommendedOneTimeUsd: number;
  discretionaryBenchmarksUsd: PercentileBenchmarksUsd;
  signingBenchmarksUsd: PercentileBenchmarksUsd;
  oneTimeBenchmarksUsd: PercentileBenchmarksUsd;
};

function benchmarkLeftPercent(recommendedUsd: number, sliderMax: number): string {
  const pct = sliderMax > 0 ? (recommendedUsd / sliderMax) * 100 : 0;
  return `${Math.min(100, Math.max(0, pct))}%`;
}

/** Compact legend label (e.g. $15k) aligned with slider percentile spread. */
function formatCompactBenchmark(usd: number, currency: CurrencyCode, fxRate: number): string {
  const n = amountInDisplayCurrency(usd, currency, fxRate);
  const symbol = currency === "ILS" ? "₪" : "$";
  if (n >= 1000) {
    return `${symbol}${Math.round(n / 1000)}k`;
  }
  return `${symbol}${n.toLocaleString("en-US")}`;
}

function PercentileRangeLegend({
  benchmarks,
  currency,
  fxRate,
}: {
  benchmarks: PercentileBenchmarksUsd;
  currency: CurrencyCode;
  fxRate: number;
}) {
  return (
    <div className="mt-2 flex justify-between px-1 text-[10px] font-medium text-slate-400">
      <span>25th: {formatCompactBenchmark(benchmarks.p25, currency, fxRate)}</span>
      <span className="font-bold text-slate-600">
        50th: {formatCompactBenchmark(benchmarks.p50, currency, fxRate)}
      </span>
      <span>75th: {formatCompactBenchmark(benchmarks.p75, currency, fxRate)}</span>
      <span>90th: {formatCompactBenchmark(benchmarks.p90, currency, fxRate)}</span>
    </div>
  );
}

function BonusSliderRow({
  title,
  recommendedUsd,
  valueUsd,
  onChange,
  includedInTtc,
  sliderMax,
  sampleSize,
  benchmarks,
  currency,
  fxRate,
}: {
  title: string;
  recommendedUsd: number;
  valueUsd: number;
  onChange: (usd: number) => void;
  includedInTtc: boolean;
  sliderMax: number;
  sampleSize: number;
  benchmarks: PercentileBenchmarksUsd;
  currency: CurrencyCode;
  fxRate: number;
}) {
  const valueLabel = formatMoneyDisplay(valueUsd, currency, fxRate);
  const recommendedLabel = formatMoneyDisplay(recommendedUsd, currency, fxRate);

  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <div>
          <label className="text-sm font-bold uppercase text-slate-900">{title}</label>
          <p className="mt-1 text-xs text-slate-500">
            Recommended target: {recommendedLabel}{" "}
            <span className="ml-1 font-normal text-slate-400">(n={sampleSize})</span>
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-slate-900">{valueLabel}</span>
          <p
            className={[
              "mt-1 text-[10px] font-bold uppercase tracking-wider",
              includedInTtc ? "text-blue-600" : "text-slate-400",
            ].join(" ")}
          >
            {includedInTtc ? "Included in TTC" : "Excluded from TTC"}
          </p>
        </div>
      </div>
      <div className="relative pb-2 pt-6">
        <div
          className="pointer-events-none absolute top-0 flex flex-col items-center transition-all"
          style={{
            left: benchmarkLeftPercent(recommendedUsd, sliderMax),
            transform: "translateX(-50%)",
          }}
          aria-hidden
        >
          <span className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Target
          </span>
          <div className="h-3 w-0.5 bg-slate-300" />
        </div>
        <input
          type="range"
          min={0}
          max={sliderMax}
          step={BONUS_SLIDER_STEP_USD}
          value={valueUsd}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative z-10 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-slate-900"
          aria-label={title}
        />
      </div>
      <PercentileRangeLegend benchmarks={benchmarks} currency={currency} fxRate={fxRate} />
    </div>
  );
}

export function BonusBreakdownSection({
  currency,
  fxRate,
  offerBonusUsd,
  onOfferBonusChange,
  signingBonusUsd,
  onSigningBonusChange,
  oneTimeBonusUsd,
  onOneTimeBonusChange,
  recommendedBonusUsd,
  recommendedSigningUsd,
  recommendedOneTimeUsd,
  discretionaryBenchmarksUsd,
  signingBenchmarksUsd,
  oneTimeBenchmarksUsd,
}: BonusBreakdownSectionProps) {
  return (
    <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
      <h3 className="mb-6 text-lg font-bold text-slate-900">Bonus Breakdown</h3>
      <div className="space-y-8">
        <BonusSliderRow
          title="1. Signing Bonus"
          recommendedUsd={recommendedSigningUsd}
          valueUsd={signingBonusUsd}
          onChange={onSigningBonusChange}
          includedInTtc={false}
          sliderMax={signingMax}
          sampleSize={612}
          benchmarks={signingBenchmarksUsd}
          currency={currency}
          fxRate={fxRate}
        />

        <hr className="border-slate-100" />

        <BonusSliderRow
          title="2. Guaranteed Bonus"
          recommendedUsd={recommendedOneTimeUsd}
          valueUsd={oneTimeBonusUsd}
          onChange={onOneTimeBonusChange}
          includedInTtc={false}
          sliderMax={oneTimeMax}
          sampleSize={430}
          benchmarks={oneTimeBenchmarksUsd}
          currency={currency}
          fxRate={fxRate}
        />

        <hr className="border-slate-100" />

        <BonusSliderRow
          title="3. Target Discretionary (Annual)"
          recommendedUsd={recommendedBonusUsd}
          valueUsd={offerBonusUsd}
          onChange={onOfferBonusChange}
          includedInTtc
          sliderMax={bonusMax}
          sampleSize={856}
          benchmarks={discretionaryBenchmarksUsd}
          currency={currency}
          fxRate={fxRate}
        />
      </div>
    </div>
  );
}
