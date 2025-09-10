const isBrowser = () => typeof window !== 'undefined';

const SERVER_API_BASE = process.env.API_BASE_URL ?? 'http://localhost:8081';

const PUBLIC_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

function joinUrl(base: string, endpoint: string) {
  const b = base.replace(/\/$/, '');
  const e = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${b}${e}`;
}

function resolveUrl(endpoint: string) {
  if (/^https?:\/\//.test(endpoint)) return endpoint;

  if (isBrowser()) {
    return PUBLIC_API_BASE ? joinUrl(PUBLIC_API_BASE, endpoint) : endpoint;
  }
  return joinUrl(SERVER_API_BASE, endpoint);
}

async function safeJson(res: Response): Promise<unknown> {
  if (res.status === 204 || res.status === 205) return undefined;
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// 클라쪽 in-memory accessToken
let clientAccessToken: string | null = null;
export const tokenStore = {
  get: () => (isBrowser() ? clientAccessToken : null),
  set: (t: string | null) => {
    if (isBrowser()) clientAccessToken = t;
  },
  clear: () => {
    if (isBrowser()) clientAccessToken = null;
  },
};

// fetch 함수 호출 options
type ExecOptions = {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  contentType?: 'application/json' | 'multipart/form-data';
  accessToken?: string | null;
};

// HTTP. 헤더/바디/쿠키만
async function exec({
  endpoint,
  method,
  body,
  contentType = 'application/json',
  accessToken,
}: ExecOptions) {
  // header 설정
  const headers: HeadersInit = {}; //HeadersInit으로 헤더 초기화
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (contentType !== 'multipart/form-data')
    headers['Content-Type'] = contentType;

  const init: RequestInit = {
    method,
    headers,
    credentials: 'include',
    redirect: 'follow',
    cache: 'no-store',
  };

  if (body)
    init.body =
      contentType === 'application/json' ? JSON.stringify(body) : body;

  const url = resolveUrl(endpoint);
  return fetch(url, init);
}

// 에러 핸들링
export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(res: Response, body: unknown) {
    super(`HTTP ${res.status} ${res.statusText}`);
    this.status = res.status;
    this.body = body;
  }
}

// fetcher
export type FetcherOptions<T> = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  body?: any;
  authorization?: boolean;
  contentType?: 'application/json' | 'multipart/form-data';
  schema?: { parse: (v: unknown) => T };
  normalize?: (raw: any) => T;
};

export async function fetcher<T>({
  method,
  endpoint,
  body,
  authorization = true,
  contentType = 'application/json',
  schema,
  normalize,
}: FetcherOptions<T>): Promise<T> {
  let token = authorization ? tokenStore.get() : null;

  let res = await exec({
    endpoint,
    method,
    body,
    contentType,
    accessToken: token,
  });

  const raw = await safeJson(res);

  if (!res.ok) {
    const err = new ApiError(res, raw);

    if (process.env.NODE_ENV === 'development') {
      console.log('[API ERROR]', {
        method,
        endpoint,
        status: err.status,
        rawBody: err.body,
      });
    }
  }

  // data 타입을 T로 고정 (schema 검증)
  const data: T = schema ? schema.parse(raw) : (raw as T);

  return normalize ? normalize(data) : data;
}
