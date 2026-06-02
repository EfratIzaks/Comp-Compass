"use client";

import { Gift, Percent } from "lucide-react";
import { useGlobalSettings } from "@/app/context/global-settings";
import { formatMoneyDisplay } from "@/app/lib/money-format";

type Props = {
  signingBonusMinUsd: number;
  signingBonusMaxUsd: number;
  annualBonusPercentOfBase: number;
  /** When true, only the stat cards are shown (parent provides the section title). */
  embedded?: boolean;
};

export function InternalBonusesSection({
  signingBonusMinUsd,
  signingBonusMaxUsd,
  annualBonusPercentOfBase,
  embedded = false,
}: Props) {
  const { currency, fxRate } = useGlobalSettings();

  const minStr = formatMoneyDisplay(signingBonusMinUsd, currency, fxRate);
  const maxStr = formatMoneyDisplay(signingBonusMaxUsd, currency, fxRate);
  const rangeLabel = `${minStr} – ${maxStr}`;

  return (
    <section
      aria-labelledby={embedded ? undefined : "bonuses-heading"}
      className="rounded-xl border border-violet-200/80 bg-gradient-to-b from-violet-50/40 to-white p-1 shadow-sm ring-1 ring-violet-200/30"
    >
      {!embedded ? (
        <div className="px-4 pb-2 pt-4 sm:px-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-800/85">
            Total target comp
          </p>
          <h3 id="bonuses-heading" className="mt-1 text-sm font-semibold text-slate-900">
            Bonuses
          </h3>
          <p className="mt-0.5 text-xs text-violet-900/75">
            Policy snapshot — not an offer. Mock data for planning.
          </p>
        </div>
      ) : null}

      <div
        className={[
          "grid gap-3 sm:grid-cols-2 sm:gap-4",
          embedded ? "p-3 sm:p-4" : "p-3 sm:p-4 sm:pt-0",
        ].join(" ")}
      >
        <div className="flex flex-col rounded-lg border border-slate-200/90 bg-white p-4 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 ring-1 ring-sky-100">
            <Gift className="h-4 w-4 text-sky-700" aria-hidden />
          </div>
          <h4 className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Signing bonus
          </h4>
          <p className="mt-1.5 text-lg font-semibold tracking-tight text-slate-900">
            {rangeLabel}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Typical mock range for this level (cash at signing).
          </p>
        </div>

        <div className="flex flex-col rounded-lg border border-slate-200/90 bg-white p-4 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 ring-1 ring-emerald-100">
            <Percent className="h-4 w-4 text-emerald-700" aria-hidden />
          </div>
          <h4 className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Annual bonus eligibility
          </h4>
          <p className="mt-1.5 text-lg font-semibold tracking-tight text-slate-900">
            {annualBonusPercentOfBase}% of base salary
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            On-target as a share of base; actual payout subject to plan rules (mock).
          </p>
        </div>
      </div>
    </section>
  );
}
