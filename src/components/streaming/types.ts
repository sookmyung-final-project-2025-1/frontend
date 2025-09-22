export type TimeRange = '24h' | '7d' | '30d';

export type DetectionResult = {
  timestamp: string;
  score: number;
  prediction: 'fraud' | 'normal';
  confidence: number;
  models: {
    lgbm: number;
    xgb: number;
    cat: number;
  };
};

export type StreamMeta = {
  isStreaming: boolean;
  isPaused: boolean;
  mode: 'REALTIME' | 'TIMEMACHINE';
  speedMultiplier: number;
  progress: number; // 0..1
  currentVirtualTime?: string;
  updatedAt?: string;
};

export type StreamingStatusResponse = {
  isStreaming: boolean;
  isPaused: boolean;
  mode: 'REALTIME' | 'TIMEMACHINE';
  speedMultiplier: number;
  progress: number; // 0..1
  currentVirtualTime?: string;
  updatedAt?: string;
};
