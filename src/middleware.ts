import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// 인증이 필요 없는 경로들
const publicPaths = [
  '/signin',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/_next',
  '/favicon.ico',
  '/api',
  '/proxy', // API 프록시는 제외 (내부적으로 토큰 처리)
];

// 정적 파일들
const staticPaths = [
  '/images',
  '/icons',
  '/assets',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.css',
  '.js',
  '.json',
  '.woff',
  '.woff2',
  '.ttf',
];

// 경로가 public인지 확인
function isPublicPath(pathname: string): boolean {
  return (
    publicPaths.some((path) => pathname.startsWith(path)) ||
    staticPaths.some((path) => pathname.includes(path))
  );
}

// 쿠키에서 accessToken 추출
function getAccessTokenFromCookies(request: NextRequest): string | null {
  const accessToken = request.cookies.get('accessToken')?.value;
  return accessToken || null;
}

// JWT 토큰의 만료 시간 확인 (간단한 디코딩)
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch {
    return true; // 파싱 실패시 만료된 것으로 간주
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 개발 환경 로깅
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔐 Middleware: ${request.method} ${pathname}`);
  }

  // Public 경로는 바로 통과
  if (isPublicPath(pathname)) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Public path: ${pathname}`);
    }
    return NextResponse.next();
  }

  // 루트 경로(/) 접근 시 처리
  if (pathname === '/') {
    const accessToken = getAccessTokenFromCookies(request);

    if (!accessToken || isTokenExpired(accessToken)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Root redirect to signin (no token or expired)`);
      }
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    // 토큰이 있으면 대시보드나 메인 페이지로 리다이렉트
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 Root redirect to dashboard (authenticated)`);
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 보호된 경로에 대한 토큰 검사
  const accessToken = getAccessTokenFromCookies(request);

  if (!accessToken) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`❌ No access token, redirecting to signin`);
    }

    // 원래 가려던 경로를 쿼리 파라미터로 저장
    const signInUrl = new URL('/signin', request.url);
    signInUrl.searchParams.set('redirect', pathname);

    return NextResponse.redirect(signInUrl);
  }

  // 토큰 만료 검사
  if (isTokenExpired(accessToken)) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏰ Access token expired, redirecting to signin`);
    }

    // 만료된 토큰 삭제
    const response = NextResponse.redirect(new URL('/signin', request.url));
    response.cookies.delete('accessToken');

    return response;
  }

  // 로그인 상태에서 signin/signup 접근 시 리다이렉트
  if (pathname.startsWith('/signin') || pathname.startsWith('/signup')) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 Already authenticated, redirecting to dashboard`);
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ Authenticated access: ${pathname}`);
  }

  return NextResponse.next();
}

// 미들웨어가 실행될 경로 설정
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.[^/]*$).*)'],
};
