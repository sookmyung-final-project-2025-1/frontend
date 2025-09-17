// export const runtime = 'nodejs';
// export const dynamic = 'force-dynamic';

// import type { NextRequest } from 'next/server';
// import { NextResponse } from 'next/server';

// // /api 자동 보정
// function withApi(raw?: string | null) {
//   if (!raw) return '';
//   const base = raw.replace(/\/+$/, '');
//   return base.endsWith('/api') ? base : `${base}/api`;
// }
// const API = withApi(process.env.API_BASE_URL);

// // (임시) 자체서명 인증서 우회: Vercel/로컬에서 ALLOW_INSECURE_TLS=1 이면 켜짐
// let tlsPatched = false;
// async function ensureInsecureTLSOnce() {
//   if (tlsPatched || process.env.ALLOW_INSECURE_TLS !== '1') return;
//   const { Agent, setGlobalDispatcher } = await import('undici');
//   const servername = process.env.API_SNI_HOST;
//   setGlobalDispatcher(
//     new Agent({
//       connect: {
//         rejectUnauthorized: false,
//         ...(servername ? { servername } : {}),
//       },
//     })
//   );
//   tlsPatched = true;
// }

// const HOP = new Set([
//   'connection',
//   'keep-alive',
//   'transfer-encoding',
//   'upgrade',
//   'proxy-authenticate',
//   'proxy-authorization',
//   'te',
//   'trailer',
//   'trailers',
//   'content-encoding',
//   'content-length',
// ]);

// function pickReqHeaders(src: Headers) {
//   const h = new Headers();
//   for (const k of [
//     'accept',
//     'accept-language',
//     'user-agent',
//     'authorization',
//     'cookie',
//     'content-type',
//   ]) {
//     const v = src.get(k);
//     if (v) h.set(k, v);
//   }
//   h.set('accept-encoding', 'identity'); // 디코딩 mismatch 방지
//   if (process.env.API_SNI_HOST) h.set('host', process.env.API_SNI_HOST!);
//   return h;
// }
// function filterResHeaders(src: Headers) {
//   const h = new Headers();
//   src.forEach((v, k) => {
//     if (!HOP.has(k.toLowerCase())) h.set(k, v);
//   });
//   return h;
// }

// async function forward(req: NextRequest, path: string[]) {
//   if (!API)
//     return NextResponse.json(
//       { message: 'API_BASE_URL missing' },
//       { status: 500 }
//     );

//   await ensureInsecureTLSOnce();

//   const upstreamUrl = `${API}/${path.join('/')}${req.nextUrl.search}`;
//   const init: RequestInit = {
//     method: req.method,
//     headers: pickReqHeaders(req.headers),
//     cache: 'no-store',
//     redirect: 'follow',
//   };

//   if (!['GET', 'HEAD'].includes(req.method)) {
//     const ab = await req.arrayBuffer();
//     if (ab.byteLength > 0) init.body = ab;
//   }

//   try {
//     const res = await fetch(upstreamUrl, init);
//     return new NextResponse(res.body, {
//       status: res.status,
//       headers: filterResHeaders(res.headers),
//     });
//   } catch (e: any) {
//     return NextResponse.json(
//       {
//         message: 'Upstream fetch failed',
//         url: upstreamUrl,
//         error: e?.message ?? String(e),
//         code: e?.code ?? null,
//         causeCode: e?.cause?.code ?? null,
//       },
//       { status: 502 }
//     );
//   }
// }

// // 모든 메서드 연결
// export const GET = (
//   req: NextRequest,
//   { params }: { params: { path?: string[] } }
// ) => forward(req, params.path ?? []);
// export const POST = GET;
// export const PUT = GET;
// export const PATCH = GET;
// export const DELETE = GET;
// export const OPTIONS = GET;
