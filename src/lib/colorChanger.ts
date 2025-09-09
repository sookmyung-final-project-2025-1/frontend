export type RiskLevel = 'veryLow' | 'low' | 'medium' | 'high' | 'critical';

export function seperateLevel(p: number): RiskLevel {
  if (p < 0.2) return 'veryLow';
  if (p < 0.4) return 'low';
  if (p < 0.6) return 'medium';
  if (p < 0.8) return 'high';
  return 'critical';
}

export function riskColor(p: number) {
  const map = {
    veryLow: 'text-amber-600',
    low: 'text-amber-800',
    medium: 'text-orange-800',
    high: 'text-orange-900',
    critical: 'text-[#EA3123]',
  } as const;
  return map[seperateLevel(p)];
}
