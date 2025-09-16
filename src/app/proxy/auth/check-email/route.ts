export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_BASE_URL?.replace(/\/+$/, '');

export async function GET(req: NextRequest) {
  const email = new URL(req.url).searchParams.get('email');
  if (!API_BASE)
    return NextResponse.json({ message: 'API_BASE missing' }, { status: 500 });
  if (!email)
    return NextResponse.json({ message: 'email is required' }, { status: 400 });

  const endUrl = `${API_BASE}/auth/check-email?email=${encodeURIComponent(email)}`;

  // 원 요청 헤더 중 보안/정책에서 자주 쓰는 것들 전달
  const src = req.headers;
  const headers = new Headers();
  const copy = (k: string) => {
    const v = src.get(k);
    if (v) headers.set(k, v);
  };
  copy('accept');
  copy('user-agent');
  copy('accept-language');
  copy('authorization'); // 필요 없으면 자동 무시됨
  copy('cookie'); // 회원가입이면 없어도 됨
  copy('origin'); // 🔴 중요: 백엔드가 오리진 화이트리스트면 필요
  copy('referer'); // 🔴 중요: 일부 프록시/보안장비는 referer도 봄

  try {
    const res = await fetch(endUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
      redirect: 'follow',
      // 개발 self-signed면 .env.local에 ALLOW_INSECURE_TLS=1 넣고, undici Agent 붙인 버전 사용
    });

    const text = await res.text();
    const ct = res.headers.get('content-type') ?? '';

    // 디버그에 도움: 4xx/5xx면 업스트림 정보 그대로 노출
    if (!res.ok) {
      return NextResponse.json(
        {
          upstream: {
            url: endUrl,
            status: res.status,
            contentType: ct,
            bodySnippet: text.slice(0, 2000),
            forwardedOrigin: headers.get('origin') ?? null,
            forwardedReferer: headers.get('referer') ?? null,
          },
        },
        { status: res.status }
      );
    }

    return ct.includes('application/json')
      ? NextResponse.json(JSON.parse(text), { status: res.status })
      : new NextResponse(text, {
          status: res.status,
          headers: { 'content-type': ct || 'text/plain' },
        });
  } catch (e: any) {
    return NextResponse.json(
      {
        message: 'Upstream fetch failed',
        url: endUrl,
        error: e?.message ?? String(e),
      },
      { status: 502 }
    );
  }
}
