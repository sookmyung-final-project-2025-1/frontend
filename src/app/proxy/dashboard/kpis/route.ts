import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
const API = (process.env.API_PROXY_TARGET || '').replace(/\/+$/, '');

export async function GET(req: NextRequest) {
  if (!API)
    return NextResponse.json(
      { message: 'API_PROXY_TARGET missing' },
      { status: 500 }
    );

  const { searchParams } = req.nextUrl;
  const startTime = searchParams.get('startTime');
  const endTime = searchParams.get('endTime');

  const r = await fetch(
    `${API}/api/dashboard/kpis?startTime=${startTime}&endTime=${endTime}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    }
  );
  const data = await r.json().catch(() => null);
  return NextResponse.json(data, { status: r.status });
}
