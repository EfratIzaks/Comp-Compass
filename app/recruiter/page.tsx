"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGlobalSettings, type CurrencyCode } from "@/app/context/global-settings";
import {
  amountInDisplayCurrency,
  formatBaseSalaryDisplay,
  formatMoneyDisplay,
} from "@/app/lib/money-format";
import { CurrencyToggleInline } from "@/app/recruiter/components/currency-toggle-inline";
import type { AnnualTtcSummaryProps } from "@/app/recruiter/components/annual-ttc-summary";
import { calculateTtcUsd } from "@/app/recruiter/offer-constants";
import { OfferModeler } from "@/app/recruiter/offer-modeler";

function formatCompactFirstYearExtras(
  usd: number,
  currency: CurrencyCode,
  fxRate: number,
): string {
  const n = amountInDisplayCurrency(usd, currency, fxRate);
  const symbol = currency === "ILS" ? "₪" : "$";
  const amount =
    n > 999 ? `${Math.round(n / 1000)}k` : n.toLocaleString("en-US");
  return `+${symbol}${amount}`;
}

type StickyProps = {
  isScrolled: boolean;
  onRequestApproval: () => void;
} & AnnualTtcSummaryProps;

function RecruiterAnnualTtcStickySummary(props: StickyProps) {
  const { isScrolled, onRequestApproval, ...summaryProps } = props;
  const {
    offerBaseUsd,
    offerBonusUsd,
    offerEquityUsd,
    signingBonusUsd = 0,
    oneTimeBonusUsd = 0,
    marketNativeCurrency,
    basePercentileLine,
    bonusPercentileLine,
    equityPercentileLine,
    estimatedShares,
    pgyStockPrice,
    onPgyStockPriceChange,
    defaultPgyStockPrice,
  } = summaryProps;

  const { currency, fxRate } = useGlobalSettings();

  const ttcTotal = calculateTtcUsd({
    offerBaseUsd,
    offerBonusUsd,
    offerEquityUsd,
  });

  const firstYearExtras = signingBonusUsd + oneTimeBonusUsd;

  const showFxLensNote = marketNativeCurrency !== currency;
  const showSharePriceControls =
    estimatedShares !== undefined &&
    pgyStockPrice !== undefined &&
    onPgyStockPriceChange !== undefined &&
    defaultPgyStockPrice !== undefined;
  const sharePriceDiffersFromDefault =
    showSharePriceControls &&
    Math.abs(pgyStockPrice - defaultPgyStockPrice) > 1e-6;

  const baseDisplay = formatBaseSalaryDisplay(offerBaseUsd, currency, fxRate);
  const bonusDisplay = formatMoneyDisplay(offerBonusUsd, currency, fxRate);
  const equityDisplay = formatMoneyDisplay(offerEquityUsd, currency, fxRate);
  const ttcDisplay = formatMoneyDisplay(ttcTotal, currency, fxRate);

  const basePercentileCopy =
    basePercentileLine ?? "Current: ~50th Percentile";
  const bonusPercentileCopy =
    bonusPercentileLine ?? "Current: ~50th Percentile";

  return (
    <div className="sticky top-0 z-50 w-full border-b bg-white/95 shadow-sm backdrop-blur-md transition-all duration-300">
      {isScrolled ? (
        <div className="mx-auto max-w-6xl p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
            <div className="min-w-0 flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="grid grid-cols-4 items-center divide-x divide-slate-200">
                <div className="flex flex-col items-center justify-center py-2">
                  <span className="text-[10px] font-bold uppercase text-slate-500">
                    Base
                  </span>
                  <span className="text-center text-lg font-bold tabular-nums">
                    {baseDisplay}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center py-2">
                  <span className="text-[10px] font-bold uppercase text-slate-500">
                    Bonus
                  </span>
                  <span className="text-center text-lg font-bold tabular-nums">
                    {bonusDisplay}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center py-2">
                  <span className="text-[10px] font-bold uppercase text-slate-500">
                    Equity
                  </span>
                  <span className="text-center text-lg font-bold tabular-nums">
                    {equityDisplay}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-r-lg bg-blue-50 px-2 py-2">
                  <span className="text-[10px] font-bold uppercase text-blue-800">
                    TTC
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold tabular-nums text-blue-900">
                      {ttcDisplay}
                    </span>
                    {firstYearExtras > 0 ? (
                      <span className="whitespace-nowrap rounded-md border border-emerald-200 bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">
                        {formatCompactFirstYearExtras(
                          firstYearExtras,
                          currency,
                          fxRate,
                        )}{" "}
                        Yr 1
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onRequestApproval}
              className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-center text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 sm:self-stretch sm:px-4 sm:text-sm"
            >
              Request Approval
            </button>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-6xl p-3">
          <div className="mb-2 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900">
                Annual Total Compensation Summary
              </h2>
              {showFxLensNote ? (
                <p className="mt-0.5 text-[9px] leading-tight text-slate-500">
                  Converted at 1 USD = {fxRate.toLocaleString("en-US")} ILS
                </p>
              ) : null}
            </div>
            <CurrencyToggleInline />
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            <div className="flex min-h-0 min-w-0 flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-500">
                Base Salary
              </span>
              <span className="mt-1 text-xl font-bold tabular-nums leading-tight text-slate-900">
                {baseDisplay}
              </span>
              <span className="mt-1 truncate text-[10px] text-slate-500">{basePercentileCopy}</span>
              {currency === "ILS" ? (
                <span className="mt-0.5 text-[9px] leading-tight text-slate-400">
                  Monthly base; TTC uses annual.
                </span>
              ) : null}
            </div>

            <div className="flex min-h-0 min-w-0 flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-500">
                Annual Bonus
              </span>
              <span className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                {bonusDisplay}
              </span>
              <span className="mt-1 truncate text-[10px] text-slate-500">{bonusPercentileCopy}</span>
            </div>

            <div className="relative flex min-h-0 min-w-0 flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-1">
                <span className="text-[10px] font-bold uppercase text-slate-500">
                  Equity
                </span>
                {showSharePriceControls ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <label
                      className="text-[8px] font-bold uppercase text-slate-400"
                      htmlFor="pgy-share-price-scroll"
                    >
                      PGY 30d
                    </label>
                    <div className="flex items-center gap-0.5">
                      <input
                        id="pgy-share-price-scroll"
                        type="number"
                        value={pgyStockPrice}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isFinite(v) && v > 0 && onPgyStockPriceChange) {
                            onPgyStockPriceChange(v);
                          }
                        }}
                        min={0.01}
                        step={0.01}
                        className="w-12 rounded border border-slate-200 px-1 text-center text-[10px] font-semibold tabular-nums"
                        aria-label="PGY Share Price (30d avg) USD"
                      />
                      {sharePriceDiffersFromDefault ? (
                        <button
                          type="button"
                          onClick={() => onPgyStockPriceChange?.(defaultPgyStockPrice)}
                          className="text-[8px] font-medium text-sky-700 underline"
                        >
                          Reset
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
              <span className="mt-1 text-xl font-bold tabular-nums leading-tight text-slate-900">
                {equityDisplay}
              </span>
              {estimatedShares !== undefined ? (
                <span className="mt-1 text-[10px] tabular-nums text-slate-500">
                  ~{estimatedShares.toLocaleString("en-US")} RSUs
                </span>
              ) : null}
              {equityPercentileLine ? (
                <span className="mt-0.5 truncate text-[10px] text-slate-500">
                  {equityPercentileLine}
                </span>
              ) : null}
            </div>

            <div className="relative flex flex-col items-center justify-center rounded-lg border border-blue-200 bg-blue-50 p-3 text-center shadow-sm">
              <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-blue-800">
                Total Target Comp
              </span>
              <span className="text-2xl font-extrabold tabular-nums text-blue-900">
                {ttcDisplay}
              </span>
              {firstYearExtras > 0 ? (
                <div className="mt-2 rounded-full border border-emerald-300 bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700 shadow-sm">
                  +{formatMoneyDisplay(firstYearExtras, currency, fxRate)} First-Year
                  Cash
                </div>
              ) : null}
            </div>
          </div>

          {/* Action Row */}
          <div className="mb-1 mt-4 flex justify-end">
            <button
              type="button"
              onClick={onRequestApproval}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Request Approval
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Direct child of AppShell <main> (the scrollport). `min-w-0` / `min-h-0` avoid flex overflow
 * clipping that would break `position: sticky` for nested content.
 */
export default function RecruiterPortalPage() {
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [approvalTtcUsd, setApprovalTtcUsd] = useState<number | null>(null);
  const summaryPropsRef = useRef<AnnualTtcSummaryProps | null>(null);
  const { currency, fxRate } = useGlobalSettings();

  const handleSearch = () => {};

  const openApprovalModal = useCallback(() => {
    const p = summaryPropsRef.current;
    setApprovalTtcUsd(
      p != null
        ? calculateTtcUsd({
            offerBaseUsd: p.offerBaseUsd,
            offerBonusUsd: p.offerBonusUsd,
            offerEquityUsd: p.offerEquityUsd,
          })
        : null,
    );
    setIsApprovalModalOpen(true);
  }, []);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const scrollTop =
        (e.target as HTMLElement)?.scrollTop || window.scrollY || 0;
      setIsScrolled(scrollTop > 40);
    };

    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  return (
    <div className="h-full min-h-0 w-full min-w-0">
      <OfferModeler
        onGenerateBenchmark={handleSearch}
        renderStickyTtcSummary={(summaryProps) => {
          summaryPropsRef.current = summaryProps;
          return (
            <RecruiterAnnualTtcStickySummary
              isScrolled={isScrolled}
              onRequestApproval={openApprovalModal}
              {...summaryProps}
            />
          );
        }}
      />

      {isApprovalModalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">Request Offer Approval</h3>
              <button
                type="button"
                onClick={() => setIsApprovalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                  Candidate Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jane Doe"
                  className="w-full rounded-md border p-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                  Approver
                </label>
                <select className="w-full rounded-md border bg-white p-2 text-sm">
                  <option>Select approver...</option>
                  <option>VP of Engineering</option>
                  <option>VP of Finance</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                  Business Justification
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide context for this offer..."
                  className="w-full rounded-md border p-2 text-sm"
                />
              </div>

              <div className="flex items-center justify-between rounded-md border border-blue-100 bg-blue-50 p-3">
                <span className="text-xs font-bold uppercase text-blue-800">
                  Total Target Comp
                </span>
                <span className="text-lg font-extrabold text-blue-900">
                  {approvalTtcUsd != null
                    ? formatMoneyDisplay(approvalTtcUsd, currency, fxRate)
                    : "—"}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setIsApprovalModalOpen(false)}
                className="rounded-md px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Approval request sent!");
                  setIsApprovalModalOpen(false);
                }}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
