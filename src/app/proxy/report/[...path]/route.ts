export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import https from 'https';
import { NextRequest, NextResponse } from 'next/server';

// /api 자동 보정
function normalizeBase(raw?: string | null) {
  if (!raw) return '';
  const b = raw.replace(/\/+$/, '');
  return b.endsWith('/api') ? b : `${b}/api`;
}
const API = normalizeBase(process.env.API_BASE_URL);

// 개발 환경 로깅
if (process.env.NODE_ENV === 'development') {
  console.log('🔗 API Base URL:', API);
}

// TLS 검증 우회 (자체서명 등)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  ...(process.env.API_SNI_HOST ? { servername: process.env.API_SNI_HOST } : {}),
});

// hop-by-hop 헤더
const HOP = new Set([
  'connection',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'trailers',
  'content-encoding',
  'content-length',
]);

/** req.headers에서 accessToken 쿠키 추출 */
function getAccessTokenFromCookie(req: NextRequest): string | null {
  const cookie = req.headers.get('cookie') ?? '';
  for (const part of cookie.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === 'accessToken') {
      const v = rest.join('=').trim();
      return v || null;
    }
  }
  return null;
}

/** 업스트림으로 넘길 헤더 구성 */
function buildUpstreamHeaders(req: NextRequest): Headers {
  const h = new Headers();

  // 보존할 일반 헤더
  for (const k of ['accept', 'accept-language', 'user-agent', 'content-type']) {
    const v = req.headers.get(k);
    if (v) h.set(k, v);
  }

  // 압축 해제 강제
  h.set('accept-encoding', 'identity');

  // SNI 고정 필요 시
  if (process.env.API_SNI_HOST) h.set('host', process.env.API_SNI_HOST!);

  // Authorization: 요청 → 쿠키(accessToken) 순
  const auth = req.headers.get('authorization');
  if (auth && auth.trim().length > 0) {
    h.set('authorization', auth);
  } else {
    const token = getAccessTokenFromCookie(req);
    if (token) h.set('authorization', `Bearer ${token}`);
  }

  // Cookie는 기본 전달 안함 (원하면 여기서 설정)
  return h;
}

function filterResHeaders(src: Headers) {
  const h = new Headers();
  src.forEach((v, k) => {
    if (!HOP.has(k.toLowerCase())) h.set(k, v);
  });
  return h;
}

async function handleProxy(
  req: NextRequest,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  pathSegments: string[] = []
) {
  if (!API) {
    return NextResponse.json(
      { message: 'API_BASE_URL missing' },
      { status: 500 }
    );
  }

  const subPath = pathSegments.length ? `/${pathSegments.join('/')}` : '';
  const upstreamUrl = `${API}/reports${subPath}${req.nextUrl.search || ''}`;

  try {
    const shouldSendBody = !['GET', 'HEAD'].includes(method);
    const requestBody = shouldSendBody ? await req.arrayBuffer() : undefined;

    if (process.env.NODE_ENV === 'development') {
      console.log('📤 REPORTS API 요청:', method, upstreamUrl);
      if (requestBody) {
        const txt = Buffer.from(requestBody).toString('utf8');
        console.log('Body:', txt);
      }
    }

    const fetchOptions: RequestInit & { agent?: any } = {
      method,
      headers: buildUpstreamHeaders(req),
      cache: 'no-store',
      redirect: 'follow',
      // @ts-ignore Node 전용 옵션
      agent: upstreamUrl.startsWith('https:') ? httpsAgent : undefined,
    };
    if (requestBody) fetchOptions.body = requestBody;

    const res = await fetch(upstreamUrl, fetchOptions);

    const buf = Buffer.from(await res.arrayBuffer());
    if (process.env.NODE_ENV === 'development') {
      console.log('📥 REPORTS API 응답:', res.status);
      if (res.status >= 400) console.log('Body:', buf.toString('utf8'));
    }

    return new NextResponse(buf, {
      status: res.status,
      headers: filterResHeaders(res.headers),
    });
  } catch (e: any) {
    console.error('REPORTS proxy error:', {
      message: e?.message,
      code: e?.code,
      url: e?.config?.url ?? upstreamUrl,
    });
    return NextResponse.json(
      {
        message: 'Upstream fetch failed',
        url: upstreamUrl,
        error: e?.message ?? String(e),
      },
      { status: 502 }
    );
  }
}

export async function GET(
  req: NextRequest,
  ctx: { params: { path?: string[] } }
) {
  return handleProxy(req, 'GET', ctx.params.path ?? []);
}
export async function POST(
  req: NextRequest,
  ctx: { params: { path?: string[] } }
) {
  return handleProxy(req, 'POST', ctx.params.path ?? []);
}
export async function PUT(
  req: NextRequest,
  ctx: { params: { path?: string[] } }
) {
  return handleProxy(req, 'PUT', ctx.params.path ?? []);
}
export async function PATCH(
  req: NextRequest,
  ctx: { params: { path?: string[] } }
) {
  return handleProxy(req, 'PATCH', ctx.params.path ?? []);
}
export async function DELETE(
  req: NextRequest,
  ctx: { params: { path?: string[] } }
) {
  return handleProxy(req, 'DELETE', ctx.params.path ?? []);
}
