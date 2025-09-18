export default function useBuildParams(obj: Record<string, unknown>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;

    if (Array.isArray(v)) {
      // 배열은 여러 개로 append (ex. sort=amount,desc&sort=timestamp,asc)
      for (const item of v) p.append(k, String(item));
    } else {
      p.set(k, String(v));
    }
  }
  return p;
}
