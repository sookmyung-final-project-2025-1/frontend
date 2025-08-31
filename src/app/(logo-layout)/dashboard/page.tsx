import Dashboard from '@/components/dashboard/Dashboard';
import MainGraph from '@/components/dashboard/MainGraph';

export default function DashBoardPage() {
  return (
    <div className='w-full flex flex-col gap-[15px] mt-[20px]'>
      <Dashboard />
      <MainGraph />
    </div>
  );
}
