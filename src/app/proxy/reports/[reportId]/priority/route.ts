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

// TLS 검증 우회 에이전트 생성
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

function buildUpstreamHeaders(req: NextRequest): Headers {
  const h = new Headers();

  for (const k of ['accept', 'accept-language', 'user-agent', 'content-type']) {
    const v = req.headers.get(k);
    if (v) h.set(k, v);
  }

  h.set('accept-encoding', 'identity');
  if (process.env.API_SNI_HOST) h.set('host', process.env.API_SNI_HOST!);

  const auth = req.headers.get('authorization');
  if (auth && auth.trim().length > 0) {
    h.set('authorization', auth);
  } else {
    const token = getAccessTokenFromCookie(req);
    if (token) h.set('authorization', `Bearer ${token}`);
  }

  return h;
}

function filterResHeaders(src: Headers) {
  const h = new Headers();
  src.forEach((v, k) => {
    if (!HOP.has(k.toLowerCase())) h.set(k, v);
  });
  return h;
}

// Next.js 15 호환 타입 정의
interface RouteContext {
  params: Promise<{ reportId: string }>;
}

// POST /api/reports/{reportId}/priority - 신고 우선순위 설정
export async function POST(req: NextRequest, context: RouteContext) {
  if (!API) {
    return NextResponse.json(
      { message: 'API_BASE_URL missing' },
      { status: 500 }
    );
  }

  try {
    // params는 Promise이므로 await 필요
    const { reportId } = await context.params;

    const upstreamUrl = `${API}/reports/${reportId}/priority${req.nextUrl.search || ''}`;

    const requestBody = await req.arrayBuffer();

    if (process.env.NODE_ENV === 'development') {
      console.log('📤 REPORT PRIORITY →', upstreamUrl);
      if (requestBody) {
        console.log('Body:', Buffer.from(requestBody).toString('utf8'));
      }
    }

    const fetchOptions: RequestInit & { agent?: any } = {
      method: 'POST',
      headers: buildUpstreamHeaders(req),
      cache: 'no-store',
      redirect: 'follow',
      body: requestBody,
      agent: upstreamUrl.startsWith('https:') ? httpsAgent : undefined,
    };

    const res = await fetch(upstreamUrl, fetchOptions);
    const buf = Buffer.from(await res.arrayBuffer());

    if (process.env.NODE_ENV === 'development') {
      console.log('📥 REPORT PRIORITY ←', res.status);
      if (res.status >= 400) console.log('Err body:', buf.toString('utf8'));
    }

    return new NextResponse(buf, {
      status: res.status,
      headers: filterResHeaders(res.headers),
    });
  } catch (e: any) {
    console.error('❌ REPORT PRIORITY proxy error', {
      message: e?.message,
      code: e?.code,
    });
    return NextResponse.json(
      {
        message: 'Upstream fetch failed',
        error: e?.message ?? String(e),
      },
      { status: 502 }
    );
  }
}
