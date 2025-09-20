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

// GET /api/reports/stats - 신고 통계
export async function GET(req: NextRequest) {
  if (!API) {
    return NextResponse.json(
      { message: 'API_BASE_URL missing' },
      { status: 500 }
    );
  }

  const upstreamUrl = `${API}/reports/stats${req.nextUrl.search || ''}`;

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 REPORTS STATS →', upstreamUrl);
    }

    const fetchOptions: RequestInit & { agent?: any } = {
      method: 'GET',
      headers: buildUpstreamHeaders(req),
      cache: 'no-store',
      redirect: 'follow',
      // @ts-ignore Node 전용 옵션
      agent: upstreamUrl.startsWith('https:') ? httpsAgent : undefined,
    };

    const res = await fetch(upstreamUrl, fetchOptions);
    const buf = Buffer.from(await res.arrayBuffer());

    if (process.env.NODE_ENV === 'development') {
      console.log('📥 REPORTS STATS ←', res.status);
      if (res.status >= 400) console.log('Err body:', buf.toString('utf8'));
    }

    return new NextResponse(buf, {
      status: res.status,
      headers: filterResHeaders(res.headers),
    });
  } catch (e: any) {
    console.error('❌ REPORTS STATS proxy error', {
      message: e?.message,
      code: e?.code,
      url: upstreamUrl,
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
