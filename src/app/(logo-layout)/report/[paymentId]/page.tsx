import ExampleDayCharts from '@/components/report/DayCharts';
import ReportHeader from '@/components/report/ReportHeader';

const CARDSTYLE =
  'rounded-2xl border border-black/5 bg-white/70 backdrop-blur-sm shadow-sm';

export default async function ReportPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;

  return (
    <div className='mx-auto max-w-screen-2xl px-6  space-y-8'>
      <p className='text-center text-2xl md:text-3xl font-semibold text-[#0E2975] [text-shadow:_4px_5px_12px_rgba(0,0,0,0.15)]'>
        결제지킴이 사기거래 탐지 보고서
      </p>
      <ReportHeader paymentId={paymentId} />

      <section className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        {[
          { label: '총 거래금액', value: '₩ 12.4M', delta: '+9538.5%' },
          { label: '평균 거래금액', value: '₩ 0.13M', delta: '+1.4%' },
          { label: '뭘로 하지', value: '142', delta: '-0.8%' },
          { label: '사기 확률', value: '95%', delta: '+35pt' },
        ].map((k) => (
          <div key={k.label} className={`${CARDSTYLE} p-5`}>
            <div className='text-gray-70 text-sm'>{k.label}</div>
            <div className='mt-1 flex items-baseline gap-2'>
              <div className='text-3xl font-semibold text-[#0E2975]'>
                {k.value}
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${k.delta.startsWith('-') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}
              >
                {k.delta}
              </span>
            </div>
          </div>
        ))}
      </section>

      <section className={`${CARDSTYLE} p-6`}>
        <h2 className='text-lg font-medium mb-3'>일별 추이</h2>
        <div className='h-[340px]'>
          <ExampleDayCharts />
        </div>
      </section>

      <section className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        <div className={`${CARDSTYLE} p-6`}>
          <h3 className='font-medium mb-2'>시간별 거래량</h3>
          <div />
        </div>
        <div className={`${CARDSTYLE} p-6`}>
          <h3 className='font-medium mb-2'>카드사별 발생 거래</h3>
          <div />
        </div>
      </section>

      <section className={`${CARDSTYLE} p-6`}>
        <h3 className='font-medium mb-2'>사기 확률 구간별 비중</h3>
        <div />
        <p className='mt-2 text-xs text-gray-70'>* 구간: 0–20/40/60/80/100%</p>
      </section>

      <section className='grid grid-cols-1 md:grid-cols-3 gap-4'></section>

      <section className={`${CARDSTYLE} p-6`}>
        <h3 className='font-medium mb-3'>비슷한 사례</h3>
        <div />
      </section>

      <section className={`${CARDSTYLE} p-6`}>
        <h3 className='font-medium mb-2'>부록 · 지표 정의</h3>
        <ul className='list-disc pl-5 text-sm text-gray-70 space-y-1'>
          <li>오탐 비율 = 탐지 - 확정 사기 / 탐지</li>
          <li>사기 확률 = 모델 점수(0~1) 백분율</li>
          <li>집계 기준: 승인 거래만 포함, 환불 제외</li>
        </ul>
      </section>
    </div>
  );
}
