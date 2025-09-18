'use client';

import AlarmsPanel from '@/components/dashboard/alarms/AlarmsPanel';

export default function AlarmsPage() {
  return (
    <section className='grid grid-cols-1 gap-8'>
      <div className='col-span-1'>
        <AlarmsPanel />
      </div>
    </section>
  );
}
