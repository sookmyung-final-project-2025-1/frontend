// src/lib/temporal/TemporalProvider.tsx
'use client';

import React, { createContext, useContext, useMemo } from 'react';
import {
  defaultTemporalConfig,
  mapObjectDates,
  type TemporalConfig,
  type TemporalDirection,
} from './index';

type TemporalContextValue = {
  config: TemporalConfig;
  setEnabled: (enabled: boolean) => void; // 필요시 확장
  transform: <T>(val: T, dir: TemporalDirection) => T;
};

const TemporalContext = createContext<TemporalContextValue | null>(null);

export function TemporalProvider({
  children,
  config,
}: {
  children: React.ReactNode;
  config?: Partial<TemporalConfig>;
}) {
  const merged = { ...defaultTemporalConfig, ...(config ?? {}) };

  const value = useMemo<TemporalContextValue>(() => {
    return {
      config: merged,
      setEnabled: () => {},
      transform: (val, dir) => mapObjectDates(val, dir, merged),
    };
  }, [merged]);

  return (
    <TemporalContext.Provider value={value}>
      {children}
    </TemporalContext.Provider>
  );
}

export function useTemporal() {
  const ctx = useContext(TemporalContext);
  if (!ctx) throw new Error('useTemporal must be used within TemporalProvider');
  return ctx;
}
