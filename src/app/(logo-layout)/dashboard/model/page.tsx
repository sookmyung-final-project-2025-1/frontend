// src/app/(logo-layout)/dashboard/model/page.tsx
'use client';

import ConfidenceChart from '@/components/model/ConfidenceChart';
import FeatureImportanceChart from '@/components/model/FeatureImportanceChart';
import ModelDashboard from '@/components/model/ModelDashboard';
import ModelPredictorPanel from '@/components/model/ModelPredictorPanel';
import SingleModelRunner from '@/components/model/SingleModelRunner';
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
      <ModelDashboard />

      {/* ✅ 한 섹션으로 묶어서 border 공유 */}
      <section className='bg-slate-900/40 border border-slate-800 rounded-xl p-8'>
        {/* 1행: 가중치(7) + 임계값(3) */}
        <div className='grid grid-cols-10 gap-8'>
          <div className='col-span-7'>
            <h3 className='text-xl font-semibold text-slate-200 mb-6'>
              모델별 가중치 설정
            </h3>
            <WeightsSettings />
          </div>
          <div className='col-span-3'>
            <h3 className='text-xl font-semibold text-slate-200 mb-6'>
              임계치 설정
            </h3>
            <ThresholdSettings
              onChange={setThreshold}
              onSave={handleSaveThreshold}
            />
          </div>
        </div>

        {/* 구분선 */}
        <div className='my-8 border-t border-slate-800' />

        {/* 2행: 앙상블 가중치 테스트(embedded) */}
        <ModelPredictorPanel embedded />

        {/* 구분선 */}
        <div className='my-8 border-t border-slate-800' />

        {/* 3행: 단일 모델 테스트(embedded) */}
        <SingleModelRunner embedded />
      </section>

      {/* 신뢰도 */}
      <section className='bg-slate-900/40 border border-slate-800 rounded-xl p-8 relative'>
        <h3 className='text-xl font-semibold text-slate-200 mb-6'>
          신뢰도 분석
        </h3>
        <ConfidenceChart range={confidenceRange} />
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
