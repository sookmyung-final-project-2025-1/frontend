// src/app/proxy/ws/[...sock]/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import https from 'https';
import { NextRequest, NextResponse } from 'next/server';

// dev에서만 TLS 우회
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// ✅ /api 붙이지 말고, 순수 ORIGIN만!
const WS_BASE = (process.env.API_WS_BASE || '').replace(/\/+$/, '');

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

// ✅ SockJS /info는 민감헤더(authorization/cookie) 넘기지 마세요
function pickReqHeaders(src: Headers) {
  const h = new Headers();
  for (const k of [
    'accept',
    'accept-language',
    'user-agent',
    'content-type',
    'origin',
    'referer',
  ]) {
    const v = src.get(k);
    if (v) h.set(k, v);
  }
  h.set('accept-encoding', 'identity');
  // 선택: 서버가 SNI/Host를 확인하면 설정
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

// Next 14/15 겸용 params 처리
async function getParams(ctx: any): Promise<{ sock: string[] }> {
  const p = (ctx && ctx.params) || {};
  return typeof p.then === 'function' ? await p : p;
}

async function handle(
  req: NextRequest,
  ctx: { params: { sock: string[] } } | { params: Promise<{ sock: string[] }> }
) {
  if (!WS_BASE) {
    return NextResponse.json(
      { message: 'API_WS_BASE missing', got: process.env.API_WS_BASE },
      { status: 500 }
    );
  }

  const { sock } = await getParams(ctx);
  const tail = (sock ?? []).join('/');
  const upstreamUrl = `${WS_BASE}/ws/${tail}${req.nextUrl.search || ''}`;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin') ?? '*';
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,HEAD',
        'Access-Control-Allow-Headers':
          req.headers.get('access-control-request-headers') ||
          'content-type,x-requested-with',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // GET/HEAD은 body 금지
  const body =
    req.method === 'GET' || req.method === 'HEAD'
      ? undefined
      : await req.arrayBuffer();

  const res = await fetch(upstreamUrl, {
    method: req.method,
    headers: pickReqHeaders(req.headers),
    body: body?.byteLength ? body : undefined,
    cache: 'no-store',
    redirect: 'follow',
    // @ts-ignore
    agent: upstreamUrl.startsWith('https:') ? httpsAgent : undefined,
  });

  const buf = Buffer.from(await res.arrayBuffer());

  // 개발 중 문제 원인 확인
  if (process.env.NODE_ENV === 'development' && res.status >= 400) {
    console.log('[WS proxy] upstream', res.status, upstreamUrl);
    try {
      console.log('body(json):', JSON.parse(buf.toString('utf8')));
    } catch {
      console.log('body(text):', buf.toString('utf8'));
    }
  }

  const out = filterResHeaders(res.headers);
  const origin = req.headers.get('origin');
  if (origin) {
    out.set('Access-Control-Allow-Origin', origin);
    out.set('Access-Control-Allow-Credentials', 'true');
    out.set('Vary', 'Origin');
  }

  return new NextResponse(buf, { status: res.status, headers: out });
}

export async function GET(req: NextRequest, ctx: any) {
  return handle(req, ctx);
}
export async function POST(req: NextRequest, ctx: any) {
  return handle(req, ctx);
}
export async function OPTIONS(req: NextRequest, ctx: any) {
  return handle(req, ctx);
}
export async function HEAD(req: NextRequest, ctx: any) {
  return handle(req, ctx);
}
