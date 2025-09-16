'use client';

export default function TablePlaceholder() {
  return (
    <div className='rounded-2xl border border-slate-800 bg-slate-900/40'>
      <div className='p-4'>
        <div className='flex items-center justify-between'>
          <div className='text-sm text-slate-300'>탐색 / 필터 (요약)</div>
          <button
            type='button'
            className='px-3 py-1.5 rounded-xl border border-slate-600 hover:bg-slate-800'
          >
            전체 보기
          </button>
        </div>
        <div className='mt-4 grid grid-cols-6 text-xs text-slate-400'>
          <div>시간</div>
          <div>유저</div>
          <div>상점</div>
          <div>금액</div>
          <div>최종확률</div>
          <div>라벨</div>
        </div>
        <div className='mt-2 text-slate-400 text-sm'>
          (데모: 최근 10건이 여기 표시됩니다)
        </div>
      </div>
    </div>
  );
}
