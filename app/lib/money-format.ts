import type { CurrencyCode } from "@/app/context/global-settings";

/**
 * Canonical mock figures in code are stored in USD.
 * For ILS-native markets, `canonicalUsdToNative` yields nominal ILS using context fx (ILS per 1 USD).
 */
export function canonicalUsdToNative(
  usdAmount: number,
  nativeCurrency: CurrencyCode,
  fxRate: number,
): number {
  if (nativeCurrency === "ILS") return Math.round(usdAmount * fxRate);
  return usdAmount;
}

export function nativeToCanonicalUsd(
  amountNative: number,
  nativeCurrency: CurrencyCode,
  fxRate: number,
): number {
  if (nativeCurrency === "ILS") return amountNative / fxRate;
  return amountNative;
}

/** Convert an amount already in `fromNative` units into `toNative` units (same fx definition). */
export function convertBetweenNativeMarkets(
  amount: number,
  fromNative: CurrencyCode,
  toNative: CurrencyCode,
  fxRate: number,
): number {
  if (fromNative === toNative) return amount;
  if (fromNative === "USD" && toNative === "ILS") return Math.round(amount * fxRate);
  return Math.round(amount / fxRate);
}

/** Legacy: interpret `usdAmount` as USD canonical and show in `currency` (display lens). */
export function amountInDisplayCurrency(
  usdAmount: number,
  currency: CurrencyCode,
  fxRate: number,
): number {
  if (currency === "ILS") return usdAmount * fxRate;
  return usdAmount;
}

export function formatMoneyDisplay(
  usdAmount: number,
  currency: CurrencyCode,
  fxRate: number,
): string {
  const n = amountInDisplayCurrency(usdAmount, currency, fxRate);
  const opts: Intl.NumberFormatOptions = {
    maximumFractionDigits: n >= 1000 ? 0 : 2,
    minimumFractionDigits: 0,
  };
  if (currency === "ILS") {
    return `₪${n.toLocaleString("en-US", opts)}`;
  }
  return `$${n.toLocaleString("en-US", opts)}`;
}

function formatPlainAmount(n: number, currency: CurrencyCode): string {
  const opts: Intl.NumberFormatOptions = {
    maximumFractionDigits: n >= 1000 ? 0 : 2,
    minimumFractionDigits: 0,
  };
  if (currency === "ILS") {
    return `₪${n.toLocaleString("en-US", opts)}`;
  }
  return `$${n.toLocaleString("en-US", opts)}`;
}

/**
 * Base salary presentation: when display currency is ILS, show monthly ILS (`/ mo`);
 * when USD, show annual USD (`/ yr`). Canonical amounts remain annual USD.
 */
export function formatBaseSalaryDisplay(
  usdAnnual: number,
  displayCurrency: CurrencyCode,
  fxRate: number,
): string {
  if (displayCurrency === "ILS") {
    const annualIls = amountInDisplayCurrency(usdAnnual, "ILS", fxRate);
    const monthly = annualIls / 12;
    return `${formatPlainAmount(monthly, "ILS")} / mo`;
  }
  return `${formatPlainAmount(usdAnnual, "USD")} / yr`;
}

/** Native annual axis → canonical USD → base salary display string (cadence-aware). */
export function formatNativeAnnualBaseSalaryDisplay(
  nativeAnnual: number,
  marketNativeCurrency: CurrencyCode,
  displayCurrency: CurrencyCode,
  fxRate: number,
): string {
  const usdAnnual = nativeToCanonicalUsd(nativeAnnual, marketNativeCurrency, fxRate);
  return formatBaseSalaryDisplay(usdAnnual, displayCurrency, fxRate);
}
