'use client';

import { PropsWithChildren } from 'react';
import { DashboardDataProvider } from './DashboardActionsContext';
import { StreamingProvider } from './StreamingContext';

export default function AppProviders({
  children,
  initialConfidenceRange,
  initialKpiRange,
  initialSeriesProbRange,
}: PropsWithChildren & {
  initialConfidenceRange?: any;
  initialKpiRange?: any;
  initialSeriesProbRange?: any;
}) {
  return (
    <DashboardDataProvider
      initialConfidenceRange={initialConfidenceRange}
      initialKpiRange={initialKpiRange}
      initialSeriesProbRange={initialSeriesProbRange}
    >
      <StreamingProvider>{children}</StreamingProvider>
    </DashboardDataProvider>
  );
}
