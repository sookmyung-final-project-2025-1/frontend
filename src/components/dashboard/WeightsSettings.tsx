'use client';

import { useDashboardData } from '@/contexts/DashboardActionsContext';
import type {
  WeightsRequest,
  WeightsResponse,
} from '@/hooks/queries/dashboard/useWeights';
import { useGetWeight } from '@/hooks/queries/dashboard/useWeights';
import { useEffect, useMemo, useState } from 'react';

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

type WeightsSettingsProps = {
  onSuccess?: (resp: WeightsResponse) => void;
  onError?: (err: unknown) => void;
  className?: string;
};

export default function WeightsSettings({
  onSuccess,
  onError,
  className,
}: WeightsSettingsProps) {
  const { saveWeights, savingWeights } = useDashboardData();
  const { data, isLoading, error } = useGetWeight();

  // 화면에 바인딩되는 현재 값
  const [weights, setWeights] = useState<WeightsRequest>({
    lgbmWeight: 0.33,
    xgboostWeight: 0.33,
    catboostWeight: 0.34,
    autoNormalize: true,
    validWeightSum: true,
  });

  // 서버에서 마지막으로 받은 스냅샷 (리셋은 항상 이걸로 복원)
  const [serverSnapshot, setServerSnapshot] = useState<WeightsRequest | null>(
    null
  );

  // 사용자가 편집 중인지 플래그
  const [dirty, setDirty] = useState(false);

  // 서버 데이터가 바뀌면(리패치 포함), 편집 중이 아닐 때 weights + snapshot을 동기화
  useEffect(() => {
    if (!data) return;

    const incoming: WeightsRequest = {
      lgbmWeight: data.lgbm,
      xgboostWeight: data.xgboost,
      catboostWeight: data.catboost,
      // 서버가 이 플래그들을 응답에 안 준다면 기존 값을 유지하거나 정책값 사용
      autoNormalize: weights.autoNormalize,
      validWeightSum: weights.validWeightSum,
    };

    // 스냅샷은 항상 최신 서버 값을 반영
    setServerSnapshot(incoming);

    // 편집 중이 아닐 때만 화면 값도 서버 값으로 동기화
    if (!dirty) {
      setWeights(incoming);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]); // dirty/weights를 의존성에 넣으면 입력 중에 덮어쓸 수 있음

  const normalized = useMemo(() => {
    const sum =
      weights.lgbmWeight + weights.xgboostWeight + weights.catboostWeight || 1;
    return {
      lgbm: weights.lgbmWeight / sum,
      xgb: weights.xgboostWeight / sum,
      cat: weights.catboostWeight / sum,
    };
  }, [weights]);

  const setWeight = (
    key: keyof Pick<
      WeightsRequest,
      'lgbmWeight' | 'xgboostWeight' | 'catboostWeight'
    >,
    v: number
  ) => {
    setWeights((prev) => ({ ...prev, [key]: clamp(v, 0, 1) }));
    setDirty(true);
  };

  const handleReset = () => {
    if (!serverSnapshot) return; // 스냅샷 없으면 아무 것도 하지 않음
    setWeights(serverSnapshot);
    setDirty(false);
  };

  const handleSave = async () => {
    try {
      const resp = await saveWeights(weights); // Promise<WeightsResponse>

      // 저장 성공 시 서버가 반환한 실제 값으로 weights + snapshot 동기화
      if (resp) {
        const saved: WeightsRequest = {
          lgbmWeight: resp.lgbm,
          xgboostWeight: resp.xgboost,
          catboostWeight: resp.catboost,
          autoNormalize: weights.autoNormalize,
          validWeightSum: weights.validWeightSum,
        };
        setServerSnapshot(saved);
        setWeights(saved);
        setDirty(false);
      }

      onSuccess?.(resp);
    } catch (e) {
      onError?.(e);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
      className={`rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-6 ${className ?? ''}`}
    >
      <div className='text-sm text-slate-300 mb-2'>
        앙상블 가중치 (정규화 반영 미리보기)
      </div>

      {!serverSnapshot && isLoading && (
        <div className='text-xs text-slate-500'>현재 가중치를 불러오는 중…</div>
      )}
      {error && (
        <div className='text-xs text-red-400'>
          가중치 조회 실패. 기본값으로 표시됩니다.
        </div>
      )}

      <div className='grid grid-cols-3 gap-4'>
        <WeightControl
          label='LGBM'
          value={weights.lgbmWeight}
          normalized={normalized.lgbm}
          onChange={(v) => setWeight('lgbmWeight', v)}
        />
        <WeightControl
          label='XGBoost'
          value={weights.xgboostWeight}
          normalized={normalized.xgb}
          onChange={(v) => setWeight('xgboostWeight', v)}
        />
        <WeightControl
          label='CatBoost'
          value={weights.catboostWeight}
          normalized={normalized.cat}
          onChange={(v) => setWeight('catboostWeight', v)}
        />
      </div>

      <div className='flex gap-8 items-center'>
        <div className='flex gap-5'>
          <label className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={weights.autoNormalize}
              onChange={(e) => {
                setWeights((prev) => ({
                  ...prev,
                  autoNormalize: e.target.checked,
                }));
                setDirty(true);
              }}
            />
            자동 정규화
          </label>

          <label className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={weights.validWeightSum}
              onChange={(e) => {
                setWeights((prev) => ({
                  ...prev,
                  validWeightSum: e.target.checked,
                }));
                setDirty(true);
              }}
            />
            가중치 합계가 1이어야만 허용
          </label>
        </div>

        <div className='flex gap-2'>
          <button
            type='submit'
            disabled={savingWeights || (!serverSnapshot && isLoading)}
            className='px-3 py-1.5 rounded-xl bg-slate-100 text-slate-900 hover:opacity-90 disabled:opacity-50'
          >
            {savingWeights ? '저장 중…' : '가중치 저장'}
          </button>
          <button
            type='button'
            onClick={handleReset}
            disabled={!serverSnapshot}
            className='px-3 py-1.5 rounded-xl border border-slate-600 hover:bg-slate-800 disabled:opacity-50'
          >
            리셋
          </button>
        </div>
      </div>
    </form>
  );
}

function WeightControl({
  label,
  value,
  normalized,
  onChange,
}: {
  label: string;
  value: number;
  normalized: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className='space-y-2'>
      <div className='text-xs text-slate-400'>{label}</div>
      <Slider value={value} onChange={onChange} min={0} max={1} step={0.01} />
      <div className='text-xs text-slate-400'>
        raw {value} · norm {normalized.toFixed(3)}
      </div>
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
