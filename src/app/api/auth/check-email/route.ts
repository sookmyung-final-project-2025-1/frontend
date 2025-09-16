import { NextRequest, NextResponse } from 'next/server';

const API = (process.env.API_PROXY_TARGET || '').replace(/\/+$/, '');

export async function GET(req: NextRequest) {
  const email = new URL(req.url).searchParams.get('email');
  if (!email)
    return NextResponse.json({ message: 'email is required' }, { status: 400 });
  if (!API)
    return NextResponse.json(
      { message: 'API_PROXY_TARGET missing' },
      { status: 500 }
    );

  const endUrl = `${API}/api/auth/check-email?email=${encodeURIComponent(email)}`;
  const res = await fetch(endUrl, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}
