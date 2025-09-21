// src/components/model/SingleModelRunner.tsx
'use client';

import {
  usePredictSingleModel,
  type ModelType,
  type SingleModelResponse,
  type TransactionRequest,
} from '@/hooks/queries/model/predict/usePredictSingleModel';
import { useGetWeight } from '@/hooks/queries/model/useWeights';
import { useMemo, useState } from 'react';

/** 요청 템플릿 (textarea 기본값) */
const DEFAULT_TRANSACTION_REQUEST_JSON = `{
  "transactionId": 0,
  "transactionDT": 0,
  "amount": 0,
  "productCode": "string",
  "card1": "string",
  "card2": "string",
  "card3": "string",
  "card4": 0,
  "card5": "string",
  "card6": 0,
  "addr1": 0,
  "addr2": 0,
  "dist1": 0,
  "dist2": 0,
  "purchaserEmailDomain": "string",
  "recipientEmailDomain": "string",
  "countingFeatures": {},
  "timeDeltas": {},
  "matchFeatures": {},
  "vestaFeatures": {},
  "identityFeatures": {},
  "deviceType": "string",
  "deviceInfo": "string",
  "userId": "string",
  "merchant": "string",
  "merchantCategory": "string",
  "transactionTime": "2025-09-21T18:42:05.741Z",
  "latitude": 0,
  "longitude": 0,
  "deviceFingerprint": "string",
  "ipAddress": "string",
  "modelWeights": {},
  "threshold": 0.5,
  "modelVersion": "v1.0.0"
}`;

function safeParse<T>(
  raw: string
): { ok: true; data: T } | { ok: false; err: string } {
  try {
    return { ok: true, data: JSON.parse(raw) as T };
  } catch (e: any) {
    return { ok: false, err: e?.message ?? 'JSON parse error' };
  }
}

export default function SingleModelRunner({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [model, setModel] = useState<ModelType>('lgbm');
  const [raw, setRaw] = useState<string>(DEFAULT_TRANSACTION_REQUEST_JSON);
  const [result, setResult] = useState<SingleModelResponse | null>(null);

  // 서버에 저장된 가중치가 있으면 참고(요청 자체에는 필요 없지만, UX 힌트로 표기)
  const weightsQ = useGetWeight();
  const currentWeights = useMemo(
    () => ({
      lgbm: Number(weightsQ.data?.lgbm ?? 0),
      xgboost: Number(weightsQ.data?.xgboost ?? 0),
      catboost: Number(weightsQ.data?.catboost ?? 0),
    }),
    [weightsQ.data]
  );

  const mutation = usePredictSingleModel();

  const handleRun = async () => {
    setResult(null);
    const parsed = safeParse<TransactionRequest>(raw);
    if (!parsed.ok) {
      alert(`transactionRequest JSON 오류: ${parsed.err}`);
      return;
    }
    try {
      const resp = await mutation.mutateAsync({ model, payload: parsed.data });
      setResult(resp);
    } catch (e: any) {
      alert(`실행 실패: ${e?.message ?? 'unknown error'}`);
    }
  };

  const Container: React.FC<React.PropsWithChildren> = ({ children }) =>
    embedded ? (
      <div className='relative'>{children}</div>
    ) : (
      <section className='bg-slate-900/40 border border-slate-800 rounded-xl p-8 relative'>
        {children}
      </section>
    );

  return (
    <Container>
      <div className='flex items-center justify-between mb-6'>
        <h3 className='text-xl font-semibold text-slate-200'>단일 모델 예측</h3>
        <div className='flex items-center gap-3'>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as ModelType)}
            className='rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100 text-sm'
            aria-label='모델 선택'
          >
            <option value='lgbm'>LGBM</option>
            <option value='xgboost'>XGBoost</option>
            <option value='catboost'>CatBoost</option>
          </select>
          <button
            onClick={handleRun}
            disabled={mutation.isPending}
            className='px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
            title='선택한 단일 모델로 예측'
          >
            {mutation.isPending ? '테스트 중…' : '테스트 시작'}
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* 좌: 요청 JSON */}
        <div>
          <div className='text-sm text-slate-300 mb-2'>
            transactionRequest JSON
          </div>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            spellCheck={false}
            className='w-full h-64 rounded-lg border border-slate-800 bg-slate-950/40 p-3 font-mono text-xs text-slate-100'
            placeholder='{"transactionId":123, ...}'
          />
          <p className='mt-2 text-xs text-slate-500'>
            샘플을 편집 후 “실행”을 누르면, 선택된 단일 모델로만 예측합니다.
          </p>
        </div>

        {/* 우: 결과 */}
        <div className='space-y-3'>
          <div className='text-sm text-slate-300'>결과</div>

          {!result && (
            <div className='text-slate-500 text-sm border border-slate-800 rounded-lg p-4'>
              실행 결과가 여기에 표시됩니다.
            </div>
          )}

          {result && (
            <div className='border border-slate-800 rounded-lg p-4 bg-slate-950/40'>
              <div className='text-slate-200 font-semibold'>
                {result.modelType.toUpperCase()} · 점수:{' '}
                {(Number(result.score) || 0).toFixed(4)}
              </div>
              <div className='mt-2 text-xs text-slate-400'>
                modelVersion: {result.modelVersion} · {result.processingTimeMs}
                ms · tx: {String(result.transactionId)}
              </div>
              <pre className='mt-4 text-[11px] leading-5 bg-slate-950/60 border border-slate-800 rounded-md p-3 overflow-auto text-slate-200'>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
