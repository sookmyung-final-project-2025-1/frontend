'use client';

import ConfidenceChart from '@/components/model/ConfidenceChart';
import FeatureImportanceChart from '@/components/model/FeatureImportanceChart';
import ThresholdSettings from '@/components/model/ThresholdSettings';
import WeightsSettings from '@/components/model/WeightsSettings';
import { useDashboardData } from '@/contexts/DashboardActionsContext';
import { useState } from 'react';

export default function ModelPage() {
  const { confidenceRange, featureImportance, saveThreshold } =
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
        <p className='text-slate-300'>모델 설정 및 모니터링</p>
      </section>

      {/* 첫 번째 줄: 가중치(3.5) + 임계값(1.5) */}
      <section className='grid grid-cols-10 gap-8'>
        {/* 가중치 (7/10 = 3.5) */}
        <div className='col-span-7 bg-slate-900/40 border border-slate-800 rounded-xl p-8 relative'>
          <h3 className='text-xl font-semibold text-slate-200 mb-6'>
            모델별 가중치 설정
          </h3>
          <WeightsSettings />
        </div>

        {/* 임계값 (3/10 = 1.5) */}
        <div className='col-span-3 bg-slate-900/40 border border-slate-800 rounded-xl p-8'>
          <h3 className='text-xl font-semibold text-slate-200 mb-6'>
            임계치 설정
          </h3>
          <ThresholdSettings
            onChange={setThreshold}
            onSave={handleSaveThreshold}
          />
        </div>
      </section>

      {/* 두 번째 줄: 신뢰도 */}
      <section className='bg-slate-900/40 border border-slate-800 rounded-xl p-8 relative'>
        <h3 className='text-xl font-semibold text-slate-200 mb-6'>
          신뢰도 분석
        </h3>
        <ConfidenceChart range={confidenceRange} />
      </section>

      {/* 세 번째 줄: 피처 */}
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
