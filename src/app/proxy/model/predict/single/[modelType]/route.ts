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

if (process.env.NODE_ENV === 'development') {
  console.log('🔗 API Base URL:', API);
}

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

async function handleRequest(
  req: NextRequest,
  method: 'POST',
  modelType: string | undefined
) {
  if (!API) {
    return NextResponse.json(
      { message: 'API_BASE_URL missing' },
      { status: 500 }
    );
  }

  if (!modelType) {
    return NextResponse.json(
      { message: 'modelType is required' },
      { status: 400 }
    );
  }

  const upstreamUrl = `${API}/model/predict/single/${encodeURIComponent(modelType)}`;

  try {
    const requestBody = await req.arrayBuffer();

    if (process.env.NODE_ENV === 'development') {
      console.log('📤 API 요청:');
      console.log('Method:', method);
      console.log('URL:', upstreamUrl);
      console.log(
        'Request Headers:',
        Object.fromEntries(req.headers.entries())
      );
      if (requestBody.byteLength) {
        const bodyText = Buffer.from(requestBody).toString('utf8');
        console.log('Request Body:', bodyText);
        try {
          console.log('✅ JSON 파싱 성공:', JSON.parse(bodyText));
        } catch (e) {
          console.log('❌ JSON 파싱 실패:', e);
        }
      }
    }

    const fetchOptions: RequestInit & { agent?: any } = {
      method,
      headers: buildUpstreamHeaders(req),
      cache: 'no-store',
      redirect: 'follow',
      agent: upstreamUrl.startsWith('https:') ? httpsAgent : undefined,
      body: requestBody,
    };

    const res = await fetch(upstreamUrl, fetchOptions);
    const buf = Buffer.from(await res.arrayBuffer());

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

export async function POST(
  req: NextRequest,
  context: { params: { modelType?: string } }
) {
  return handleRequest(req, 'POST', context.params?.modelType);
}
