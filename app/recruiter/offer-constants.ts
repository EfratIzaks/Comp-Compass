/** On-target annual bonus as a share of offer base. */
export const BONUS_PERCENTAGE = 0.15;

/** Mock 30-day trailing average PGY share price (USD) for RSU share estimates. */
export const DEFAULT_PGY_STOCK_PRICE = 14.5;

export type TtcComponentsUsd = {
  offerBaseUsd: number;
  offerBonusUsd: number;
  offerEquityUsd: number;
  signingBonusUsd?: number;
  oneTimeBonusUsd?: number;
};

/**
 * Total target compensation (canonical USD).
 * To include signing or one-time bonuses later, add them to this return.
 */
export function calculateTtcUsd(components: TtcComponentsUsd): number {
  const { offerBaseUsd, offerBonusUsd, offerEquityUsd } = components;
  return offerBaseUsd + offerBonusUsd + offerEquityUsd;
}
