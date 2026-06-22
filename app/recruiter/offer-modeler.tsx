"use client";

import {
  BarChart2,
  ChevronDown,
  Clock4,
  MapPin,
  RotateCcw,
  Search,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useGlobalSettings } from "@/app/context/global-settings";
import { estimatePercentile } from "@/app/lib/estimate-percentile";
import { getLocationNativeCurrency } from "@/app/lib/location-currency";
import {
  canonicalUsdToNative,
  formatMoneyDisplay,
  nativeToCanonicalUsd,
} from "@/app/lib/money-format";
import type { AnnualTtcSummaryProps } from "@/app/recruiter/components/annual-ttc-summary";
import { ComparisonTable } from "@/app/recruiter/components/comparison-table";
import { EquityGrantsTable } from "@/app/recruiter/components/equity-grants-table";
import { BonusBreakdownSection } from "@/app/recruiter/components/bonus-breakdown-section";
import { JdUploadZone } from "@/app/recruiter/components/jd-upload-zone";
import { OfferSlider } from "@/app/recruiter/components/offer-slider";
import { PagayaBenchmarkRange } from "@/app/recruiter/components/pagaya-benchmark-range";
import {
  BONUS_PERCENTAGE,
  calculateTtcUsd,
  DEFAULT_PGY_STOCK_PRICE,
} from "@/app/recruiter/offer-constants";
import {
  fetchWebSearchSalary,
  type WebSearchSalaryUsd,
} from "@/app/recruiter/web-search-api";
import {
  DEFAULT_LOCATION,
  LOCATION_OPTIONS,
  YOE_OPTIONS,
  YOE_PLACEHOLDER_LABEL,
  MOCK_INTERNAL_EQUITY_BY_PERCENTILE,
  MOCK_PERCENTILE_ROWS,
  MOCK_ONE_TIME_BONUS_BENCHMARK_USD,
  MOCK_ROLE_NAME,
  MOCK_SIGNING_BONUS_BENCHMARK_USD,
  type InternalEquityByPercentile,
  type PercentileRow,
} from "@/app/recruiter/mock-data";

const LEVEL_SCALE: Record<string, number> = {
  l1: 0.72,
  l2: 0.78,
  l3: 0.84,
  l4: 0.9,
  l5: 0.96,
  l6: 1,
  l7: 1.12,
  l8: 1.22,
};

function scaleRows(rows: PercentileRow[], factor: number): PercentileRow[] {
  return rows.map((r) => ({
    ...r,
    currentInternalUsd: Math.round(r.currentInternalUsd * factor),
    industryStandardUsd: Math.round(r.industryStandardUsd * factor),
  }));
}

function scaleEquityRows(
  rows: InternalEquityByPercentile[],
  factor: number,
): InternalEquityByPercentile[] {
  return rows.map((r) => ({
    ...r,
    currentInternalUsd: Math.round(r.currentInternalUsd * factor),
    industryStandardUsd: Math.round(r.industryStandardUsd * factor),
  }));
}

function getInternalBaseBenchmarks(
  rows: PercentileRow[],
): { p25: number; p50: number; p75: number; p90: number } {
  const g = (p: 25 | 50 | 75 | 90) =>
    rows.find((r) => r.percentile === p)!.currentInternalUsd;
  return { p25: g(25), p50: g(50), p75: g(75), p90: g(90) };
}

/** External / industry-standard curve (Hybrid benchmark — Pagaya approved band uses P50–P75 here). */
function getExternalBaseBenchmarks(
  rows: PercentileRow[],
): { p25: number; p50: number; p75: number; p90: number } {
  const g = (p: 25 | 50 | 75 | 90) =>
    rows.find((r) => r.percentile === p)!.industryStandardUsd;
  return { p25: g(25), p50: g(50), p75: g(75), p90: g(90) };
}

