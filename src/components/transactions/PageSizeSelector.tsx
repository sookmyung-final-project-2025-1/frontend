'use client';

type Props = {
  size: number;
  onChange: (size: number) => void;
};

export default function PageSizeSelector({ size, onChange }: Props) {
  return (
    <div className='flex items-center gap-2 mb-8'>
      <span className='text-sm text-slate-400'>페이지당 항목 수:</span>
      <select
        value={size}
        onChange={(e) => onChange(Number(e.target.value))}
        className='px-3 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/60 focus:border-slate-500'
      >
        <option value={5}>5개</option>
        <option value={10}>10개</option>
        <option value={20}>20개</option>
        <option value={50}>50개</option>
      </select>
    </div>
  );
}
