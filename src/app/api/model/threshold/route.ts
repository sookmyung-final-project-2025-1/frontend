import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
const API = (process.env.API_PROXY_TARGET || '').replace(/\/+$/, '');

export async function PUT(req: NextRequest) {
  if (!API)
    return NextResponse.json(
      { message: 'API_PROXY_TARGET missing' },
      { status: 500 }
    );
  const body = await req.text();

  const { searchParams } = req.nextUrl;
  const threshold = searchParams.get('threshold');

  const thresholdNum = Number(threshold);

  const r = await fetch(
    `${API}/api/model/threshold?threshold=${thresholdNum}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': req.headers.get('content-type') ?? 'application/json',
        Accept: 'application/json',
      },
      body,
      cache: 'no-store',
    }
  );
  const data = await r.json().catch(() => null);
  return NextResponse.json(data, { status: r.status });
}
