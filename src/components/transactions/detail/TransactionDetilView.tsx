'use client';

import FraudBadge from '@/components/ui/FraudBadge';
import JSONBlock from '@/components/ui/JSONBlock';
import KeyValueGrid from '@/components/ui/KeyValueGrid';
import SectionCard from '@/components/ui/SectionCard';
import { TransactionType } from '@/types/transaction.schema';
import Link from 'next/link';

type Props = {
  data?: TransactionType;
  isLoading: boolean;
  error: boolean;
  formatAmount: (n?: number) => string;
  formatDate: (s?: string) => string;
};

export default function TransactionDetailView({
  data,
  isLoading,
  error,
  formatAmount,
  formatDate,
}: Props) {
  // 상단 요약 영역 (로딩/에러도 카드 안에서만 표시되도록)
  return (
    <div className='space-y-8'>
      {/* 액션바 */}
      <div className='flex items-center justify-between'>
        <Link
          href='/dashboard/transactions'
          className='text-sm px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700'
        >
          ← 목록으로
        </Link>
        {data && <FraudBadge isFraud={data.isFraud} />}
      </div>

      {/* 로딩/에러 컨테이너 */}
      <div className='rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden min-h-[200px]'>
        {error ? (
          <div className='flex items-center justify-center py-16 text-red-400'>
            데이터를 불러오지 못했습니다.
          </div>
        ) : isLoading && !data ? (
          <div className='flex items-center justify-center py-16 text-slate-400'>
            불러오는 중…
          </div>
        ) : !data ? (
          <div className='flex items-center justify-center py-16 text-slate-400'>
            데이터가 없습니다.
          </div>
        ) : (
          <div className='p-6 space-y-8'>
            {/* 요약 섹션 */}
            <SectionCard title='요약'>
              <KeyValueGrid
                items={[
                  { k: '거래 ID', v: data.id },
                  { k: '사용자 ID', v: data.userId },
                  { k: '가맹점', v: data.merchant },
                  { k: '카테고리', v: data.merchantCategory ?? '-' },
                  { k: '결제 금액', v: formatAmount(data.amount) },
                  { k: '상태', v: data.status },
                  { k: '사기 여부', v: <FraudBadge isFraud={data.isFraud} /> },
                ]}
              />
            </SectionCard>

            {/* 시간 정보 */}
            <SectionCard title='시간 정보'>
              <KeyValueGrid
                items={[
                  { k: '거래 시각', v: formatDate(data.transactionTime) },
                  { k: '가상 시각', v: formatDate(data.virtualTime) },
                  { k: '생성 시각', v: formatDate(data.createdAt) },
                  { k: '업데이트 시각', v: formatDate(data.updatedAt) },
                ]}
              />
            </SectionCard>

            {/* 기술 메타 */}
            <SectionCard title='기술 메타'>
              <KeyValueGrid
                items={[
                  { k: '외부 거래 ID', v: data.externalTransactionId },
                  { k: '장치 지문', v: data.deviceFingerprint },
                  { k: 'IP 주소', v: data.ipAddress },
                  {
                    k: '좌표 (위도,경도)',
                    v: `${data.latitude}, ${data.longitude}`,
                  },
                  {
                    k: 'Gold Label 플래그',
                    v: String(
                      (data as any).hasGoldLabel ??
                        (data as any).hadGoldLabel ??
                        '-'
                    ),
                  },
                ]}
              />
            </SectionCard>

            {/* 익명화 특성 */}
            <SectionCard title='익명화 특성 (anonymizedFeatures)'>
              <JSONBlock
                value={
                  data.anonymizedFeatures === null ||
                  data.anonymizedFeatures === undefined
                    ? null
                    : safeParseJSON(data.anonymizedFeatures)
                }
              />
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}

function safeParseJSON(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    // JSON이 아니면 원문 문자열로 노출
    return s;
  }
}
