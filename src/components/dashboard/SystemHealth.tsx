import { useHealthQuery } from '@/hooks/queries/dashboard/useHealthQuery';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function SystemHealth() {
  const { data } = useHealthQuery();

  if (!data) return <div>불러오는 중입니다...</div>;

  // 상태에 따른 색상 설정
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'text-green-600';
      case 'WARNING':
        return 'text-yellow-600';
      case 'CRITICAL':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return <CheckCircle className='w-6 h-6 text-green-500' />;
      case 'WARNING':
        return <AlertTriangle className='w-6 h-6 text-yellow-500' />;
      case 'CRITICAL':
        return <AlertTriangle className='w-6 h-6 text-red-500' />;
      default:
        return <Activity className='w-6 h-6 text-gray-500' />;
    }
  };

  // 점수를 퍼센테이지로 변환하여 원형 차트용 데이터 생성
  const scoreData = [
    { name: 'Score', value: data.score, fill: '#3b82f6' },
    { name: 'Remaining', value: 100 - data.score, fill: '#e5e7eb' },
  ];

  // 처리 시간 비교 데이터
  const processingTimeData = [
    { name: 'Average', value: data.avgProcessingTime * 1000, fill: '#10b981' },
    { name: 'P95', value: data.p95ProcessingTime * 1000, fill: '#f59e0b' },
  ];

  // 시간대별 모의 데이터 (실제로는 API에서 받아올 데이터)
  const timeSeriesData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    score:
      Math.floor(Math.random() * 30) + 60 + (i > 12 ? Math.sin(i / 4) * 10 : 0),
    avgTime: Math.random() * 0.01 + 0.005,
    confidence: Math.random() * 0.2 + 0.2,
  }));

  const formatTime = (timeInSeconds: number) => {
    if (timeInSeconds === 0) return '0s';
    return timeInSeconds < 1
      ? `${(timeInSeconds * 1000).toFixed(0)}ms`
      : `${timeInSeconds.toFixed(2)}s`;
  };

  return (
    <div className='min-h-screen p-6 text-[#ffffff] rounded-2xl border border-slate-800 bg-slate-900/40'>
      <div className='mx-auto'>
        {/* 헤더 */}
        <div className='mb-8'>
          <p className='text-gray-600'>
            마지막 체크: {new Date(data.checkedAt).toLocaleString('ko-KR')}
          </p>
        </div>

        {/* 상태 카드들 */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {/* 전체 상태 */}
          <div className='bg-white rounded-lg shadow-sm p-6 border'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium'>시스템 상태</p>
                <p
                  className={`text-2xl font-bold ${getStatusColor(data.status)}`}
                >
                  {data.status}
                </p>
              </div>
              {getStatusIcon(data.status)}
            </div>
          </div>

          {/* 헬스 스코어 */}
          <div className='bg-white rounded-lg shadow-sm p-6 border'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium'>헬스 스코어</p>
                <p className='text-2xl font-bold text-blue-600'>
                  {data.score}/100
                </p>
              </div>
              <TrendingUp className='w-6 h-6 text-blue-500' />
            </div>
          </div>

          {/* 평균 처리 시간 */}
          <div className='bg-white rounded-lg shadow-sm p-6 border'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium'>평균 처리 시간</p>
                <p className='text-2xl font-bold text-green-600'>
                  {formatTime(data.avgProcessingTime)}
                </p>
              </div>
              <Clock className='w-6 h-6 text-green-500' />
            </div>
          </div>

          {/* 평균 신뢰도 */}
          <div className='bg-white rounded-lg shadow-sm p-6 border'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>평균 신뢰도</p>
                <p className='text-2xl font-bold text-purple-600'>
                  {(data.avgConfidenceScore * 100).toFixed(1)}%
                </p>
              </div>
              <Activity className='w-6 h-6 text-purple-500' />
            </div>
          </div>
        </div>

        {/* 차트 섹션 */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
          {/* 헬스 스코어 원형 차트 */}
          <div className='bg-white rounded-lg shadow-sm p-6 border'>
            <h3 className='text-lg font-semibold mb-4'>헬스 스코어</h3>
            <div className='h-64'>
              <ResponsiveContainer width='100%' height='75%'>
                <PieChart>
                  <Pie
                    data={scoreData}
                    cx='50%'
                    cy='50%'
                    innerRadius={60}
                    outerRadius={80}
                    startAngle={90}
                    endAngle={-270}
                    dataKey='value'
                  >
                    {scoreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className='w-full mt-4 flex gap-2 items-end justify-end'>
                <p className='text-3xl font-bold text-blue-600'>{data.score}</p>
                <p className='text-sm text-gray-500'>/ 100</p>
              </div>
            </div>
          </div>

          {/* 처리 시간 비교 차트 */}
          <div className='bg-white rounded-lg shadow-sm p-6 border'>
            <h3 className='text-lg font-semibold mb-4'>처리 시간 비교</h3>
            <div className='h-64'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart
                  data={processingTimeData}
                  margin={{ top: 10, right: 16, bottom: 8, left: 95 }} // ← 왼쪽 여백 추가
                  barCategoryGap='10%' // ← 막대 간격 확장(상대적으로 얇게)
                >
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis
                    dataKey='name'
                    padding={{ left: 20, right: 20 }} // ← 양 끝단 패딩으로 중앙 정렬 느낌
                    tickMargin={8}
                  />
                  <YAxis
                    width={64} // ← Y축 레이블 영역 확보(왼쪽 끼임 방지)
                    tickMargin={8}
                    tickFormatter={(v: number) => formatTime(v)}
                  />
                  <Tooltip
                    formatter={(value) => {
                      const num = Number(value);
                      return [`${num.toFixed(2)}ms`, '처리 시간'];
                    }}
                  />
                  <Bar
                    dataKey='value'
                    radius={[2, 2, 0, 0]}
                    barSize={70} // ← 막대 두께 고정(대략 절반 느낌)
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 24시간 트렌드 차트 */}
        <div className='bg-white rounded-lg shadow-sm p-6 border'>
          <h3 className='text-lg font-semibold mb-4'>24시간 트렌드</h3>
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='hour' />
                <YAxis yAxisId='left' domain={[0, 100]} />
                <YAxis
                  yAxisId='right'
                  orientation='right'
                  tickFormatter={(value) => `${(value * 1000).toFixed(1)}ms`}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'score') return [value, '헬스 스코어'];
                    if (name === 'avgTime')
                      return [
                        `${(Number(value) * 1000).toFixed(2)}ms`,
                        '처리 시간',
                      ];
                    if (name === 'confidence')
                      return [`${(Number(value) * 100).toFixed(1)}%`, '신뢰도'];
                    return [value, name];
                  }}
                />
                <Line
                  yAxisId='left'
                  type='monotone'
                  dataKey='score'
                  stroke='#3b82f6'
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  yAxisId='right'
                  type='monotone'
                  dataKey='avgTime'
                  stroke='#10b981'
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className='flex justify-center mt-4 space-x-6'>
            <div className='flex items-center'>
              <div className='w-3 h-3 bg-blue-500 rounded-full mr-2'></div>
              <span className='text-sm text-gray-600'>헬스 스코어</span>
            </div>
            <div className='flex items-center'>
              <div className='w-3 h-3 bg-green-500 rounded-full mr-2'></div>
              <span className='text-sm text-gray-600'>처리 시간</span>
            </div>
          </div>
        </div>

        {/* 세부 정보 테이블 */}
        <div className='bg-white rounded-lg shadow-sm p-6 border mt-6'>
          <h3 className='text-lg font-semibold mb-4'>세부 메트릭</h3>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <tbody className='bg-white divide-y divide-gray-200'>
                <tr>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200'>
                    헬스 스코어
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-400'>
                    {data.score}/100
                  </td>
                </tr>
                <tr>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200'>
                    평균 처리 시간
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-400'>
                    {formatTime(data.avgProcessingTime)}
                  </td>
                </tr>
                <tr>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200'>
                    P95 처리 시간
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-400'>
                    {formatTime(data.p95ProcessingTime)}
                  </td>
                </tr>
                <tr>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200'>
                    평균 신뢰도 점수
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-400'>
                    {(data.avgConfidenceScore * 100).toFixed(2)}%
                  </td>
                </tr>
                <tr>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                    시스템 상태
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        data.status === 'HEALTHY'
                          ? 'bg-[#DCFCE7] text-[#166534]'
                          : data.status === 'WARNING'
                            ? 'bg-[#FEF9C3] text-[#854D0E]'
                            : 'bg-[#FEE2E2] text-[#991B1B]'
                      }`}
                    >
                      {data.status}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
