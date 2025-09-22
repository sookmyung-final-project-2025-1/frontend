// src/hooks/queries/useApi.ts
import { ApiError, fetcher } from '@/api/fetcher';
import {
  QueryKey,
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

/* ======================================================================
   1970s ↔ 2025 연도 시프트 유틸 (타임존/시각은 유지하고 '연도'만 이동)
   - 쿼리스트링(startTime/endTime 등)과 JSON 바디/응답에 공통 적용
   - 서버는 'YYYY-MM-DDTHH:mm:ss' (오프셋 없는 LocalDateTime)도 받으므로
     ISO(Z) + Local(No TZ) 두 형식 모두 인식/변환
   ====================================================================== */

type TemporalDirection = 'toLegacy' | 'fromLegacy';

const temporalConfig = {
  legacyBaseYear: 1970, // 서버 기준
  modernBaseYear: 2025, // 화면 기준
  enabled: true,
  dateKeyPatterns: [
    /(Time|Date|At|DT|Timestamp)$/i, // createdAt, updatedDT, transactionTime, ...
    /^(start|end)(Time|Date)$/i, // startTime, endTime
    /^from$/i,
    /^to$/i,
    /^since$/i,
    /^until$/i,
  ],
};

const deltaYears = (dir: TemporalDirection) =>
  (temporalConfig.modernBaseYear - temporalConfig.legacyBaseYear) *
  (dir === 'fromLegacy' ? +1 : -1);

const isDateKey = (k: string) =>
  temporalConfig.dateKeyPatterns.some((re) => re.test(k));

/** ISO: 2025-09-22T12:34:56Z / 2025-09-22T12:34:56.789Z / +09:00 오프셋 포함 */
const ISO_FLEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;
const isISO = (s: unknown): s is string =>
  typeof s === 'string' && ISO_FLEX.test(s);

/** Local no-tz: 2025-09-22T12:34:56 (오프셋 없음, 서버 요구 형식) */
const LOCAL_NO_TZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
const isLocalNoTz = (s: unknown): s is string =>
  typeof s === 'string' && LOCAL_NO_TZ.test(s);

const pad = (n: number) => String(n).padStart(2, '0');

function shiftISO(iso: string, years: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString();
}

function shiftLocalY(local: string, years: number): string {
  // yyyy-MM-ddTHH:mm:ss
  const [date, time] = local.split('T');
  const [yy, mm, dd] = date.split('-').map(Number);
  const [HH, MI, SS] = time.split(':').map(Number);
  const newY = yy + years;
  return `${newY}-${pad(mm)}-${pad(dd)}T${pad(HH)}:${pad(MI)}:${pad(SS)}`;
}

/** 객체(JSON) 내 문자열 날짜들을 연도 시프트 (깊은 순회) */
function shiftObjectDates<T>(input: T, dir: TemporalDirection): T {
  if (!temporalConfig.enabled || input == null) return input;
  const dy = deltaYears(dir);
  const seen = new WeakSet<object>();

  const walk = (v: any, keyHint?: string): any => {
    if (v == null) return v;

    if (typeof v === 'string') {
      const treat = !keyHint || isDateKey(keyHint);
      if (treat && isISO(v)) return shiftISO(v, dy);
      if (treat && isLocalNoTz(v)) return shiftLocalY(v, dy);
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

/** URL의 querystring(startTime=… 등) 안 날짜 문자열을 연도 시프트 */
function shiftEndpointDates(url: string, dir: TemporalDirection): string {
  if (!temporalConfig.enabled) return url;

  // 상대/절대 모두 처리되게 가짜 베이스 사용
  const u = new URL(url, 'http://_dummy.base');
  const dy = deltaYears(dir);

  u.searchParams.forEach((raw, key) => {
    if (!raw) return;
    if (!isDateKey(key)) return;

    if (isISO(raw)) {
      u.searchParams.set(key, shiftISO(raw, dy));
      return;
    }
    if (isLocalNoTz(raw)) {
      u.searchParams.set(key, shiftLocalY(raw, dy));
      return;
    }
    // 다른 형식은 변환하지 않음
  });

  const path =
    u.pathname +
    (u.search ? `?${u.searchParams.toString()}` : '') +
    (u.hash || '');
  return /^https?:\/\//.test(url) ? u.toString() : path;
}

/* ======================================================================
   공통 타입
   ====================================================================== */
type FetchOptionsType = {
  contentType?: 'application/json' | 'multipart/form-data';
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
};

type UseQueryProps<T> = {
  queryKey: QueryKey;
  queryOptions: {
    endpoint: string;
    authorization?: boolean;
  };
  fetchOptions?: FetchOptionsType;
  responseSchema?: { parse: (v: unknown) => T };
};

// fetcher가 허용하는 메서드만 사용 (PATCH 미포함)
type Method = 'POST' | 'PUT' | 'DELETE';

type MutationOptions<TResponse, TVariables> = {
  method: Method;
  endpoint: string | ((vars: TVariables) => string);
  body?: (vars: TVariables) => unknown;
  contentType?: 'application/json' | 'multipart/form-data';
  authorization?: boolean;
  requestSchema?: { parse: (v: unknown) => TVariables };
  responseSchema?: { parse: (v: unknown) => TResponse };
  invalidateKeys?: QueryKey[];
  onSuccess?: (data?: TResponse) => void;
  onError?: (error: ApiError) => void;
};

/* ======================================================================
   useApiQuery (GET)
   - endpoint의 startTime/endTime 등 날짜 쿼리를 요청 직전 1970대로 시프트
   - 응답은 2025로 시프트 후 responseSchema(parse) 적용
   ====================================================================== */
export function useApiQuery<T>({
  queryKey,
  queryOptions,
  fetchOptions,
  responseSchema,
}: UseQueryProps<T>) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const shiftedEndpoint = shiftEndpointDates(
        queryOptions.endpoint,
        'toLegacy'
      );

      // fetcher의 schema는 건너뛰고, 응답을 우리가 후처리
      const raw = await fetcher<unknown>({
        method: 'GET',
        endpoint: shiftedEndpoint,
        authorization: queryOptions?.authorization,
        contentType: fetchOptions?.contentType,
        schema: undefined,
      });

      const restored = shiftObjectDates(raw, 'fromLegacy');
      return responseSchema
        ? responseSchema.parse(restored as unknown)
        : (restored as T);
    },
    enabled: fetchOptions?.enabled ?? true,
    staleTime: fetchOptions?.staleTime,
    gcTime: fetchOptions?.gcTime,
  });
}

