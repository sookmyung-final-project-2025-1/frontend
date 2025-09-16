// app/proxy/auth/check-email/route.ts
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
  rejectUnauthorized: false, // 자체 서명 인증서 허용
  ...(process.env.API_SNI_HOST
    ? {
        servername: process.env.API_SNI_HOST,
      }
    : {}),
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
  ]) {
    const v = src.get(k);
    if (v) h.set(k, v);
  }
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

export async function GET(req: NextRequest) {
  if (!API)
    return NextResponse.json(
      { message: 'API_BASE_URL missing' },
      { status: 500 }
    );

  const upstreamUrl = `${API}/auth/check-email${req.nextUrl.search}`;

  try {
    const res = await fetch(upstreamUrl, {
      method: 'GET',
      headers: pickReqHeaders(req.headers),
      cache: 'no-store',
      redirect: 'follow',
      // @ts-ignore - Node.js 환경에서만 작동
      agent: upstreamUrl.startsWith('https:') ? httpsAgent : undefined,
    });

    // 응답 정보도 로그에 추가
    if (process.env.NODE_ENV === 'development') {
      console.log('📥 API 응답:');
      console.log('Status:', res.status);
      console.log(
        'Response Headers:',
        Object.fromEntries(res.headers.entries())
      );
    }

    const buf = Buffer.from(await res.arrayBuffer());

    // 에러 응답인 경우 내용도 출력
    if (res.status >= 400 && process.env.NODE_ENV === 'development') {
      const responseText = buf.toString('utf8');
      console.log('Error Response Body:', responseText);
    }

    return new NextResponse(buf, {
      status: res.status,
      headers: filterResHeaders(res.headers),
    });
  } catch (e: any) {
    console.error('Fetch error details:', {
      message: e?.message,
      code: e?.code,
      cause: e?.cause,
      url: upstreamUrl,
    });

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
