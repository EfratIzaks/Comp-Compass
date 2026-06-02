"use client";

import type { CurrencyCode } from "@/app/context/global-settings";
import { useGlobalSettings } from "@/app/context/global-settings";

export function CurrencyToggleInline() {
  const { currency, setCurrency } = useGlobalSettings();

  const modes: CurrencyCode[] = ["USD", "ILS"];

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:justify-center sm:gap-4 sm:py-3.5"
      role="group"
      aria-label="Display currency"
    >
      <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
        Currency
      </span>
      <div className="flex items-center rounded-lg bg-slate-100 p-1 ring-1 ring-slate-200/80">
        {modes.map((code) => {
          const active = currency === code;
          const label = code === "USD" ? "USD" : "ILS";
          return (
            <button
              key={code}
              type="button"
              onClick={() => setCurrency(code)}
              aria-pressed={active}
              className={[
                "min-w-[4.25rem] rounded-md px-4 py-2 text-sm font-semibold transition",
                active
                  ? "bg-white text-sky-900 shadow-sm ring-1 ring-sky-400/60"
                  : "text-slate-600 hover:text-slate-900",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
