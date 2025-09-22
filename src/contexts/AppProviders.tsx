'use client';

import { PropsWithChildren } from 'react';
import { DashboardDataProvider } from './DashboardActionsContext';
import { StreamingProvider } from './StreamingContext';

export default function AppProviders({
  children,
  initialConfidenceRange,
  initialKpiRange,
  initialSeriesProbRange,
  temporalEnabled = true,
}: PropsWithChildren & {
  initialConfidenceRange?: any;
  initialKpiRange?: any;
  initialSeriesProbRange?: any;
  temporalEnabled?: boolean;
}) {
  const enableStreamingProvider =
    process.env.NEXT_PUBLIC_ENABLE_STREAMING_PROVIDER === '1';

  const streamingWrapped = enableStreamingProvider ? (
    <StreamingProvider>{children}</StreamingProvider>
  ) : (
    children
  );

  return (
    <DashboardDataProvider
      initialConfidenceRange={initialConfidenceRange}
      initialKpiRange={initialKpiRange}
      initialSeriesProbRange={initialSeriesProbRange}
    >
      {streamingWrapped}
    </DashboardDataProvider>
  );
}
