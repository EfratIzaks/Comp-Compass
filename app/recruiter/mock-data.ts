/** Annual compensation in USD (canonical); convert with GlobalSettings for display. */

export type BenchmarkRange = {
  min: number;
  mid: number;
  max: number;
};

export type PercentileRow = {
  percentile: 25 | 50 | 75 | 90;
  currentInternalUsd: number;
  industryStandardUsd: number;
};

export const LEVEL_OPTIONS = [
  { value: "l1", label: "L1" },
  { value: "l2", label: "L2" },
  { value: "l3", label: "L3" },
  { value: "l4", label: "L4" },
  { value: "l5", label: "L5" },
  { value: "l6", label: "L6" },
  { value: "l7", label: "L7" },
  { value: "l8", label: "L8" },
] as const;

/** Optional years-of-experience bands (mock). Empty selection = optional not set in UI. */
export const YOE_OPTIONS = [
  { value: "1-3", label: "1-3" },
  { value: "3-5", label: "3-5" },
  { value: "5-7", label: "5-7" },
  { value: "7-10", label: "7-10" },
  { value: "10-15", label: "10-15" },
  { value: "15+", label: "15+" },
] as const;

export const YOE_PLACEHOLDER_LABEL = "Select YOE (Optional)";

export const LOCATION_OPTIONS = [
  { value: "tel-aviv", label: "Tel Aviv" },
  { value: "nyc", label: "New York" },
  { value: "remote-us", label: "Remote - US" },
] as const;

export const DEFAULT_LOCATION = "tel-aviv" as const;

export const MOCK_ROLE_NAME = "Software Engineer";

export const MOCK_BENCHMARK_RANGE: BenchmarkRange = {
  min: 142_000,
  mid: 168_000,
  max: 198_000,
};

export const MOCK_PERCENTILE_ROWS: PercentileRow[] = [
  { percentile: 25, currentInternalUsd: 138_000, industryStandardUsd: 145_000 },
  { percentile: 50, currentInternalUsd: 160_000, industryStandardUsd: 168_000 },
  { percentile: 75, currentInternalUsd: 182_000, industryStandardUsd: 188_000 },
  { percentile: 90, currentInternalUsd: 205_000, industryStandardUsd: 212_000 },
];

/** Mock web-search salary benchmarks by percentile (USD, annual canonical). */
export const MOCK_WEB_SEARCH_SALARY_USD = {
  p25: 140_000,
  p50: 165_000,
  p75: 190_000,
  p90: 215_000,
} as const;

/** Equity grant value by percentile — internal cohort vs industry benchmark (mock). */
export type InternalEquityByPercentile = {
  percentile: 25 | 50 | 75 | 90;
  currentInternalUsd: number;
  industryStandardUsd: number;
};

export const MOCK_INTERNAL_EQUITY_BY_PERCENTILE: InternalEquityByPercentile[] = [
  { percentile: 25, currentInternalUsd: 38_000, industryStandardUsd: 42_000 },
  { percentile: 50, currentInternalUsd: 65_000, industryStandardUsd: 72_000 },
  { percentile: 75, currentInternalUsd: 88_000, industryStandardUsd: 96_000 },
  { percentile: 90, currentInternalUsd: 115_000, industryStandardUsd: 125_000 },
];

/** Mock signing bonus range (USD). Annual bonus is expressed as % of base for display. */
export const MOCK_SIGNING_BONUS_RANGE_USD = { min: 10_000, max: 20_000 } as const;

/** Mock signing bonus percentile spread (USD) for bonus breakdown sliders. */
export const MOCK_SIGNING_BONUS_BENCHMARK_USD = {
  p25: 5_000,
  p50: 10_000,
  p75: 15_000,
  p90: 25_000,
} as const;

/** Mock one-time bonus percentile spread (USD) for bonus breakdown sliders. */
export const MOCK_ONE_TIME_BONUS_BENCHMARK_USD = {
  p25: 0,
  p50: 0,
  p75: 5_000,
  p90: 10_000,
} as const;

export const MOCK_ANNUAL_BONUS_PCT_OF_BASE = 15;
