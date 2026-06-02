import type { CurrencyCode } from "@/app/context/global-settings";

/** Mock market currency for each office / location (native units for that market). */
export function getLocationNativeCurrency(locationValue: string): CurrencyCode {
  if (locationValue === "tel-aviv") return "ILS";
  return "USD";
}
