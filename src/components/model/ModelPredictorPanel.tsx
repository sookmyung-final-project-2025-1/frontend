// src/components/model/ModelPredictorPanel.tsx
'use client';

import {
  usePredictUserWeight,
  type UserWeightRequest,
  type UserWeightResponse,
} from '@/hooks/queries/model/predict/usePredictUserWeight';
import { useGetWeight } from '@/hooks/queries/model/useWeights';
import { useState } from 'react';

/* ---------- utils ---------- */
function safeParse<T>(
  raw: string
): { ok: true; data: T } | { ok: false; err: string } {
  try {
    return { ok: true, data: JSON.parse(raw) as T };
  } catch (e: any) {
    return { ok: false, err: e?.message ?? 'JSON parse error' };
  }
}

// 평탄화/중첩 응답 모두 수용: 점수/가중치 추출
function pickScores(r?: Partial<UserWeightResponse> | null) {
  const ms = (r?.modelScores ?? {}) as any;
  const lgbm = r?.lgbmScore ?? ms.lgbm ?? ms.LGBM ?? 0;
  const xgb = r?.xgboostScore ?? ms.xgboost ?? ms.xgb ?? ms.XGBoost ?? 0;
  const cat = r?.catboostScore ?? ms.catboost ?? ms.CatBoost ?? 0;
  return {
    lgbm: Number(lgbm) || 0,
    xgboost: Number(xgb) || 0,
    catboost: Number(cat) || 0,
  };
}
function pickWeights(r?: Partial<UserWeightResponse> | null) {
  const w = (r?.weights ?? {}) as any;
  const lgbm = r?.lgbmWeight ?? w.lgbm ?? 0;
  const xgb = r?.xgboostWeight ?? w.xgboost ?? 0;
  const cat = r?.catboostWeight ?? w.catboost ?? 0;
  return {
    lgbm: Number(lgbm) || 0,
    xgboost: Number(xgb) || 0,
    catboost: Number(cat) || 0,
  };
}

// 화면에 보여줄 JSON: flat 우선, null/undefined 제거
function toDisplayResult(r: UserWeightResponse) {
  const display: Record<string, unknown> = {
    transactionId: r.transactionId,
    finalScore: r.finalScore,
    finalPrediction: r.finalPrediction,
    threshold: r.threshold,
    processingTimeMs: r.processingTimeMs,
    modelVersion: r.modelVersion,
    predictionTime: r.predictionTime,
    success: r.success,
    errorMessage: r.errorMessage,

    lgbmScore:
      r.lgbmScore ?? r.modelScores?.lgbm ?? (r.modelScores as any)?.LGBM,
    xgboostScore:
      r.xgboostScore ??
      r.modelScores?.xgboost ??
      (r.modelScores as any)?.xgb ??
      (r.modelScores as any)?.XGBoost,
    catboostScore:
      r.catboostScore ??
      r.modelScores?.catboost ??
      (r.modelScores as any)?.CatBoost,

    lgbmWeight: r.lgbmWeight ?? r.weights?.lgbm,
    xgboostWeight: r.xgboostWeight ?? r.weights?.xgboost,
    catboostWeight: r.catboostWeight ?? r.weights?.catboost,

    confidenceScore: r.confidenceScore ?? undefined,
    featureImportance: r.featureImportance ?? undefined,
    attentionScores: r.attentionScores ?? undefined,
  };
  Object.keys(display).forEach((k) => {
    if (display[k] == null) delete display[k];
  });
  return display;
}

