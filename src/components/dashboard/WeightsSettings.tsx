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

export default function WeightsSettings({
  weights,
  normalized,
  onChange,
  onSave,
  onReset,
}: {
  weights: Record<string, number>;
  normalized: Record<string, number>;
  onChange: (key: string, v: number) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div className='rounded-2xl border border-slate-800 bg-slate-900/40'>
      <div className='p-4 space-y-6'>
        <div>
          <div className='text-sm text-slate-300 mb-2'>
            앙상블 가중치 (정규화 반영 미리보기)
          </div>
          <div className='grid grid-cols-3 gap-4'>
            {Object.keys(weights).map((k) => (
              <div key={k} className='space-y-2'>
                <div className='text-xs text-slate-400'>{k.toUpperCase()}</div>
                <Slider value={weights[k]} onChange={(v) => onChange(k, v)} />
                <div className='text-xs text-slate-400'>
                  raw {weights[k].toFixed(2)} · norm {normalized[k].toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          <div className='mt-2 flex gap-2'>
            <button
              type='button'
              onClick={onSave}
              className='px-3 py-1.5 rounded-xl bg-slate-100 text-slate-900 hover:opacity-90'
            >
              가중치 저장
            </button>
            <button
              type='button'
              onClick={onReset}
              className='px-3 py-1.5 rounded-xl border border-slate-600 hover:bg-slate-800'
            >
              리셋
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
