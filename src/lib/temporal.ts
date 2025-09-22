// src/lib/temporal.ts
// “연도 시프트” 유틸 (timezone은 유지, 연도만 이동)
export type TemporalDirection = 'toLegacy' | 'fromLegacy';

export interface TemporalConfig {
  legacyBaseYear: number; // 서버 기준(예: 1970)
  modernBaseYear: number; // 화면 기준(예: 2025)
  enabled: boolean;
  // 날짜로 인식할 키 이름 패턴 (쿼리파라미터/바디 공통)
  dateKeyPatterns: RegExp[];
}

export const defaultTemporalConfig: TemporalConfig = {
  legacyBaseYear: 1970,
  modernBaseYear: 2025,
  enabled: true,
  dateKeyPatterns: [
    /(Time|Date|At|DT|Timestamp)$/i, // createdAt, updatedDT, transactionTime…
    /^(start|end)(Time|Date)$/i, // startTime, endTime
    /^from$/i,
    /^to$/i,
    /^since$/i,
    /^until$/i,
  ],
};

const ISO_MS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export function isISODateString(s: unknown): s is string {
  return typeof s === 'string' && ISO_MS.test(s);
}

function shiftISO(iso: string, years: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString(); // 필요하면 .replace(/\.\d{3}Z$/, 'Z')
}

function offset(dir: TemporalDirection, cfg: TemporalConfig) {
  const delta = cfg.modernBaseYear - cfg.legacyBaseYear;
  return dir === 'fromLegacy' ? +delta : -delta;
}

function isDateKey(key: string, cfg: TemporalConfig) {
  return cfg.dateKeyPatterns.some((re) => re.test(key));
}

/** 바디(JSON) 안의 ISO 문자열 전역 시프트 */
export function shiftObjectDates<T>(
  input: T,
  dir: TemporalDirection,
  cfg = defaultTemporalConfig
): T {
  if (!cfg.enabled || input == null) return input;
  const delta = offset(dir, cfg);
  const seen = new WeakSet<object>();

  const walk = (v: any, keyHint?: string): any => {
    if (v == null) return v;

    if (typeof v === 'string') {
      if (isISODateString(v) && (!keyHint || isDateKey(keyHint, cfg) || true)) {
        return shiftISO(v, delta);
      }
      return v;
    }
    if (Array.isArray(v)) return v.map((x) => walk(x, keyHint));
    if (typeof v === 'object') {
      if (seen.has(v)) return v;
      seen.add(v);
      const out: any = {};
      for (const [k, vv] of Object.entries(v)) out[k] = walk(vv, k);
      return out;
    }
    return v;
  };

  return walk(input) as T;
}

/** URL 문자열의 querystring(startTime=… 등) 안 ISO를 시프트 */
export function shiftEndpointDates(
  url: string,
  dir: TemporalDirection,
  cfg = defaultTemporalConfig
): string {
  if (!cfg.enabled) return url;
  // 상대/절대 모두 파싱되게 가짜 베이스 붙임
  const u = new URL(url, 'http://_dummy.base');
  const delta = offset(dir, cfg);

  u.searchParams.forEach((raw, key) => {
    if (!raw) return;
    if (!isDateKey(key, cfg)) return;
    if (!isISODateString(raw)) return;
    u.searchParams.set(key, shiftISO(raw, delta));
  });

  // 원래가 상대경로였다면 상대경로로 돌려줌
  const path =
    u.pathname +
    (u.search ? `?${u.searchParams.toString()}` : '') +
    (u.hash || '');
  if (!/^https?:\/\//.test(url)) return path;
  return u.toString();
}