/* ======================================================================
   useApiMutation (POST/PUT/DELETE)
   - endpoint 함수형이면 원본으로 만들고 → 쿼리 ISO/Local을 1970대로 시프트
   - body(JSON)는 1970대로 시프트
   - 응답은 2025로 시프트 후 responseSchema(parse) 적용
   ====================================================================== */
export function useApiMutation<TResponse, TVariables = void>(
  opts: MutationOptions<TResponse, TVariables>
): UseMutationResult<TResponse, ApiError, TVariables> {
  const qc = useQueryClient();

  return useMutation<TResponse, ApiError, TVariables>({
    mutationFn: async (vars: TVariables) => {
      const safeVars = opts.requestSchema
        ? opts.requestSchema.parse(vars as unknown)
        : vars;

      const endpointRaw =
        typeof opts.endpoint === 'function'
          ? opts.endpoint(safeVars)
          : opts.endpoint;

      // 쿼리스트링 날짜 변환
      const endpoint = shiftEndpointDates(endpointRaw, 'toLegacy');

      // 바디 날짜 변환
      const bodyRaw =
        typeof opts.body === 'function'
          ? opts.body(safeVars)
          : (safeVars as unknown);

      const bodyShifted =
        bodyRaw && typeof bodyRaw === 'object'
          ? shiftObjectDates(bodyRaw, 'toLegacy')
          : bodyRaw;

      // fetcher의 schema는 건너뛰고 직접 후처리
      const raw = await fetcher<unknown>({
        method: opts.method, // 'POST' | 'PUT' | 'DELETE'
        endpoint,
        body: bodyShifted,
        authorization: opts.authorization ?? true,
        contentType: opts.contentType ?? 'application/json',
        schema: undefined,
      });

      const restored = shiftObjectDates(raw, 'fromLegacy');
      return (
        opts.responseSchema
          ? opts.responseSchema.parse(restored as unknown)
          : restored
      ) as TResponse;
    },

    onSuccess: (data) => {
      if (opts.invalidateKeys?.length) {
        for (const key of opts.invalidateKeys) {
          qc.setQueryData(key, data);
          qc.invalidateQueries({ queryKey: key });
        }
      }
      opts.onSuccess?.(data);
    },

    onError: (error) => {
      opts.onError?.(error as ApiError);
    },
  });
}
