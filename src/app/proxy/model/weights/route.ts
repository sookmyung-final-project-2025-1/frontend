import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
const API = (process.env.API_PROXY_TARGET || '').replace(/\/+$/, '');

export async function GET(_req: NextRequest) {
  if (!API)
    return NextResponse.json(
      { message: 'API_PROXY_TARGET missing' },
      { status: 500 }
    );
  const r = await fetch(`${API}/api/model/weights`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const data = await r.json().catch(() => null);
  return NextResponse.json(data, { status: r.status });
}

export async function POST(req: NextRequest) {
  if (!API)
    return NextResponse.json(
      { message: 'API_PROXY_TARGET missing' },
      { status: 500 }
    );
  const body = await req.text();
  const r = await fetch(`${API}/api/model/weights`, {
    method: 'POST',
    headers: {
      'Content-Type': req.headers.get('content-type') ?? 'application/json',
      Accept: 'application/json',
    },
    body,
    cache: 'no-store',
  });
  const data = await r.json().catch(() => null);
  return NextResponse.json(data, { status: r.status });
}
