const SERVER_API = process.env.API_PROXY_TARGET;

const isServer = () => typeof window === 'undefined';

function buildUrl(endpoint: string) {
  if (isServer()) {
    return `${SERVER_API}${endpoint}`;
  }
  return `${endpoint}`;
}

// 클라쪽 in-memory accessToken
let clientAccessToken: string | null = null;
export const tokenStore = {
  // 토큰 가져오기
  get: () => (isServer() ? null : clientAccessToken),
  // 서버에서 받아온 accessToken 설정
  set: (t: string | null) => {
    if (!isServer()) clientAccessToken = t;
  },
  // 만료시 토큰 제거
  clear: () => {
    if (!isServer()) clientAccessToken = null;
  },
};

async function safeJson(res: Response): Promise<unknown> {
  if (res.status === 204 || res.status === 205) return undefined;
  const text = await res.text();
  if (!text) return undefined;

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

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

  const url = buildUrl(endpoint);

  if (body)
    init.body =
      contentType === 'application/json' ? JSON.stringify(body) : body;

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

    throw err;
  }

  // data 타입을 T로 고정 (schema 검증)
  const data: T = schema ? schema.parse(raw) : (raw as T);

  return normalize ? normalize(data) : data;
}
