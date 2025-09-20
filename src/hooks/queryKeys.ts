export const QUERY_KEYS = {
  emailCheck: (email: string) => ['emailCheck', email],
  businessNumCheck: (businessNumber: string) => [
    'businessNumber',
    businessNumber,
  ],
  // dashboard
  timeState: ['time', 'state'] as const,
  metricsKpi: (window: string) => ['metrics', 'kpi', window] as const,
  metricsConfidence: (range: string) =>
    ['metrics', 'confidence', range] as const,
  featureImportance: ['metrics', 'feature-importance'] as const,
  seriesProb: ['series', 'prob'] as const,
  health: ['health'] as const,
  weight: ['weight'] as const,
  modelVersion: ['model', 'version'] as const,
} as const;
