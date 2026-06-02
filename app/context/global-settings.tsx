"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CurrencyCode = "USD" | "ILS";

type GlobalSettingsState = {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  fxRate: number;
  setFxRate: (rate: number) => void;
};

const GlobalSettingsContext = createContext<GlobalSettingsState | null>(null);

const DEFAULT_FX_RATE = 3.7;

export function GlobalSettingsProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [fxRate, setFxRateState] = useState<number>(DEFAULT_FX_RATE);

  const setFxRate = useCallback((rate: number) => {
    if (Number.isFinite(rate) && rate > 0) {
      setFxRateState(rate);
    }
  }, []);

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      fxRate,
      setFxRate,
    }),
    [currency, fxRate, setFxRate],
  );

  return (
    <GlobalSettingsContext.Provider value={value}>
      {children}
    </GlobalSettingsContext.Provider>
  );
}

export function useGlobalSettings() {
  const ctx = useContext(GlobalSettingsContext);
  if (!ctx) {
    throw new Error("useGlobalSettings must be used within GlobalSettingsProvider");
  }
  return ctx;
}

export { DEFAULT_FX_RATE };
