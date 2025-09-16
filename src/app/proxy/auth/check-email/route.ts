// app/proxy/auth/check-email/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

// /api 자동 보정
function normalizeBase(raw?: string | null) {
  if (!raw) return '';
  const b = raw.replace(/\/+$/, '');
  return b.endsWith('/api') ? b : `${b}/api`;
}
const API = normalizeBase(process.env.API_BASE_URL);

// ALLOW_INSECURE_TLS=1이면 전역 dispatcher로 TLS 검증 우회
let tlsReady: Promise<void> | null = null;
function ensureInsecureTLSOnce() {
  if (process.env.ALLOW_INSECURE_TLS !== '1') return Promise.resolve();
  if (!tlsReady) {
    tlsReady = (async () => {
      const { Agent, setGlobalDispatcher } = await import('undici');
      const servername = process.env.API_SNI_HOST;
      const agent = new Agent({
        connect: {
          rejectUnauthorized: false,
          ...(servername ? { servername } : {}),
        },
      });
      setGlobalDispatcher(agent);
    })();
  }
  return tlsReady;
}

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
  h.set('accept-encoding', 'identity'); // 디코딩 mismatch 방지
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

export async function GET(req: NextRequest) {
  if (!API)
    return NextResponse.json(
      { message: 'API_BASE_URL missing' },
      { status: 500 }
    );

  await ensureInsecureTLSOnce(); // ← 운영에서도 적용

  const upstreamUrl = `${API}/auth/check-email${req.nextUrl.search}`;
  try {
    const res = await fetch(upstreamUrl, {
      method: 'GET',
      headers: pickReqHeaders(req.headers),
      cache: 'no-store',
      redirect: 'follow', // 프록시가 리다이렉트를 따라감 → CORS 회피
    });

    const buf = Buffer.from(await res.arrayBuffer());
    return new NextResponse(buf, {
      status: res.status,
      headers: filterResHeaders(res.headers),
    });
  } catch (e: any) {
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
