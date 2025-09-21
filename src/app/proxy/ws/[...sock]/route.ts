export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import https from 'https';
import { NextRequest, NextResponse } from 'next/server';

// 개발 환경에서만 TLS 우회
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// /api 자동 보정
function normalizeBase(raw?: string | null) {
  if (!raw) return '';
  const b = raw.replace(/\/+$/, '');
  return b.endsWith('/api') ? b : `${b}/api`;
}
const API = normalizeBase(process.env.API_BASE_URL);

// 자체서명 인증서 허용 (개발용)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  ...(process.env.API_SNI_HOST ? { servername: process.env.API_SNI_HOST } : {}),
});

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

function pickReqHeaders(src: Headers) {
  const h = new Headers();
  for (const k of [
    'accept',
    'accept-language',
    'user-agent',
    'authorization',
    'cookie',
    'content-type',
    'origin',
    'referer',
  ]) {
    const v = src.get(k);
    if (v) h.set(k, v);
  }
  h.set('accept-encoding', 'identity');
  if (process.env.API_SNI_HOST) h.set('host', process.env.API_SNI_HOST);
  h.set('x-requested-with', 'XMLHttpRequest');
  return h;
}

function filterResHeaders(src: Headers) {
  const h = new Headers();
  src.forEach((v, k) => {
    if (!HOP.has(k.toLowerCase())) h.set(k, v);
  });
  return h;
}

async function handler(
  req: NextRequest,
  context: { params: Promise<{ sock: string[] }> }
) {
  if (!API) {
    return NextResponse.json(
      { message: 'API_BASE_URL missing' },
      { status: 500 }
    );
  }

  try {
    // Next.js 15: params는 Promise
    const { sock } = await context.params;
    const tail = (sock ?? []).join('/');
    const upstreamUrl = `${API}/ws/${tail}${req.nextUrl.search || ''}`;

    console.log('WebSocket proxy request:', {
      method: req.method,
      url: upstreamUrl,
      path: tail,
    });

    // CORS preflight 처리
    if (req.method === 'OPTIONS') {
      const origin = req.headers.get('origin') ?? '*';
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,HEAD',
          'Access-Control-Allow-Headers':
            req.headers.get('access-control-request-headers') ||
            'content-type,authorization,x-requested-with',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // 요청 본문 처리
    const body =
      req.method === 'GET' || req.method === 'HEAD'
        ? undefined
        : await req.arrayBuffer();

    const fetchOptions: RequestInit & { agent?: any } = {
      method: req.method,
      headers: pickReqHeaders(req.headers),
      body: body?.byteLength ? body : undefined,
      cache: 'no-store',
      redirect: 'follow',
      // @ts-ignore Node 전용 옵션
      agent: upstreamUrl.startsWith('https:') ? httpsAgent : undefined,
    };

    const res = await fetch(upstreamUrl, fetchOptions);
    const buf = Buffer.from(await res.arrayBuffer());

    // 응답 헤더 처리
    const outHeaders = filterResHeaders(res.headers);
    const origin = req.headers.get('origin');
    if (origin) {
      outHeaders.set('Access-Control-Allow-Origin', origin);
      outHeaders.set('Access-Control-Allow-Credentials', 'true');
      outHeaders.set('Vary', 'Origin');
    }

    console.log('WebSocket proxy response:', {
      status: res.status,
      contentType: res.headers.get('content-type'),
    });

    return new NextResponse(buf, {
      status: res.status,
      headers: outHeaders,
    });
  } catch (e: any) {
    console.error('WebSocket proxy error:', {
      message: e?.message,
      code: e?.code,
      cause: e?.cause?.code,
    });

    return NextResponse.json(
      {
        message: 'Upstream fetch failed',
        error: e?.message ?? String(e),
        code: e?.code ?? null,
        causeCode: e?.cause?.code ?? null,
        timestamp: new Date().toISOString(),
      },
      { status: 502 }
    );
  }
}

// Next.js 15 호환 시그니처
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ sock: string[] }> }
) {
  return handler(req, context);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ sock: string[] }> }
) {
  return handler(req, context);
}

export async function OPTIONS(
  req: NextRequest,
  context: { params: Promise<{ sock: string[] }> }
) {
  return handler(req, context);
}

export async function HEAD(
  req: NextRequest,
  context: { params: Promise<{ sock: string[] }> }
) {
  return handler(req, context);
}
