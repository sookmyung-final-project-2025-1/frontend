const SERVER_API = process.env.API_PROXY_TARGET as string;

// 런타임 판별
const isServer = () => typeof window === 'undefined';

// ===== 토큰 관리 (쿠키 기반) =====
export const tokenStore = {
  get: (): string | null => {
    if (isServer()) return null;

    // 쿠키에서 accessToken 읽기
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find((cookie) =>
      cookie.trim().startsWith('accessToken=')
    );

    if (tokenCookie) {
      return tokenCookie.split('=')[1].trim();
    }
    return null;
  },

  set: (token: string | null, maxAge?: number) => {
    if (isServer()) return;

    if (token) {
      // 기본 15분 만료 (900초)
      const expiry = maxAge || 900;
      document.cookie = `accessToken=${token}; path=/; max-age=${expiry}; secure; samesite=strict`;
    } else {
      // 토큰 삭제
      document.cookie =
        'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict';
    }
  },

  clear: () => {
    if (isServer()) return;
    document.cookie =
      'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict';
  },

  // 세션 스토리지 옵션 (대안)
  setToSession: (token: string | null) => {
    if (isServer()) return;

    if (token) {
      sessionStorage.setItem('accessToken', token);
    } else {
      sessionStorage.removeItem('accessToken');
    }
  },

  getFromSession: (): string | null => {
    if (isServer()) return null;
    return sessionStorage.getItem('accessToken');
  },

  clearSession: () => {
    if (isServer()) return;
    sessionStorage.removeItem('accessToken');
  },
};

// URL 빌더: 서버에선 프록시 베이스, 클라에선 상대경로
function buildUrl(endpoint: string) {
  return isServer() ? `${SERVER_API}${endpoint}` : endpoint;
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

// 내부 실행기
type ExecOptions = {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  contentType: 'application/json' | 'multipart/form-data';
  authorization: boolean;

  // ===== 서버에서 주입 가능한 옵션들 =====
  // pages: getServerSideProps / API Routes => req.headers.cookie
  // app:   Route Handler / Server Component => cookies().toString()
  serverCookieHeader?: string; // ex) 'key=value; ...'
  serverForwardHeaders?: HeadersInit; // ex) { 'User-Agent': '...', 'Accept-Language': '...' }

  // ===== 클라/서버 공통 =====
  accessTokenOverride?: string | null; // 서버에서 토큰 직접 주입하고 싶을 때
  redirect?: RequestRedirect; // 'follow' | 'manual'
  useSessionStorage?: boolean; // 세션 스토리지 사용 여부
};

async function exec({
  endpoint,
  method,
  body,
  contentType,
  authorization,
  serverCookieHeader,
  serverForwardHeaders,
  accessTokenOverride,
  redirect = 'follow',
  useSessionStorage = false,
}: ExecOptions) {
  const url = buildUrl(endpoint);

  const headers = new Headers();

  // Authorization 결정 로직
  let accessToken: string | null = null;
  if (authorization) {
    if (typeof accessTokenOverride === 'string') {
      accessToken = accessTokenOverride;
    } else if (!isServer()) {
      // 쿠키 또는 세션 스토리지에서 토큰 가져오기
      accessToken = useSessionStorage
        ? tokenStore.getFromSession()
        : tokenStore.get();
    }
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  }

  if (contentType !== 'multipart/form-data') {
    headers.set('Content-Type', contentType);
  }

  // 서버에서 호출 시 브라우저 쿠키 자동전달 X → 직접 Cookie 헤더로 주입
  if (isServer() && serverCookieHeader) {
    headers.set('Cookie', serverCookieHeader);
  }

  // 서버에서 전달하고 싶은 추가 헤더(UA, Lang 등) 주입
  if (isServer() && serverForwardHeaders) {
    for (const [k, v] of Object.entries(serverForwardHeaders)) {
      if (typeof v !== 'undefined' && v !== null) headers.set(k, String(v));
    }
  }

  const init: RequestInit = {
    method,
    headers,
    credentials: 'include',
    redirect,
    cache: 'no-store',
  };

  if (body && method !== 'GET') {
    init.body =
      contentType === 'application/json' ? JSON.stringify(body) : body;
  }

  return fetch(url, init);
}

// 외부용 fetcher
export type FetcherOptions<T> = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  body?: any;
  authorization?: boolean;
  contentType?: 'application/json' | 'multipart/form-data';
  schema?: { parse: (v: unknown) => T };
  normalize?: (raw: any) => T;
  redirect?: RequestRedirect;
  useSessionStorage?: boolean; // 세션 스토리지 사용 여부

  // 서버 전용 주입 필드
  serverCookieHeader?: string;
  serverForwardHeaders?: HeadersInit;
  accessTokenOverride?: string | null;
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
  serverCookieHeader,
  serverForwardHeaders,
  accessTokenOverride,
  useSessionStorage = false,
}: FetcherOptions<T>): Promise<T> {
  const res = await exec({
    endpoint,
    method,
    body,
    contentType,
    authorization,
    serverCookieHeader,
    serverForwardHeaders,
    accessTokenOverride,
    redirect,
    useSessionStorage,
  });

  const raw = await safeJson(res);

  if (!res.ok) {
    if (process.env.NODE_ENV === 'development') {
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

// 로그인 성공 시 토큰 저장 헬퍼
export const handleLoginSuccess = (
  accessToken: string,
  expiresIn?: number,
  useSessionStorage: boolean = false
) => {
  if (useSessionStorage) {
    tokenStore.setToSession(accessToken);
  } else {
    // 쿠키에 저장 (기본 15분, 서버에서 expiresIn 제공시 해당 값 사용)
    tokenStore.set(accessToken, expiresIn);
  }
};

// 로그아웃 헬퍼
export const handleLogout = (useSessionStorage: boolean = false) => {
  if (useSessionStorage) {
    tokenStore.clearSession();
  } else {
    tokenStore.clear();
  }
};
