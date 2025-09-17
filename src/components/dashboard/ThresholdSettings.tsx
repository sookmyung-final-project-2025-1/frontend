'use client';

import {
  useSaveThresholdMutation,
  type ThresholdResponse,
} from '@/hooks/queries/dashboard/useSaveThreshold';
import { useGetWeight } from '@/hooks/queries/dashboard/useWeights';
import { useEffect, useState } from 'react';

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

// 안전 파서: string | number | undefined → number | undefined
function toNumber(v: unknown): number | undefined {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export default function ThresholdSettings({
  onChange,
  onSave,
}: {
  onChange?: (v: number) => void;
  onSave?: () => void;
}) {
  const { data, isLoading } = useGetWeight();
  const mutation = useSaveThresholdMutation();

  // 1) 초기값은 확실한 number로
  const [threshold, setThreshold] = useState<number>(0.5);
  const [dirty, setDirty] = useState(false);

  // 2) 서버 값 반영: 숫자로 변환 후, 편집 중(dirty) 아닐 때만 반영
  useEffect(() => {
    const serverRaw = (data as any)?.threshold; // API가 string일 수도 있어서 any
    const serverNum = toNumber(serverRaw);
    if (!dirty && typeof serverNum === 'number') {
      setThreshold(serverNum); // ✅ number만 set
    }
  }, [data, dirty]);

  const handleChange = (v: number) => {
    const next = Math.min(1, Math.max(0, Number(v) || 0));
    setThreshold(next);
    setDirty(true);
    onChange?.(next);
  };

  const handleSave = async () => {
    try {
      const res = await mutation.mutateAsync(threshold);
      // 3) 응답 threshold도 숫자로 변환해 반영
      const savedNum = toNumber((res as ThresholdResponse | any)?.threshold);
      if (typeof savedNum === 'number') {
        setThreshold(savedNum);
      }
      setDirty(false);
      onSave?.();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
      className='rounded-2xl border border-slate-800 bg-slate-900/40'
    >
      <div className='p-4 space-y-6'>
        <div>
          <div className='text-sm text-slate-300 mb-2'>임계치(Threshold)</div>
          <div className='flex items-center gap-3'>
            <Slider
              value={threshold}
              onChange={handleChange}
              className='flex-1'
              min={0}
              max={1}
              step={0.01}
            />
            <div className='w-12 text-right text-sm'>
              {threshold.toFixed(2)}
            </div>
          </div>
          <div className='mt-2'>
            <button
              type='submit'
              disabled={mutation.isPending || isLoading}
              className='px-3 py-1.5 rounded-xl border border-slate-600 hover:bg-slate-800 disabled:opacity-50'
            >
              {mutation.isPending ? '저장 중…' : '임계치 저장'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