function ScoreBar({ label, score }: { label: string; score?: number }) {
  const s = Number(score ?? 0);
  const pct = Math.max(0, Math.min(100, Math.round(s * 100)));
  return (
    <div>
      <div className='flex justify-between text-slate-300'>
        <span>{label}</span>
        <span className='text-slate-400'>{pct}%</span>
      </div>
      <div className='h-2 bg-slate-800 rounded-md overflow-hidden'>
        <div className='h-full bg-slate-200' style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* 요청 템플릿: 예측 API에 보낼 transactionRequest 샘플 */
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
  "transactionTime": "2025-09-21T17:49:09.873Z",
  "latitude": 0,
  "longitude": 0,
  "deviceFingerprint": "string",
  "ipAddress": "string",
  "modelWeights": {},
  "threshold": 0,
  "modelVersion": "string"
}`;

export default function ModelPredictorPanel({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const weightsQ = useGetWeight(); // { lgbm, xgboost, catboost } 가정
  const { data: saveWeights } = useGetWeight();

  const [threshold, setThreshold] = useState<number>(0.5);
  const [raw, setRaw] = useState<string>(DEFAULT_TRANSACTION_REQUEST_JSON);

  const [result, setResult] = useState<UserWeightResponse | null>(null);
  const predictM = usePredictUserWeight();

  const handlePredict = async () => {
    setResult(null);

    const parsed = safeParse<any>(raw);
    if (!parsed.ok) {
      alert(`transactionRequest JSON 오류: ${parsed.err}`);
      return;
    }

    const l = Number(weightsQ.data?.lgbm ?? 0.33);
    const x = Number(weightsQ.data?.xgboost ?? 0.33);
    const c = Number(weightsQ.data?.catboost ?? 0.34);
    const sum = l + x + c || 1;

    const body: UserWeightRequest = {
      transactionRequest: { ...parsed.data, threshold },
      lgbmWeight: l,
      xgboostWeight: x,
      catboostWeight: c,
      autoNormalize: true,
      weightSum: sum,
      validWeightSum: true,
    };

    try {
      const resp = await predictM.mutateAsync(body);
      setResult(resp);
    } catch (e: any) {
      alert(`예측 실패: ${e?.message ?? 'unknown error'}`);
    }
  };

  const scores = pickScores(result ?? undefined);
  const weights = pickWeights(result ?? undefined);

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
        <h3 className='text-xl font-semibold text-slate-200'>
          가중치 테스트 (앙상블 모델 예측)
        </h3>
        <div className='flex items-center gap-3'>
          <div className='text-s text-slate-400 hidden md:block'>
            저장된 가중치 · LGBM {saveWeights?.lgbm} • XGB:{' '}
            {saveWeights?.xgboost} • CAT: {saveWeights?.catboost}
          </div>
          <button
            onClick={handlePredict}
            disabled={predictM.isPending}
            className='px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
            title='현재 가중치로 예측'
          >
            {predictM.isPending ? '예측 중…' : '현재 가중치로 예측'}
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-900/40 border border-slate-800 rounded-xl p-8'>
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
            샘플 트랜잭션 JSON을 붙여넣고 “현재 가중치로 예측”을 클릭하세요.
          </p>
        </div>

        {/* 우: 결과 */}
        <div className='space-y-3'>
          <div className='text-sm text-slate-300'>결과</div>

          {!result && (
            <div className='text-slate-500 text-sm border border-slate-800 rounded-lg p-4'>
              예측 결과가 여기에 표시됩니다.
            </div>
          )}

          {result && (
            <div className='border border-slate-800 rounded-lg p-4 bg-slate-950/40'>
              <div className='flex items-center justify-between'>
                <div className='text-slate-200 font-semibold'>
                  최종 점수: {(Number(result.finalScore) || 0).toFixed(4)}
                </div>
                <div
                  className={`text-sm px-2 py-1 rounded-md ${
                    result.finalPrediction
                      ? 'bg-rose-600/20 text-rose-300'
                      : 'bg-emerald-600/20 text-emerald-300'
                  }`}
                >
                  {result.finalPrediction ? 'Fraud' : 'Legit'}
                </div>
              </div>

              <div className='mt-2 text-xs text-slate-400'>
                threshold: {Number(result.threshold).toFixed(2)} · modelVersion:{' '}
                {result.modelVersion} · {result.processingTimeMs}ms
                {result.predictionTime ? ` · ${result.predictionTime}` : ''}
                {typeof result.success === 'boolean' && (
                  <> · status: {result.success ? 'OK' : 'FAIL'}</>
                )}
              </div>
              {result.errorMessage && (
                <div className='mt-1 text-xs text-amber-300'>
                  error: {result.errorMessage}
                </div>
              )}

              <div className='mt-4 grid grid-cols-3 gap-2 text-sm'>
                <ScoreBar label='LGBM' score={scores.lgbm} />
                <ScoreBar label='XGBoost' score={scores.xgboost} />
                <ScoreBar label='CatBoost' score={scores.catboost} />
              </div>

              <div className='mt-2 text-xs text-slate-400'>
                weights ⇒ lgbm {weights.lgbm.toFixed(3)} · xgb{' '}
                {weights.xgboost.toFixed(3)} · cat {weights.catboost.toFixed(3)}
              </div>

              <pre className='mt-4 text-[11px] leading-5 bg-slate-950/60 border border-slate-800 rounded-md p-3 overflow-auto text-slate-200'>
                {JSON.stringify(toDisplayResult(result), null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
