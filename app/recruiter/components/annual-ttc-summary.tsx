import type { CurrencyCode } from "@/app/context/global-settings";

/** Props passed from OfferModeler to the recruiter page sticky TTC summary. */
export type AnnualTtcSummaryProps = {
  offerBaseUsd: number;
  offerBonusUsd: number;
  offerEquityUsd: number;
  /** Non-TTC cash (canonical USD); shown in summary when > 0. */
  signingBonusUsd?: number;
  oneTimeBonusUsd?: number;
  marketNativeCurrency: CurrencyCode;
  basePercentileLine?: string;
  bonusPercentileLine?: string;
  equityPercentileLine?: string;
  estimatedShares?: number;
  pgyStockPrice?: number;
  onPgyStockPriceChange?: (priceUsd: number) => void;
  defaultPgyStockPrice?: number;
};
