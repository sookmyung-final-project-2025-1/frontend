// fetcher.ts
import { cookies as nextCookies, headers as nextHeaders } from 'next/headers';

const SERVER_API = process.env.API_PROXY_TARGET as string;

// 런타임 판별
const isServer = () => typeof window === 'undefined';

// =====================
// 클라 전용 in-memory 토큰
// (서버에서는 절대 사용 금지)
// =====================
let clientAccessToken: string | null = null;

export const tokenStore = {
  get: () => (isServer() ? null : clientAccessToken),
  set: (t: string | null) => {
    if (!isServer()) clientAccessToken = t;
  },
  clear: () => {
    if (!isServer()) clientAccessToken = null;
  },
};

// =====================
// URL 빌더
// 서버에서는 API 프록시 베이스를 붙이고
// 클라에서는 동일 오리진 상대경로를 그대로 사용
// =====================
function buildUrl(endpoint: string) {
  return isServer() ? `${SERVER_API}${endpoint}` : endpoint;
}

// =====================
// 인증 헤더 생성
// 서버: 쿠키에서 accessToken 읽어 Authorization 설정
// 클라: in-memory tokenStore에서 읽어 설정
// =====================
export async function getAuthHeader(authorization: boolean) {
  if (!authorization) return undefined;

  if (isServer()) {
    const c = await nextCookies(); // 너 환경은 Promise 타입
    const token = c.get('accessToken')?.value ?? null; // 쿠키 키 이름 맞게 수정 가능
    return token ? `Bearer ${token}` : undefined;
  } else {
    const token = tokenStore.get();
    return token ? `Bearer ${token}` : undefined;
  }
}

// =====================
// 공통 Headers 생성
// - multipart/form-data면 Content-Type을 직접 세팅하지 않음(boundary 문제)
// - 서버에서 쿠키/UA/Lang 전달
// =====================
async function buildHeaders(
  contentType: 'application/json' | 'multipart/form-data',
  authorization: boolean
) {
  const h = new Headers();

  const auth = await getAuthHeader(authorization);
  if (auth) h.set('Authorization', auth);

  if (contentType !== 'multipart/form-data') {
    h.set('Content-Type', contentType);
  }

  if (isServer()) {
    // 서버 fetch에는 브라우저 쿠키가 자동으로 안 붙음 → 직접 Cookie 헤더로 전달
    const c = await nextCookies();
    const cookieStr = c.toString();
    if (cookieStr) h.set('Cookie', cookieStr);

    // 프록시/로깅 등에 유용한 헤더 전달(선택)
    const nh = await nextHeaders();
    const ua = nh.get('user-agent');
    const lang = nh.get('accept-language');
    if (ua) h.set('User-Agent', ua);
    if (lang) h.set('Accept-Language', lang);
  }

  return h;
}

// =====================
// 안전 JSON 파서
// =====================
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

// =====================
// 에러 클래스
// =====================
export class ApiError extends Error {
  status: number;
  body: unknown;
  url: string;
  constructor(res: Response, body: unknown) {
    super(`HTTP ${res.status} ${res.statusText}`);
    this.status = res.status;
    this.body = body;
    this.url = res.url;
  }
}

// =====================
// 내부 exec (HTTP 호출기)
// =====================
type ExecOptions = {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  contentType: 'application/json' | 'multipart/form-data';
  authorization: boolean;
  redirect?: RequestRedirect; // 'follow' | 'manual'
};

async function exec({
  endpoint,
  method,
  body,
  contentType,
  authorization,
  redirect = 'follow',
}: ExecOptions) {
  const url = buildUrl(endpoint);
  const headers = await buildHeaders(contentType, authorization);

  const init: RequestInit = {
    method,
    headers,
    credentials: 'include', // 브라우저에서만 쿠키 전송 의미, 서버에선 무의미(위에서 Cookie 수동 세팅)
    redirect,
    cache: 'no-store',
  };

  // GET에 body가 붙지 않도록 방지
  if (body && method !== 'GET') {
    init.body =
      contentType === 'application/json' ? JSON.stringify(body) : body;
  }

  return fetch(url, init);
}

// =====================
// 외부용 fetcher 제네릭
// =====================
export type FetcherOptions<T> = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  body?: any;
  authorization?: boolean;
  contentType?: 'application/json' | 'multipart/form-data';
  schema?: { parse: (v: unknown) => T }; // 예: zod
  normalize?: (raw: any) => T;
  redirect?: RequestRedirect; // 필요시 'manual'로 바꿔 리다이렉트 감지
};

export async function fetcher<T>({
  method,
  endpoint,
  body,
  authorization = true,
  contentType = 'application/json',
  schema,
  normalize,
  redirect = 'follow',
}: FetcherOptions<T>): Promise<T> {
  const res = await exec({
    endpoint,
    method,
    body,
    contentType,
    authorization,
    redirect,
  });

  // (옵션) 인증 만료로 인한 리다이렉트 감지 로직을 쓰고 싶으면 아래 사용
  // if (res.status === 301 || res.status === 302) {
  //   const loc = res.headers.get('location') || '';
  //   throw new ApiError(res, { message: 'Redirected', location: loc });
  // }

  const raw = await safeJson(res);

  if (!res.ok) {
    // 개발 시 디버깅에 도움
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[API ERROR]', {
        method,
        endpoint,
        url: res.url,
        status: res.status,
        rawBody: raw,
      });
    }
    throw new ApiError(res, raw);
  }

  const data: T = schema ? schema.parse(raw) : (raw as T);
  return normalize ? normalize(data) : data;
}
