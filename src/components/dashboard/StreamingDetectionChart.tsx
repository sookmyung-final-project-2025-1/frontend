'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type DetectionResult = {
  timestamp: string;
  score: number;
  prediction: 'fraud' | 'normal';
  confidence: number;
  models: {
    lgbm: number;
    xgb: number;
    cat: number;
  };
};

type Props = {
  data: DetectionResult[];
  playing: boolean;
  currentPosition: number; // 0-100%
  threshold: number;
  timeRange: '24h' | '7d' | '30d';
  virtualTime: string;
};

export default function StreamingDetectionChart({
  data,
  playing,
  currentPosition,
  threshold,
  timeRange,
  virtualTime,
}: Props) {
  const [visibleData, setVisibleData] = useState<DetectionResult[]>([]);
  const [animationIndex, setAnimationIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 현재 위치에 따른 데이터 슬라이싱
  useEffect(() => {
    if (!data.length) return;

    const endIndex = Math.floor((data.length * currentPosition) / 100);
    const newVisibleData = data.slice(0, Math.max(1, endIndex));

    setVisibleData(newVisibleData);
    setAnimationIndex(newVisibleData.length);
  }, [data, currentPosition]);

  // 재생 중일 때 자동 진행
  useEffect(() => {
    if (playing && data.length > 0) {
      const interval = setInterval(() => {
        setAnimationIndex((prev) => {
          if (prev >= data.length) return prev;
          return prev + 1;
        });
      }, 100); // 0.1초마다 한 포인트씩

      intervalRef.current = interval;
      return () => clearInterval(interval);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [playing, data.length]);

  // 애니메이션 인덱스에 따른 visible 데이터 업데이트
  useEffect(() => {
    if (data.length > 0 && animationIndex > 0) {
      setVisibleData(data.slice(0, animationIndex));
    }
  }, [animationIndex, data]);

  // 차트 데이터 변환
  const chartData = visibleData.map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString(),
    score: item.score,
    prediction: item.prediction === 'fraud' ? 1 : 0,
    confidence: item.confidence,
    lgbm: item.models.lgbm,
    xgb: item.models.xgb,
    cat: item.models.cat,
  }));

  // 최근 탐지 결과들
  const recentResults = visibleData.slice(-10);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className='bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg'>
          <p className='text-slate-300 text-sm'>{`시간: ${label}`}</p>
          <p
            className={`font-semibold ${data.prediction === 1 ? 'text-red-400' : 'text-green-400'}`}
          >
            {`예측: ${data.prediction === 1 ? '사기' : '정상'}`}
          </p>
          <p className='text-blue-400'>{`스코어: ${data.score.toFixed(3)}`}</p>
          <p className='text-yellow-400'>{`신뢰도: ${(data.confidence * 100).toFixed(1)}%`}</p>
          <div className='mt-2 space-y-1'>
            <p className='text-xs text-slate-400'>모델별 기여도:</p>
            <p className='text-xs'>LGBM: {(data.lgbm * 100).toFixed(1)}%</p>
            <p className='text-xs'>XGB: {(data.xgb * 100).toFixed(1)}%</p>
            <p className='text-xs'>CAT: {(data.cat * 100).toFixed(1)}%</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className='space-y-4'>
      {/* 메인 차트 */}
      <div className='bg-slate-900 border border-slate-700 rounded-xl p-4'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-lg font-semibold'>실시간 사기 탐지 결과</h3>
          <div className='flex items-center gap-4 text-sm'>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 bg-red-500 rounded-full'></div>
              <span>사기 (≥{threshold})</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 bg-green-500 rounded-full'></div>
              <span>정상 (&lt;{threshold})</span>
            </div>
            <div className='text-slate-400'>
              {visibleData.length} / {data.length} 포인트
            </div>
          </div>
        </div>

        <div className='h-80'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
              <XAxis
                dataKey='time'
                stroke='#9CA3AF'
                fontSize={12}
                interval='preserveStartEnd'
              />
              <YAxis stroke='#9CA3AF' fontSize={12} domain={[0, 1]} />
              <Tooltip content={<CustomTooltip />} />

              {/* 임계값 라인 */}
              <ReferenceLine
                y={threshold}
                stroke='#EF4444'
                strokeDasharray='5 5'
                label={{
                  value: `Threshold: ${threshold}`,
                  position: 'insideTopRight',
                }}
              />

              {/* 스코어 라인 */}
              <Line
                type='monotone'
                dataKey='score'
                stroke='#3B82F6'
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 0, r: 2 }}
                activeDot={{ r: 4, stroke: '#3B82F6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 최근 탐지 결과 목록 */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* 실시간 스트림 */}
        <div className='bg-slate-900 border border-slate-700 rounded-xl p-4'>
          <h4 className='font-semibold mb-3 flex items-center gap-2'>
            <div
              className={`w-2 h-2 rounded-full ${playing ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}
            ></div>
            실시간 스트림
          </h4>

          <div className='space-y-2 max-h-60 overflow-y-auto'>
            {recentResults.reverse().map((result, index) => (
              <div
                key={`${result.timestamp}-${index}`}
                className={`p-2 rounded-lg border transition-all ${
                  result.prediction === 'fraud'
                    ? 'bg-red-900/20 border-red-700/50 text-red-200'
                    : 'bg-green-900/20 border-green-700/50 text-green-200'
                }`}
              >
                <div className='flex justify-between items-center'>
                  <span className='text-xs font-mono'>
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      result.prediction === 'fraud'
                        ? 'bg-red-600 text-white'
                        : 'bg-green-600 text-white'
                    }`}
                  >
                    {result.prediction === 'fraud' ? '사기' : '정상'}
                  </span>
                </div>
                <div className='text-xs mt-1 flex justify-between'>
                  <span>Score: {result.score.toFixed(3)}</span>
                  <span>신뢰도: {(result.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 통계 정보 */}
        <div className='bg-slate-900 border border-slate-700 rounded-xl p-4'>
          <h4 className='font-semibold mb-3'>탐지 통계</h4>

          <div className='space-y-3'>
            {visibleData.length > 0 && (
              <>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-red-400'>
                      {
                        visibleData.filter((r) => r.prediction === 'fraud')
                          .length
                      }
                    </div>
                    <div className='text-xs text-slate-400'>사기 탐지</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-green-400'>
                      {
                        visibleData.filter((r) => r.prediction === 'normal')
                          .length
                      }
                    </div>
                    <div className='text-xs text-slate-400'>정상 거래</div>
                  </div>
                </div>

                <div className='border-t border-slate-700 pt-3'>
                  <div className='text-sm space-y-1'>
                    <div className='flex justify-between'>
                      <span className='text-slate-400'>평균 스코어:</span>
                      <span>
                        {(
                          visibleData.reduce((sum, r) => sum + r.score, 0) /
                          visibleData.length
                        ).toFixed(3)}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-slate-400'>평균 신뢰도:</span>
                      <span>
                        {(
                          (visibleData.reduce(
                            (sum, r) => sum + r.confidence,
                            0
                          ) /
                            visibleData.length) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-slate-400'>사기 비율:</span>
                      <span>
                        {(
                          (visibleData.filter((r) => r.prediction === 'fraud')
                            .length /
                            visibleData.length) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
