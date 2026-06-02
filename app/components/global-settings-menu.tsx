"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  DEFAULT_FX_RATE,
  type CurrencyCode,
  useGlobalSettings,
} from "@/app/context/global-settings";

export function GlobalSettingsMenu() {
  const { currency, setCurrency, fxRate, setFxRate } = useGlobalSettings();
  const [open, setOpen] = useState(false);
  const [fxDraft, setFxDraft] = useState(() => String(DEFAULT_FX_RATE));
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const headingId = useId();

  useEffect(() => {
    if (open) setFxDraft(String(fxRate));
  }, [open, fxRate]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      const t = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(t) &&
        buttonRef.current &&
        !buttonRef.current.contains(t)
      ) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const currencies: { code: CurrencyCode; label: string; sub: string }[] = [
    { code: "USD", label: "United States", sub: "USD" },
    { code: "ILS", label: "Israel", sub: "ILS" },
  ];

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? headingId : undefined}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
      >
        <svg
          className="h-4 w-4 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.243l-1.067.998c-.287.267-.398.683-.263 1.064.063.191.12.384.17.58.123.47.01.97-.29 1.33l-1.763 2.216a1.125 1.125 0 0 1-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.075.124-.073.044-.146.087-.22.128-.332.183-.582.495-.645.87l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a4.52 4.52 0 0 1-.22-.128c-.325-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 0 1-1.37-.49l-1.763-2.217a1.125 1.125 0 0 1 .26-1.243l1.067-.998c.287-.267.398-.683.263-1.065-.063-.191-.12-.384-.17-.58-.123-.47-.01-.97.29-1.33l1.763-2.217a1.125 1.125 0 0 1 1.37-.49l1.217.456c.355.133.75.072 1.075-.124.073-.044.146-.087.22-.128.332-.183.582-.495.644-.87l.213-1.28Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
        Global Settings
        <svg
          className={`h-4 w-4 text-slate-400 transition ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="dialog"
          aria-labelledby={headingId}
          className="absolute right-0 z-50 mt-2 w-[min(calc(100vw-2rem),20rem)] rounded-xl border border-slate-200/80 bg-white p-4 shadow-lg shadow-slate-900/10 ring-1 ring-slate-900/5"
        >
          <h2 id={headingId} className="sr-only">
            Global settings
          </h2>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Region &amp; currency
              </p>
              <div className="grid grid-cols-2 gap-2">
                {currencies.map(({ code, label, sub }) => {
                  const selected = currency === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setCurrency(code)}
                      className={[
                        "rounded-lg border px-3 py-2.5 text-left text-sm transition",
                        selected
                          ? "border-sky-500 bg-sky-50 text-sky-950 ring-1 ring-sky-500/30"
                          : "border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-white",
                      ].join(" ")}
                    >
                      <span className="block font-medium">{label}</span>
                      <span className="text-xs text-slate-500">{sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <label
                htmlFor="fx-rate-input"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                FX rate (ILS per 1 USD)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="fx-rate-input"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.01}
                  value={fxDraft}
                  onChange={(e) => setFxDraft(e.target.value)}
                  onBlur={() => {
                    const v = parseFloat(fxDraft);
                    if (Number.isFinite(v) && v > 0) setFxRate(v);
                    else setFxDraft(String(fxRate));
                  }}
                  className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums shadow-inner placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Default {DEFAULT_FX_RATE}. Used for USD ↔ ILS conversions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
