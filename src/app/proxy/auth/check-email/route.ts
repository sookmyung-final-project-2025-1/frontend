// app/proxy/auth/check-email/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_BASE_URL?.replace(/\/+$/, '');

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
]);

function pickReqHeaders(src: Headers) {
  const h = new Headers();
  // 필요한 최소 헤더만 전달 (Origin/Referer는 제외)
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
  // 업스트림 압축 비활성화 → 디코딩 mismatch 방지
  h.set('accept-encoding', 'identity');
  return h;
}

function filterResHeaders(src: Headers) {
  const h = new Headers();
  src.forEach((v, k) => {
    const low = k.toLowerCase();
    if (
      !HOP.has(low) &&
      low !== 'content-encoding' &&
      low !== 'content-length'
    ) {
      h.set(k, v);
    }
  });
  return h;
}

async function makeDispatcher() {
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.ALLOW_INSECURE_TLS === '1'
  ) {
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
  if (!API_BASE)
    return NextResponse.json(
      { message: 'API_BASE_URL missing' },
      { status: 500 }
    );

  const upstreamUrl = `${API_BASE}/auth/check-email${req.nextUrl.search}`;
  const headers = pickReqHeaders(req.headers);
  if (process.env.API_SNI_HOST) headers.set('host', process.env.API_SNI_HOST!);

  const init: RequestInit & { dispatcher?: any } = {
    method: 'GET',
    headers,
    cache: 'no-store',
    // ✅ 서버가 리다이렉트를 따라감 → 브라우저에 30x 노출 안 됨 → CORS 안 터짐
    redirect: 'follow',
  };
  const dispatcher = await makeDispatcher();
  if (dispatcher) init.dispatcher = dispatcher;

  try {
    const res = await fetch(upstreamUrl, init);

    // 작은 JSON이므로 버퍼링해서 안전하게 내려줌
    const buf = Buffer.from(await res.arrayBuffer());
    const outHeaders = filterResHeaders(res.headers);

    return new NextResponse(buf, { status: res.status, headers: outHeaders });
  } catch (e: any) {
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

export const POST = GET;
export const PUT = GET;
export const PATCH = GET;
export const DELETE = GET;
