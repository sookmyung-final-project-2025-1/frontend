'use client';

import ConfidenceChart from '@/components/model/ConfidenceChart';
import FeatureImportanceChart from '@/components/model/FeatureImportanceChart';
import ThresholdSettings from '@/components/model/ThresholdSettings';
import { useDashboardData } from '@/contexts/DashboardActionsContext';
import { useState } from 'react';

export default function ModelPage() {
  const { confidenceRange, featureImportance, saveThreshold, savingThreshold } =
    useDashboardData();
  const [threshold, setThreshold] = useState<number>(0.5);

  const handleSaveThreshold = async () => {
    await saveThreshold(threshold);
  };

  return (
    <div className='space-y-8'>
      {/* 헤더 */}
      <section className='bg-slate-900/40 border border-slate-800 rounded-xl p-8'>
        <h2 className='text-xl font-semibold text-slate-200 mb-2'>모델 관리</h2>
        <p className='text-slate-300'>
          모델 버전/가중치/배포 현황 등을 구성하세요.
        </p>
      </section>

      {/* 임계치 + 신뢰도 */}
      <section className='grid grid-cols-1 xl:grid-cols-3 gap-8'>
        {/* 임계치 설정 */}
        <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-6'>
          <h3 className='text-lg font-semibold text-slate-200 mb-4'>
            임계치 설정
          </h3>
          <ThresholdSettings
            onChange={setThreshold}
            onSave={handleSaveThreshold}
          />
          <button
            type='button'
            onClick={handleSaveThreshold}
            disabled={savingThreshold}
            className='mt-4 w-full rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50'
          >
            {savingThreshold ? '저장 중…' : '임계치 저장'}
          </button>
        </div>

        {/* 신뢰도 분석 */}
        <div className='xl:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl p-8 relative'>
          <h3 className='text-xl font-semibold text-slate-200 mb-6'>
            신뢰도 분석
          </h3>
          <ConfidenceChart range={confidenceRange} />
        </div>
      </section>

      {/* 특성 중요도 */}
      <section className='bg-slate-900/40 border border-slate-800 rounded-xl p-8 relative'>
        <h3 className='text-xl font-semibold text-slate-200 mb-6'>
          특성 중요도
        </h3>
        <div className='h-[350px]'>
          <FeatureImportanceChart data={featureImportance} />
        </div>
      </section>
    </div>
  );
}
