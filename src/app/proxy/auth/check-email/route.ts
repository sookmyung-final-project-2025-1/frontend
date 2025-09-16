// app/proxy/auth/check-email/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

/** API_BASE_URL은 /api 유무와 상관없이 보정 */
function normalizeBase(raw?: string | null) {
  if (!raw) return '';
  const base = raw.replace(/\/+$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
}
const API = normalizeBase(process.env.API_BASE_URL);

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
  ]) {
    const v = src.get(k);
    if (v) h.set(k, v);
  }
  // 디코딩 불일치 방지
  h.set('accept-encoding', 'identity');
  if (process.env.API_SNI_HOST) h.set('host', process.env.API_SNI_HOST!);
  return h;
}
function filterResHeaders(src: Headers) {
  const h = new Headers();
  src.forEach((v, k) => {
    if (!HOP.has(k.toLowerCase())) h.set(k, v);
  });
  return h;
}

/** 운영/개발 공통: ALLOW_INSECURE_TLS=1 이면 TLS 검증 우회 */
async function makeDispatcher() {
  if (process.env.ALLOW_INSECURE_TLS === '1') {
    const { Agent } = await import('undici');
    const servername = process.env.API_SNI_HOST;
    return new Agent({
      connect: {
        rejectUnauthorized: false,
        ...(servername ? { servername } : {}),
      },
    });
  }
  return undefined;
}

export async function GET(req: NextRequest) {
  if (!API)
    return NextResponse.json(
      { message: 'API_BASE_URL missing' },
      { status: 500 }
    );
  const upstreamUrl = `${API}/auth/check-email${req.nextUrl.search}`;
  const init: RequestInit & { dispatcher?: any } = {
    method: 'GET',
    headers: pickReqHeaders(req.headers),
    cache: 'no-store',
    redirect: 'follow', // 프록시가 리다이렉트 따라감(CORS 회피)
  };
  const dispatcher = await makeDispatcher();
  if (dispatcher) init.dispatcher = dispatcher;

  try {
    const res = await fetch(upstreamUrl, init);
    const buf = Buffer.from(await res.arrayBuffer()); // 안전하게 버퍼링
    return new NextResponse(buf, {
      status: res.status,
      headers: filterResHeaders(res.headers),
    });
  } catch (e: any) {
    // 원인 파악을 위해 code/cause도 노출
    return NextResponse.json(
      {
        message: 'Upstream fetch failed',
        url: upstreamUrl,
        error: e?.message ?? String(e),
        code: e?.code ?? null,
        causeCode: e?.cause?.code ?? null,
      },
      { status: 502 }
    );
  }
}
