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
  const period = searchParams.get('period');

  if (!startTime || !endTime || !period) {
    return NextResponse.json(
      { message: 'startTime and endTime are required' },
      { status: 400 }
    );
  }

  const qs = new URLSearchParams({ startTime, endTime, period }).toString();

  const r = await fetch(`${API}/api/model/confidence-score?${qs}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const data = await r.json().catch(() => null);
  return NextResponse.json(data, { status: r.status });
}
