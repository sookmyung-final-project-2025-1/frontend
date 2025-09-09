import Dashboard from '@/components/dashboard/Dashboard';
import FraudAmtDualAxis from '@/components/dashboard/FraudAmtDualAxis';
import MainGraph from '@/components/dashboard/MainGraph';
import Payment from '@/components/dashboard/Payment';
import { FadeInOnScroll } from '@/components/ui/FadeInOnScroll';
import { makeFraudAmtData } from '@/lib/makeFraudMockData';
import { useMemo } from 'react';

export default function DashBoardPage() {
  // MOCK Data
  const data = useMemo(() => makeFraudAmtData('2018-01-01', 240), []);

  return (
    <div className='w-full flex flex-col gap-[35px]'>
      <FadeInOnScroll>
        <Dashboard />
      </FadeInOnScroll>
      <FadeInOnScroll delay={0.2}>
        <MainGraph />
      </FadeInOnScroll>
      <FadeInOnScroll delay={0.5}>
        <Payment />
      </FadeInOnScroll>
      <FadeInOnScroll delay={1}>
        <FraudAmtDualAxis data={data} />
      </FadeInOnScroll>
    </div>
  );
}
