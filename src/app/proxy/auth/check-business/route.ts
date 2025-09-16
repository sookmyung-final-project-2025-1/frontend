import { NextRequest, NextResponse } from 'next/server';

const API = process.env.API_PROXY_TARGET;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const res = await fetch(`${API}/api/auth/check-business`, {
    method: 'POST',
    headers: {
      'Content-Type': req.headers.get('content-type') ?? 'application/json',
      Accept: 'application/json',
    },
    body,
  });

  const data = await res.json();
  return new NextResponse(data, { status: res.status });
}
