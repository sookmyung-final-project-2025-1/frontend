export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import https from 'https';
import { NextRequest, NextResponse } from 'next/server';

type Ctx = { params: { path: string[] } };

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

async function handle(req: NextRequest, segments: string[] = []) {
  if (!API)
    return NextResponse.json(
      { message: 'API_BASE_URL missing' },
      { status: 500 }
    );

  // 업스트림 URL 조립: /api/streaming/(segments...)
  const upstream = new URL(`${API}/streaming/${(segments ?? []).join('/')}`);
  // 쿼리 전달
  req.nextUrl.searchParams.forEach((v, k) => upstream.searchParams.set(k, v));

  const init: RequestInit = {
    method: req.method,
    headers: pickReqHeaders(req.headers),
    cache: 'no-store',
    redirect: 'follow',
    // @ts-ignore Node 런타임에서만
    agent: upstream.protocol === 'https:' ? httpsAgent : undefined,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    // 바디 그대로 전달
    init.body = await req.arrayBuffer();
  }

  const res = await fetch(upstream.toString(), init);
  const buf = Buffer.from(await res.arrayBuffer());

  return new NextResponse(buf, {
    status: res.status,
    headers: filterResHeaders(res.headers),
  });
}

export async function GET(req: NextRequest, { params }: Ctx) {
  return handle(req, params.path);
}
export async function POST(req: NextRequest, { params }: Ctx) {
  return handle(req, params.path);
}
export async function PUT(req: NextRequest, { params }: Ctx) {
  return handle(req, params.path);
}
export async function PATCH(req: NextRequest, { params }: Ctx) {
  return handle(req, params.path);
}
export async function DELETE(req: NextRequest, { params }: Ctx) {
  return handle(req, params.path);
}
