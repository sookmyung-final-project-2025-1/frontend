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

  if (!startTime || !endTime) {
    return NextResponse.json(
      { message: 'startTime and endTime are required' },
      { status: 400 }
    );
  }

  // 쿼리 안전 조립
  const qs = new URLSearchParams({ startTime, endTime }).toString();

  const r = await fetch(`${API}/api/dashboard/stats/hourly?${qs}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const data = await r.json().catch(() => null);
  return NextResponse.json(data, { status: r.status });
}
