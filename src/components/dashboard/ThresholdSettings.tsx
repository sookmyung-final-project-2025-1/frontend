'use client';

function Slider({
  value,
  onChange,
  className,
  min = 0,
  max = 1,
  step = 0.01,
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type='range'
      min={min}
      max={max}
      step={step}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className={className}
    />
  );
}

export default function ThresholdSettings({
  threshold,
  onChange,
  onSave,
}: {
  threshold: number;
  onChange: (v: number) => void;
  onSave: () => void;
}) {
  return (
    <div className='rounded-2xl border border-slate-800 bg-slate-900/40'>
      <div className='p-4 space-y-6'>
        <div>
          <div className='text-sm text-slate-300 mb-2'>임계치(Threshold)</div>
          <div className='flex items-center gap-3'>
            <Slider value={threshold} onChange={onChange} className='flex-1' />
            <div className='w-12 text-right text-sm'>
              {threshold.toFixed(2)}
            </div>
          </div>
          <div className='mt-2'>
            <button
              type='button'
              onClick={onSave}
              className='px-3 py-1.5 rounded-xl border border-slate-600 hover:bg-slate-800'
            >
              임계치 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
