/**
 * Piecewise linear estimate of cohort percentile (0–100) from internal p25..p90 curve.
 * Below p25, maps [sliderMin, p25) to [~5, 25); at/above p90, maps [p90, sliderMax] to [90, 100).
 */
export function estimatePercentile(
  value: number,
  p25: number,
  p50: number,
  p75: number,
  p90: number,
  sliderMin: number,
  sliderMax: number,
): number {
  if (!Number.isFinite(value)) return 50;

  if (value < p25) {
    if (value < sliderMin) return 0;
    const span = p25 - sliderMin;
    if (span < 0.1) {
      return Math.max(0, 25 * (value / p25) * 0.95);
    }
    return 5 + 20 * ((value - sliderMin) / span);
  }

  if (value < p50) {
    return 25 + 25 * ((value - p25) / (p50 - p25));
  }
  if (value < p75) {
    return 50 + 25 * ((value - p50) / (p75 - p50));
  }
  if (value < p90) {
    return 75 + 15 * ((value - p75) / (p90 - p75));
  }
  {
    const span = sliderMax - p90;
    if (value <= sliderMax) {
      if (span < 0.1) return 90;
      return 90 + 10 * ((value - p90) / span);
    }
  }
  return 100;
}
