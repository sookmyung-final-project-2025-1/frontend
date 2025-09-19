'use client';

export default function FraudBadge({ isFraud }: { isFraud: boolean }) {
  return (
    <span
      className={
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ' +
        (isFraud
          ? 'bg-[#F8717126] text-[#FCA5A5]' // red-400/15, red-300 (hex)
          : 'bg-[#4ADE8026] text-[#86EFAC]') // green-400/15, green-300 (hex)
      }
    >
      {isFraud ? '사기' : '정상'}
    </span>
  );
}
