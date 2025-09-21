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
const API = normalizeBase(process.env.API_PROXY_TARGET);

// 개발 환경에서 API URL 확인
if (process.env.NODE_ENV === 'development') {
  console.log('🔗 API Base URL:', API);
}

// TLS 검증 우회 에이전트 생성
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // 자체 서명 인증서 허용
  ...(process.env.API_SNI_HOST ? { servername: process.env.API_SNI_HOST } : {}),
});

// hop-by-hop 헤더
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

/** req.headers에서 accessToken 쿠키 추출 */
function getAccessTokenFromCookie(req: NextRequest): string | null {
  const cookie = req.headers.get('cookie') ?? '';
  // 간단 파서
  for (const part of cookie.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === 'accessToken') {
      const v = rest.join('=').trim();
      return v || null;
    }
  }
  return null;
}

/** 업스트림으로 넘길 헤더 구성 (Authorization 보강, Cookie 미전달) */
function buildUpstreamHeaders(req: NextRequest): Headers {
  const h = new Headers();

  // 보존할 일반 헤더
  for (const k of ['accept', 'accept-language', 'user-agent', 'content-type']) {
    const v = req.headers.get(k);
    if (v) h.set(k, v);
  }

  // 인코딩 강제(압축 해제)
  h.set('accept-encoding', 'identity');

  // Host SNI 강제 (필요시)
  if (process.env.API_SNI_HOST) h.set('host', process.env.API_SNI_HOST!);

  // Authorization 우선순위: 요청 헤더 → 쿠키 accessToken
  const auth = req.headers.get('authorization');
  if (auth && auth.trim().length > 0) {
    h.set('authorization', auth);
  } else {
    const token = getAccessTokenFromCookie(req);
    if (token) h.set('authorization', `Bearer ${token}`);
  }

  // ❌ Cookie는 업스트림으로 전달하지 않음 (CSRF 간섭 방지)
  // 필요하다면 여기서 h.set('cookie', ...) 처리

  return h;
}

function filterResHeaders(src: Headers) {
  const h = new Headers();
  src.forEach((v, k) => {
    if (!HOP.has(k.toLowerCase())) h.set(k, v);
  });
  return h;
}

// 공통 요청 처리 함수
async function handleRequest(
  req: NextRequest,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
) {
  if (!API) {
    return NextResponse.json(
      { message: 'API_BASE_URL missing' },
      { status: 500 }
    );
  }

  const upstreamUrl = `${API}/topic/realtime-transactions${req.nextUrl.search || ''}`;

  try {
    const shouldSendBody = method !== 'GET';
    const requestBody = shouldSendBody ? await req.arrayBuffer() : undefined;

    if (process.env.NODE_ENV === 'development') {
      console.log('📤 API 요청:');
      console.log('Method:', method);
      console.log('URL:', upstreamUrl);
      console.log(
        'Request Headers:',
        Object.fromEntries(req.headers.entries())
      );
      if (requestBody) {
        const bodyText = Buffer.from(requestBody).toString('utf8');
        console.log('Request Body:', bodyText);
        try {
          const jsonBody = JSON.parse(bodyText);
          console.log('✅ JSON 파싱 성공:', jsonBody);
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
      // @ts-ignore Node 전용 옵션
      agent: upstreamUrl.startsWith('https:') ? httpsAgent : undefined,
    };

    if (shouldSendBody && requestBody) {
      fetchOptions.body = requestBody;
    }

    const res = await fetch(upstreamUrl, fetchOptions);

    if (process.env.NODE_ENV === 'development') {
      console.log('📥 API 응답:');
      console.log('Status:', res.status);
      console.log(
        'Response Headers:',
        Object.fromEntries(res.headers.entries())
      );
    }

    const buf = Buffer.from(await res.arrayBuffer());

    if (process.env.NODE_ENV === 'development') {
      const responseText = buf.toString('utf8');
      if (res.status >= 400) {
        console.log('❌ Error Response Body:', responseText);
        try {
          const errorJson = JSON.parse(responseText);
          console.log('📋 구조화된 에러 정보:', {
            timestamp: errorJson.timestamp,
            status: errorJson.status,
            error: errorJson.error,
            message: errorJson.message,
            details: errorJson.details,
          });
        } catch {
          console.log('텍스트 응답:', responseText);
        }
      } else {
        console.log('✅ Success Response:', responseText);
      }
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

// GET 요청 핸들러
export async function GET(req: NextRequest) {
  return handleRequest(req, 'GET');
}

// PUT 요청 핸들러
export async function PUT(req: NextRequest) {
  return handleRequest(req, 'PUT');
}
