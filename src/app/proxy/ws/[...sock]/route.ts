export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import https from 'https';
import { NextResponse } from 'next/server';

// 개발 환경에서만 자체서명 인증서 허용
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line no-process-env
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

/**
 * WS_BASE는 반드시 백엔드 루트 (예: https://211.110.155.54)
 *  - 절대 /api 붙이지 마세요. (SockJS는 /ws 이하 직접 사용)
 * .env 예:
 *   API_WS_BASE=https://211.110.155.54
 */
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
  if (process.env.API_SNI_HOST) h.set('host', process.env.API_SNI_HOST!);
  h.set('x-requested-with', 'XMLHttpRequest');
  return h;
}

function headersToObject(h: Headers): Record<string, string> {
  const o: Record<string, string> = {};
  h.forEach((v, k) => (o[k] = v));
  return o;
}

function filterResHeaders(src: Headers) {
  const h = new Headers();
  src.forEach((v, k) => {
    if (!HOP.has(k.toLowerCase())) h.set(k, v);
  });
  return h;
}

async function handle(req: Request, ctx: any) {
  if (!WS_BASE) {
    return NextResponse.json(
      {
        message: 'API_WS_BASE missing or empty',
        received: process.env.API_WS_BASE,
      },
      { status: 500 }
    );
  }

  const sockPath: string[] = ctx?.params?.sock ?? [];
  const tail = sockPath.join('/');
  const url = new URL(req.url);
  const upstreamUrl = `${WS_BASE}/ws/${tail}${url.search || ''}`;

  // CORS Preflight
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

  // GET/HEAD는 body 없음
  let body: ArrayBuffer | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const ab = await req.arrayBuffer();
    body = ab.byteLength ? ab : undefined;
  }

  const requestHeaders = pickReqHeaders(req.headers);

  const res = await fetch(upstreamUrl, {
    method: req.method,
    headers: headersToObject(requestHeaders), // Node fetch HeadersInit 호환
    body,
    cache: 'no-store',
    redirect: 'follow',
    // @ts-ignore - node 전용
    agent: upstreamUrl.startsWith('https:') ? httpsAgent : undefined,
  });

  // 응답 헤더 (CORS)
  const outHeaders = filterResHeaders(res.headers);
  const origin = req.headers.get('origin');
  if (origin) {
    outHeaders.set('Access-Control-Allow-Origin', origin);
    outHeaders.set('Access-Control-Allow-Credentials', 'true');
    outHeaders.set('Vary', 'Origin');
  }

  // 204/HEAD는 body 없이
  if (res.status === 204 || req.method === 'HEAD') {
    return new NextResponse(null, { status: res.status, headers: outHeaders });
  }

  const buf = Buffer.from(await res.arrayBuffer());

  if (res.status >= 400) {
    console.log('[WS Proxy] Upstream error', {
      status: res.status,
      url: upstreamUrl,
      method: req.method,
      text: buf.toString('utf8').slice(0, 300),
    });
  }

  return new NextResponse(buf, { status: res.status, headers: outHeaders });
}

// ⚠️ 여기가 핵심: 2번째 인자에 **타입 주석을 넣지 마세요**.
export async function GET(req: Request, ctx: any) {
  return handle(req, ctx);
}
export async function POST(req: Request, ctx: any) {
  return handle(req, ctx);
}
export async function OPTIONS(req: Request, ctx: any) {
  return handle(req, ctx);
}
export async function HEAD(req: Request, ctx: any) {
  return handle(req, ctx);
}
