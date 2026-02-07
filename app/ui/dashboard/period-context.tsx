"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type PeriodType = "weekly" | "biweekly" | "monthly" | "yearly";

const DEFAULT: PeriodType = "weekly";

type PeriodContextValue = {
  periodType: PeriodType;
  setPeriodType: (p: PeriodType) => void;
};

const PeriodContext = createContext<PeriodContextValue | undefined>(undefined);

export function PeriodProvider({ children }: { children: React.ReactNode }) {
  const [periodType, setPeriodType] = useState<PeriodType>(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("fd:periodType") : null;
      if (stored) return stored as PeriodType;
    } catch (e) {
      // ignore
    }
    return DEFAULT;
  });

  const setAndStore = (p: PeriodType) => {
    setPeriodType(p);
    try {
      localStorage.setItem("fd:periodType", p);
    } catch (e) {
      // ignore
    }
  };

  const value = useMemo(() => ({ periodType, setPeriodType: setAndStore }), [periodType]);

  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>;
}

export function usePeriod() {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error("usePeriod must be used within PeriodProvider");
  return ctx;
}
