// src/lib/temporal/index.ts
// 1970s ↔ 2025년 “연도 시프트” 어댑터 (타임존은 손대지 않음: 로컬/UTC 그대로 유지)
export type TemporalDirection = 'toLegacy' | 'fromLegacy';

export interface TemporalConfig {
  /** 서버의 기준 연도 (예: 1970) */
  legacyBaseYear: number;
  /** 화면에 보일 기준 연도 (예: 2025) */
  modernBaseYear: number;
  /** 어떤 필드를 날짜로 볼지: 키 이름 패턴 */
  dateKeyPatterns: RegExp[];
  /** 자동 변환 on/off */
  enabled: boolean;
}

export const defaultTemporalConfig: TemporalConfig = {
  legacyBaseYear: 1970,
  modernBaseYear: 2025,
  enabled: true,
  // 흔한 날짜 필드 키 패턴들
  dateKeyPatterns: [
    /(Time|Date|At|DT|Timestamp)$/i, // transactionTime, createdAt, updatedDT 등
    /^time$/i, // time
    /^date$/i, // date
  ],
};

export function yearOffset(cfg: TemporalConfig) {
  return cfg.modernBaseYear - cfg.legacyBaseYear;
}

export function isISODateString(v: unknown): v is string {
  return (
    typeof v === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v)
  );
}

// 밀리초 보존 / 초 단위까지만 원하면 마지막 .000Z → Z로 바꿔도 됨
function addYearsISO(iso: string, years: number): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString();
}

function shouldTreatAsDateKey(key: string, cfg: TemporalConfig) {
  return cfg.dateKeyPatterns.some((re) => re.test(key));
}

/** 객체 내 모든 날짜 필드(ISO 문자열)를 연도 시프트 (깊은 순회) */
export function mapObjectDates<T>(
  input: T,
  dir: TemporalDirection,
  cfg: TemporalConfig = defaultTemporalConfig
): T {
  if (!cfg.enabled || input == null) return input;

  const delta = yearOffset(cfg) * (dir === 'fromLegacy' ? +1 : -1);
  const seen = new WeakSet<object>();

  const walk = (val: any, keyHint?: string): any => {
    if (val == null) return val;

    // ISO 문자열 직접 변환 (키 힌트가 날짜일 확률이 높거나, 값 자체가 ISO)
    if (typeof val === 'string') {
      const isLikelyDate =
        isISODateString(val) || (keyHint && shouldTreatAsDateKey(keyHint, cfg));
      if (isLikelyDate && isISODateString(val)) {
        return addYearsISO(val, delta);
      }
      return val;
    }

    if (Array.isArray(val)) {
      return val.map((v) => walk(v, keyHint));
    }

    if (typeof val === 'object') {
      if (seen.has(val)) return val;
      seen.add(val);
      const out: any = Array.isArray(val) ? [] : {};
      for (const [k, v] of Object.entries(val)) {
        out[k] = walk(v, k);
      }
      return out;
    }

    return val;
  };

  return walk(input) as T;
}

/** 개별 ISO 값 변환 헬퍼 */
export function toLegacyISO(
  iso: string,
  cfg: TemporalConfig = defaultTemporalConfig
) {
  return addYearsISO(iso, -yearOffset(cfg));
}
export function fromLegacyISO(
  iso: string,
  cfg: TemporalConfig = defaultTemporalConfig
) {
  return addYearsISO(iso, +yearOffset(cfg));
}
