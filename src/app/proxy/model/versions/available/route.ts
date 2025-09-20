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

// 개발 환경에서 API URL 확인
if (process.env.NODE_ENV === 'development') {
  console.log('🔗 API Base URL:', API);
}

// 🔥 강화된 TLS 검증 우회 에이전트
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  checkServerIdentity: () => undefined, // 서버 신원 검사 완전 비활성화
  secureProtocol: 'TLS_method', // 모든 TLS 버전 허용
  ...(process.env.API_SNI_HOST ? { servername: process.env.API_SNI_HOST } : {}),
});

// 전역 SSL 검증 비활성화 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
}

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

  const upstreamUrl = `${API}/model/versions/available${req.nextUrl.search || ''}`;

  try {
    const shouldSendBody = method !== 'GET';
    const requestBody = shouldSendBody ? await req.arrayBuffer() : undefined;

    if (process.env.NODE_ENV === 'development') {
      console.log('📤 API 요청:');
      console.log('Method:', method);
      console.log('URL:', upstreamUrl);
      console.log('🔒 HTTPS Agent Config:', {
        rejectUnauthorized: httpsAgent.options.rejectUnauthorized,
        checkServerIdentity: !!httpsAgent.options.checkServerIdentity,
        servername: httpsAgent.options.servername,
      });
    }

    const fetchOptions: RequestInit & { agent?: any } = {
      method,
      headers: buildUpstreamHeaders(req),
      cache: 'no-store',
      redirect: 'follow',
    };

    // 🔥 HTTPS URL인 경우에만 agent 적용
    if (upstreamUrl.startsWith('https:')) {
      // @ts-ignore Node.js 전용 옵션
      fetchOptions.agent = httpsAgent;
    }

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
    console.error('🚨 Fetch error details:', {
      message: e?.message,
      code: e?.code,
      cause: e?.cause,
      url: upstreamUrl,
      stack: e?.stack?.split('\n').slice(0, 5).join('\n'), // 스택 트레이스 일부만
    });

    // SSL 관련 에러에 대한 추가 정보
    if (
      e?.code === 'DEPTH_ZERO_SELF_SIGNED_CERT' ||
      e?.code?.includes('CERT')
    ) {
      console.error('🔒 SSL Certificate Error - 추가 해결책:');
      console.error('1. NODE_TLS_REJECT_UNAUTHORIZED=0 환경변수 설정');
      console.error('2. --insecure-http-parser 플래그 사용');
      console.error('3. 인증서 파일 직접 지정');
    }

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
