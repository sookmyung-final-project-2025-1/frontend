// 공용 타입/상수 한 곳에 모으기

export type TimeRange = '24h' | '7d' | '30d';

export const RANGE_MS: Record<TimeRange, number> = {
  '24h': 24 * 3600_000,
  '7d': 7 * 24 * 3600_000,
  '30d': 30 * 24 * 3600_000,
};

export type DetectionResult = {
  timestamp: string; // ISO
  score: number; // 0..1 (혹은 amount를 score로 매핑)
  prediction: 'fraud' | 'normal';
  confidence: number; // 0..1
  models: { lgbm: number; xgb: number; cat: number };
};

export type StreamMeta = {
  currentVirtualTime: string; // ISO
  isPaused: boolean;
  isStreaming: boolean;
  mode: 'TIMEMACHINE' | 'REALTIME' | string;
  progress?: number; // 0..1
  speedMultiplier: number;
  updatedAt: string; // ISO
};
