'use client';

export default function JSONBlock({ value }: { value: unknown }) {
  if (value === null) {
    return <div className='text-slate-400 text-sm'>값이 없습니다.</div>;
  }

  // 문자열이면 그대로, 객체면 pretty print
  const content =
    typeof value === 'string' ? value : JSON.stringify(value, null, 2);

  return (
    <pre className='whitespace-pre-wrap break-words text-slate-100 text-sm bg-slate-900/30 border border-slate-800 rounded-lg p-4'>
      {content}
    </pre>
  );
}