function getEquityBenchmarks(
  rows: InternalEquityByPercentile[],
): { p25: number; p50: number; p75: number; p90: number } {
  const g = (p: 25 | 50 | 75 | 90) =>
    rows.find((r) => r.percentile === p)!.currentInternalUsd;
  return { p25: g(25), p50: g(50), p75: g(75), p90: g(90) };
}

function extentFromCurve(p25: number, p90: number) {
  const spread = p90 - p25;
  return {
    min: Math.round(p25 - spread * 0.4),
    max: Math.round(p90 + spread * 0.35),
  };
}

function percentileCaption(
  value: number,
  p25: number,
  p50: number,
  p75: number,
  p90: number,
  sliderMin: number,
  sliderMax: number,
) {
  const p = Math.round(
    estimatePercentile(value, p25, p50, p75, p90, sliderMin, sliderMax),
  );
  return `Current: ~${p}th Percentile`;
}

type OfferModelerProps = {
  /** Sticky TTC summary slot (rendered by recruiter page with scroll-driven compact vs full). */
  renderStickyTtcSummary: (props: AnnualTtcSummaryProps) => ReactNode;
  /** Role card “Generate Benchmark” action (wired from recruiter page). */
  onGenerateBenchmark?: () => void;
};

export function OfferModeler({
  renderStickyTtcSummary,
  onGenerateBenchmark,
}: OfferModelerProps) {
  const { currency, fxRate } = useGlobalSettings();
  const [roleName, setRoleName] = useState(MOCK_ROLE_NAME);
  const [selectedLevels, setSelectedLevels] = useState<string[]>(["L6"]);
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState(false);
  const levelOptions = ["L1", "L2", "L3", "L4", "L5", "L6", "L7", "L8"];

  const toggleLevel = (level: string) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
    );
  };
  const [location, setLocation] = useState<string>(DEFAULT_LOCATION);
  const [yearsExperience, setYearsExperience] = useState<string>("");
  /** Canonical USD — mock pipeline; display & sliders use location-native axis via fx. */
  const [offerBaseUsd, setOfferBaseUsd] = useState(160_000);
  const [offerEquityUsd, setOfferEquityUsd] = useState(65_000);
  const [offerBonusUsd, setOfferBonusUsd] = useState(24_000);
  const [signingBonusUsd, setSigningBonusUsd] = useState(0);
  const [oneTimeBonusUsd, setOneTimeBonusUsd] = useState(0);
  const [showWebSearch, setShowWebSearch] = useState(false);
  const [webSearchData, setWebSearchData] = useState<WebSearchSalaryUsd | null>(
    null,
  );
  const [webSearchLoading, setWebSearchLoading] = useState(false);
  const [webSearchError, setWebSearchError] = useState<string | null>(null);
  /** USD per share — mock 30d trailing average default; used only for RSU count estimate. */
  const [pgyStockPrice, setPgyStockPrice] = useState(DEFAULT_PGY_STOCK_PRICE);

  const handleSearch = async () => {
    onGenerateBenchmark?.();

    const locationLabel =
      LOCATION_OPTIONS.find((o) => o.value === location)?.label ?? location;
    // YOE state holds bands like "5-7" or "15+"; convert to a single number
    // using the lower bound (e.g. "5-7" -> 5, "15+" -> 15, "" -> 0).
    const yoeNumber =
      Number.parseInt(
        (yearsExperience.split("-")[0] ?? "").replace(/[^0-9]/g, ""),
        10,
      ) || 0;

    setWebSearchLoading(true);
    setWebSearchError(null);
    try {
      const data = await fetchWebSearchSalary({
        Title: roleName,
        Location: locationLabel,
        Years_of_experience: yoeNumber,
        Level_List: selectedLevels,
      });
      setWebSearchData(data);
      setShowWebSearch(true);
    } catch (error) {
      console.error("Workato API Error:", error);
      setWebSearchError(
        error instanceof Error ? error.message : "Web search failed",
      );
    } finally {
      setWebSearchLoading(false);
    }
  };

  const marketNativeCurrency = useMemo(() => getLocationNativeCurrency(location), [location]);

  const primaryLevelKey = (selectedLevels[0] ?? "L6").toLowerCase();
  const factor = LEVEL_SCALE[primaryLevelKey] ?? 1;
  const percentileRowsUsd = useMemo(
    () => scaleRows(MOCK_PERCENTILE_ROWS, factor),
    [factor],
  );
  const internalEquityRowsUsd = useMemo(
    () => scaleEquityRows(MOCK_INTERNAL_EQUITY_BY_PERCENTILE, factor),
    [factor],
  );

  const baseBenchUsd = useMemo(
    () => getInternalBaseBenchmarks(percentileRowsUsd),
    [percentileRowsUsd],
  );
  const externalBenchUsd = useMemo(
    () => getExternalBaseBenchmarks(percentileRowsUsd),
    [percentileRowsUsd],
  );
  const eqBenchUsd = useMemo(
    () => getEquityBenchmarks(internalEquityRowsUsd),
    [internalEquityRowsUsd],
  );

  const baseSlideUsd = useMemo(
    () => extentFromCurve(baseBenchUsd.p25, baseBenchUsd.p90),
    [baseBenchUsd],
  );
  const eqSlideUsd = useMemo(
    () => extentFromCurve(eqBenchUsd.p25, eqBenchUsd.p90),
    [eqBenchUsd],
  );

  const medianBaseUsd = baseBenchUsd.p50;
  const medianEquityUsd = eqBenchUsd.p50;

  const defaultBonusForLevel = useMemo(
    () => Math.round(medianBaseUsd * BONUS_PERCENTAGE),
    [medianBaseUsd],
  );

  const bonusBenchUsd = useMemo(
    () => ({
      p25: Math.round(medianBaseUsd * 0.1),
      p50: Math.round(medianBaseUsd * 0.15),
      p75: Math.round(medianBaseUsd * 0.2),
      p90: Math.round(medianBaseUsd * 0.25),
    }),
    [medianBaseUsd],
  );

  const bonusSlideUsd = useMemo(() => {
    const spread = bonusBenchUsd.p90 - bonusBenchUsd.p25;
    return {
      min: 0,
      max: Math.max(
        Math.round(bonusBenchUsd.p90 + spread * 0.4),
        Math.round(medianBaseUsd * 0.5),
      ),
    };
  }, [bonusBenchUsd, medianBaseUsd]);

  const baseBenchNative = useMemo(
    () => ({
      p25: canonicalUsdToNative(baseBenchUsd.p25, marketNativeCurrency, fxRate),
      p50: canonicalUsdToNative(baseBenchUsd.p50, marketNativeCurrency, fxRate),
      p75: canonicalUsdToNative(baseBenchUsd.p75, marketNativeCurrency, fxRate),
      p90: canonicalUsdToNative(baseBenchUsd.p90, marketNativeCurrency, fxRate),
    }),
    [baseBenchUsd, marketNativeCurrency, fxRate],
  );

  const externalBenchNative = useMemo(
    () => ({
      p25: canonicalUsdToNative(externalBenchUsd.p25, marketNativeCurrency, fxRate),
      p50: canonicalUsdToNative(externalBenchUsd.p50, marketNativeCurrency, fxRate),
      p75: canonicalUsdToNative(externalBenchUsd.p75, marketNativeCurrency, fxRate),
      p90: canonicalUsdToNative(externalBenchUsd.p90, marketNativeCurrency, fxRate),
    }),
    [externalBenchUsd, marketNativeCurrency, fxRate],
  );

  /** Hybrid band: internal median (P50) → external P75 (USD canonical edges, native-axis projection). */
  const pagayaApprovedBandNative = useMemo(() => {
    const lo = baseBenchNative.p50;
    const hi = externalBenchNative.p75;
    return {
      min: Math.min(lo, hi),
      max: Math.max(lo, hi),
    };
  }, [baseBenchNative, externalBenchNative]);

  const eqBenchNative = useMemo(
    () => ({
      p25: canonicalUsdToNative(eqBenchUsd.p25, marketNativeCurrency, fxRate),
      p50: canonicalUsdToNative(eqBenchUsd.p50, marketNativeCurrency, fxRate),
      p75: canonicalUsdToNative(eqBenchUsd.p75, marketNativeCurrency, fxRate),
      p90: canonicalUsdToNative(eqBenchUsd.p90, marketNativeCurrency, fxRate),
    }),
    [eqBenchUsd, marketNativeCurrency, fxRate],
  );

  const bonusBenchNative = useMemo(
    () => ({
      p25: canonicalUsdToNative(bonusBenchUsd.p25, marketNativeCurrency, fxRate),
      p50: canonicalUsdToNative(bonusBenchUsd.p50, marketNativeCurrency, fxRate),
      p75: canonicalUsdToNative(bonusBenchUsd.p75, marketNativeCurrency, fxRate),
      p90: canonicalUsdToNative(bonusBenchUsd.p90, marketNativeCurrency, fxRate),
    }),
    [bonusBenchUsd, marketNativeCurrency, fxRate],
  );

  const baseSlideNative = useMemo(
    () => ({
      min: canonicalUsdToNative(baseSlideUsd.min, marketNativeCurrency, fxRate),
      max: canonicalUsdToNative(baseSlideUsd.max, marketNativeCurrency, fxRate),
    }),
    [baseSlideUsd, marketNativeCurrency, fxRate],
  );

  const eqSlideNative = useMemo(
    () => ({
      min: canonicalUsdToNative(eqSlideUsd.min, marketNativeCurrency, fxRate),
      max: canonicalUsdToNative(eqSlideUsd.max, marketNativeCurrency, fxRate),
    }),
    [eqSlideUsd, marketNativeCurrency, fxRate],
  );

  const bonusSlideNative = useMemo(
    () => ({
      min: canonicalUsdToNative(bonusSlideUsd.min, marketNativeCurrency, fxRate),
      max: canonicalUsdToNative(bonusSlideUsd.max, marketNativeCurrency, fxRate),
    }),
    [bonusSlideUsd, marketNativeCurrency, fxRate],
  );

  useEffect(() => {
    setOfferBaseUsd(medianBaseUsd);
    setOfferEquityUsd(medianEquityUsd);
    setOfferBonusUsd(defaultBonusForLevel);
  }, [medianBaseUsd, medianEquityUsd, defaultBonusForLevel]);

  const ttcUsd = calculateTtcUsd({
    offerBaseUsd,
    offerBonusUsd,
    offerEquityUsd,
    signingBonusUsd,
    oneTimeBonusUsd,
  });
  /** Annualized equity is canonical USD (`offerEquityUsd`), independent of display currency. */
  const estimatedShares = Math.floor(
    offerEquityUsd / Math.max(pgyStockPrice, Number.EPSILON),
  );
  const targetBonusPct = `${Math.round(BONUS_PERCENTAGE * 100)}%`;

  function resetToBenchmarkDefaults() {
    setOfferBaseUsd(medianBaseUsd);
    setOfferEquityUsd(medianEquityUsd);
    setOfferBonusUsd(defaultBonusForLevel);
  }

  const basePctLine = percentileCaption(
    canonicalUsdToNative(offerBaseUsd, marketNativeCurrency, fxRate),
    baseBenchNative.p25,
    baseBenchNative.p50,
    baseBenchNative.p75,
    baseBenchNative.p90,
    baseSlideNative.min,
    baseSlideNative.max,
  );
  const eqPctLine = percentileCaption(
    canonicalUsdToNative(offerEquityUsd, marketNativeCurrency, fxRate),
    eqBenchNative.p25,
    eqBenchNative.p50,
    eqBenchNative.p75,
    eqBenchNative.p90,
    eqSlideNative.min,
    eqSlideNative.max,
  );

  const bonusPctLine = percentileCaption(
    canonicalUsdToNative(offerBonusUsd, marketNativeCurrency, fxRate),
    bonusBenchNative.p25,
    bonusBenchNative.p50,
    bonusBenchNative.p75,
    bonusBenchNative.p90,
    bonusSlideNative.min,
    bonusSlideNative.max,
  );

  const recommendedBonusUsd = defaultBonusForLevel;
  const recommendedSigningUsd = 10_000;
  const recommendedOneTimeUsd = 0;

  const annualTtcSummaryProps = useMemo(
    () => ({
      offerBaseUsd,
      offerBonusUsd,
      offerEquityUsd,
      signingBonusUsd,
      oneTimeBonusUsd,
      marketNativeCurrency,
      basePercentileLine: basePctLine,
      bonusPercentileLine: bonusPctLine,
      equityPercentileLine: eqPctLine,
      estimatedShares,
      pgyStockPrice,
      onPgyStockPriceChange: setPgyStockPrice,
      defaultPgyStockPrice: DEFAULT_PGY_STOCK_PRICE,
    }),
    [
      offerBaseUsd,
      offerBonusUsd,
      offerEquityUsd,
      signingBonusUsd,
      oneTimeBonusUsd,
      marketNativeCurrency,
      basePctLine,
      bonusPctLine,
      eqPctLine,
      estimatedShares,
      pgyStockPrice,
    ],
  );

  return (
    <div className="mx-auto min-h-0 w-full max-w-5xl space-y-10">
      <header className="flex flex-col gap-1 border-b border-slate-200/90 pb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          Comp modeling
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Offer modeler</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Set role context, then use sliders to model base, cash bonus, and equity. Policy often
          anchors bonus near <span className="font-medium text-slate-800">{targetBonusPct}</span> of
          base (you can override in the model). All figures respect global currency ({currency}).
        </p>
        <p className="text-xs text-slate-500">
          Reference: {formatMoneyDisplay(100_000, currency, fxRate)} = $100k USD equivalent.
        </p>
      </header>

      <section
        aria-labelledby="role-inputs-heading"
        className="space-y-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 shadow-sm sm:p-6"
      >
        <div>
          <h2
            id="role-inputs-heading"
            className="text-sm font-semibold text-slate-900"
          >
            Role &amp; job definition
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Role, seniority level, location, optional YOE band, plus the job description below.
          </p>
        </div>
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
          role="search"
        >
          <div>
            <label
              htmlFor="role-name"
              className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Role name
            </label>
            <div className="relative mt-1.5">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id="role-name"
                type="search"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. Software Engineer"
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Level
            </span>
            <div className="relative mt-1.5">
              <div
                onClick={() => setIsLevelDropdownOpen(!isLevelDropdownOpen)}
                className="w-full border rounded-md p-2 text-sm bg-white cursor-pointer flex justify-between items-center min-h-[38px]"
              >
                <span className="truncate pr-2 text-slate-700">
                  {selectedLevels.length > 0
                    ? selectedLevels.join(", ")
                    : "Select levels..."}
                </span>
                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform ${isLevelDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>

              {isLevelDropdownOpen && (
                <>
                  {/* Invisible overlay to close dropdown when clicking outside */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsLevelDropdownOpen(false)}
                  ></div>

                  {/* Dropdown Menu */}
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg py-1 max-h-48 overflow-y-auto">
                    {levelOptions.map((level) => (
                      <label
                        key={level}
                        className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLevels.includes(level)}
                          onChange={() => toggleLevel(level)}
                          className="mr-2 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                        />
                        <span className="text-sm text-slate-700">{level}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div>
            <label
              htmlFor="location"
              className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Location
            </label>
            <div className="relative mt-1.5">
              <MapPin
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <select
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm font-medium text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                {LOCATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="years-experience"
              className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Years of experience{" "}
              <span className="font-normal normal-case text-slate-400">(optional)</span>
            </label>
            <div className="relative mt-1.5">
              <Clock4
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <select
                id="years-experience"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                className={[
                  "w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm font-medium shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20",
                  yearsExperience === "" ? "text-slate-400" : "text-slate-900",
                ].join(" ")}
              >
                <option value="">
                  {YOE_PLACEHOLDER_LABEL}
                </option>
                {YOE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
            </div>
          </div>
        </div>
        <JdUploadZone />
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSearch}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            <BarChart2 className="h-4 w-4 shrink-0" aria-hidden />
            Generate Benchmark
          </button>
        </div>
      </section>

      <div
        className="border-t-2 border-slate-200/90 bg-slate-50/30 pt-10 pb-8"
        id="modeling-and-results"
      >
        {/* Heading + currency live in recruiter page.tsx sticky summary only */}
        {renderStickyTtcSummary(annualTtcSummaryProps)}

        {/* Scrollable modeling sections — tall enough that main always scrolls under the sticky summary */}
        <div className="mt-10 min-h-[min(72vh,52rem)] space-y-12 pb-8 pt-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <p className="text-sm text-slate-500">
              Adjust the detailed sliders in each area; the total above updates immediately.
            </p>
            <button
              type="button"
              onClick={resetToBenchmarkDefaults}
              className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30 sm:self-center"
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
              Reset to Benchmark Defaults
            </button>
          </div>

          <section
            className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8"
            aria-labelledby="section-pay-rate"
          >
            <div>
              <h2
                id="section-pay-rate"
                className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl"
              >
                Pay rate
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                External range, then your base recommendation and the salary comparison grid.
              </p>
            </div>
            <PagayaBenchmarkRange
              contextRangeUsd={{
                min: Math.min(baseBenchUsd.p25, externalBenchUsd.p25),
                max: Math.max(baseBenchUsd.p90, externalBenchUsd.p90),
              }}
              approvedRangeUsd={{
                internalMedianUsd: baseBenchUsd.p50,
                externalP75Usd: externalBenchUsd.p75,
              }}
            />
            <OfferSlider
              id="offer-base"
              marketNativeCurrency={marketNativeCurrency}
              label="Recommended base salary"
              hint="Pagaya approved band: internal median through external P75. Ticks are external percentiles; internal median is pinned."
              value={canonicalUsdToNative(offerBaseUsd, marketNativeCurrency, fxRate)}
              onValueChange={(n) =>
                setOfferBaseUsd(nativeToCanonicalUsd(n, marketNativeCurrency, fxRate))
              }
              min={baseSlideNative.min}
              max={baseSlideNative.max}
              step={1000}
              benchmarks={externalBenchNative}
              approvedBandNative={pagayaApprovedBandNative}
              internalMedianNative={baseBenchNative.p50}
              benchmarksHeading="External benchmarks (by percentile)"
              displayBaseSalaryCadence
            />
            <div className="mb-3 mt-4 flex items-center justify-end">
              <label className="group flex cursor-pointer items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors group-hover:text-slate-700">
                  Web Search Data
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showWebSearch}
                  onClick={() => setShowWebSearch((on) => !on)}
                  className={[
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
                    showWebSearch ? "bg-blue-600" : "bg-slate-300",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-block h-3.5 w-3.5 rounded-full bg-white transition duration-200 ease-in-out",
                      showWebSearch ? "translate-x-4" : "translate-x-1",
                    ].join(" ")}
                  />
                </button>
              </label>
            </div>
            <div className="pt-2">
              <ComparisonTable
                rows={percentileRowsUsd}
                showWebSearch={showWebSearch}
                webSearchData={webSearchData}
                webSearchLoading={webSearchLoading}
                webSearchError={webSearchError}
              />
            </div>
          </section>

          <section
            className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8"
            aria-labelledby="section-equity"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div>
                <h2
                  id="section-equity"
                  className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl"
                >
                  Equity grant
                </h2>
                <p className="mt-1.5 text-sm text-slate-500">
                  Annualized equity versus the internal percentile curve, then the detailed row.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
                <label
                  htmlFor="pgy-share-price-equity"
                  className="text-[10px] font-bold uppercase tracking-wide text-slate-500"
                >
                  PGY 30d
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="pgy-share-price-equity"
                    type="number"
                    value={pgyStockPrice}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (Number.isFinite(v) && v > 0) {
                        setPgyStockPrice(v);
                      }
                    }}
                    min={0.01}
                    step={0.01}
                    className="w-16 rounded border border-slate-200 px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums"
                    aria-label="PGY Share Price (30d avg) USD"
                  />
                  {Math.abs(pgyStockPrice - DEFAULT_PGY_STOCK_PRICE) > 1e-6 ? (
                    <button
                      type="button"
                      onClick={() => setPgyStockPrice(DEFAULT_PGY_STOCK_PRICE)}
                      className="text-[10px] font-medium text-sky-700 underline"
                    >
                      Reset
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
            <OfferSlider
              id="offer-equity"
              marketNativeCurrency={marketNativeCurrency}
              label="Recommended annualized equity"
              hint="Drag to set the offer; the table uses the same mock curve by percentile."
              value={canonicalUsdToNative(offerEquityUsd, marketNativeCurrency, fxRate)}
              onValueChange={(n) =>
                setOfferEquityUsd(nativeToCanonicalUsd(n, marketNativeCurrency, fxRate))
              }
              min={eqSlideNative.min}
              max={eqSlideNative.max}
              step={1000}
              benchmarks={eqBenchNative}
              estimatedShares={estimatedShares}
            />
            <div className="pt-2">
              <EquityGrantsTable rows={internalEquityRowsUsd} />
            </div>
          </section>

          <section aria-labelledby="section-bonus">
            <div className="mb-4">
              <h2
                id="section-bonus"
                className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl"
              >
                Bonus
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Three independent bonus types. Only target discretionary is included in TTC today.
              </p>
            </div>
            <BonusBreakdownSection
              currency={currency}
              fxRate={fxRate}
              offerBonusUsd={offerBonusUsd}
              onOfferBonusChange={setOfferBonusUsd}
              signingBonusUsd={signingBonusUsd}
              onSigningBonusChange={setSigningBonusUsd}
              oneTimeBonusUsd={oneTimeBonusUsd}
              onOneTimeBonusChange={setOneTimeBonusUsd}
              recommendedBonusUsd={recommendedBonusUsd}
              recommendedSigningUsd={recommendedSigningUsd}
              recommendedOneTimeUsd={recommendedOneTimeUsd}
              discretionaryBenchmarksUsd={bonusBenchUsd}
              signingBenchmarksUsd={MOCK_SIGNING_BONUS_BENCHMARK_USD}
              oneTimeBenchmarksUsd={MOCK_ONE_TIME_BONUS_BENCHMARK_USD}
            />
          </section>

          <p className="rounded-lg border border-slate-200/80 bg-white px-4 py-3 text-sm font-mono text-slate-800 sm:px-5">
            TTC = {formatMoneyDisplay(offerBaseUsd, currency, fxRate)} +{" "}
            {formatMoneyDisplay(offerBonusUsd, currency, fxRate)} +{" "}
            {formatMoneyDisplay(offerEquityUsd, currency, fxRate)} ={" "}
            {formatMoneyDisplay(ttcUsd, currency, fxRate)}
          </p>
        </div>
      </div>
    </div>
  );
}
