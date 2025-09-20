export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import https from 'https';
import { NextRequest, NextResponse } from 'next/server';

// 전역 TLS 설정
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

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

// 🔥 Next.js 15 호환 타입 정의
interface RouteContext {
  params: Promise<{ version: string }>;
}

// ✅ GET /proxy/model/versions/[version]/metadata
export async function GET(req: NextRequest, context: RouteContext) {
  console.log('🎯 Metadata GET handler called');

  if (!API) {
    console.error('❌ API_BASE_URL missing');
    return NextResponse.json(
      { message: 'API_BASE_URL missing' },
      { status: 500 }
    );
  }

  try {
    // params는 Promise이므로 await 필요
    const { version } = await context.params;
    console.log('📍 Version parameter:', version);

    if (!version) {
      return NextResponse.json(
        { message: 'version parameter missing' },
        { status: 400 }
      );
    }

    const upstreamUrl = `${API}/model/versions/${encodeURIComponent(version)}/metadata${req.nextUrl.search || ''}`;
    console.log('📤 Request to:', upstreamUrl);

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

    console.log('📥 Response status:', res.status);

    if (process.env.NODE_ENV === 'development') {
      const responseText = buf.toString('utf8');
      if (res.status >= 400) {
        console.log('❌ Error Response:', responseText);
      } else {
        console.log(
          '✅ Success Response (first 200 chars):',
          responseText.substring(0, 200)
        );
      }
    }

    return new NextResponse(buf, {
      status: res.status,
      headers: filterResHeaders(res.headers),
    });
  } catch (e: any) {
    console.error('❌ Metadata proxy error:', {
      message: e?.message,
      code: e?.code,
      stack: e?.stack?.split('\n').slice(0, 3),
    });

    return NextResponse.json(
      {
        message: 'Upstream fetch failed',
        error: e?.message ?? String(e),
        code: e?.code ?? null,
        timestamp: new Date().toISOString(),
      },
      { status: 502 }
    );
  }
}
