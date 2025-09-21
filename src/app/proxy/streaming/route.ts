export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import https from 'https';
import { NextRequest, NextResponse } from 'next/server';

function normalizeBase(raw?: string | null) {
  if (!raw) return '';
  const b = raw.replace(/\/+$/, '');
  return b.endsWith('/api') ? b : `${b}/api`;
}
const API = normalizeBase(process.env.API_BASE_URL);

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
  // 1) 기본 헤더
  for (const k of [
    'accept',
    'accept-language',
    'user-agent',
    'authorization',
    'cookie',
    'content-type',
    // 2) 추가로 꼭 넘겨야 하는 것들
    'origin',
    'referer',
  ]) {
    const v = src.get(k);
    if (v) h.set(k, v);
  }
  h.set('accept-encoding', 'identity');

  // 백엔드가 SNI/Host를 본다면 유지
  if (process.env.API_SNI_HOST) h.set('host', process.env.API_SNI_HOST!);

  // 일부 서버가 AJAX 요청 식별에 쓰는 헤더(선택)
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

async function handle(
  req: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  if (!API)
    return NextResponse.json(
      { message: 'API_BASE_URL missing' },
      { status: 500 }
    );

  const tail = (params.path ?? []).join('/');
  const search = req.nextUrl.search || '';
  const upstreamUrl = `${API}/streaming/${tail}${search}`;

  const res = await fetch(upstreamUrl, {
    method: req.method,
    headers: pickReqHeaders(req.headers),
    body:
      req.method === 'GET' || req.method === 'HEAD'
        ? undefined
        : await req.arrayBuffer(),
    cache: 'no-store',
    redirect: 'follow',
    // @ts-ignore
    agent: upstreamUrl.startsWith('https:') ? httpsAgent : undefined,
  });

  const buf = Buffer.from(await res.arrayBuffer());
  return new NextResponse(buf, {
    status: res.status,
    headers: filterResHeaders(res.headers),
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
