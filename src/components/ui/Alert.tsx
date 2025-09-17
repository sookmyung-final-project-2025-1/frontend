'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

type AlertProps = {
  isAlert: boolean;
  setAlert: React.Dispatch<React.SetStateAction<boolean>>;
  alertData?: string;
  id?: number | string;
};

export default function Alert({
  isAlert,
  setAlert,
  alertData,
  id,
}: AlertProps) {
  return (
    <Link href={`/report/${id}`} onClick={() => setAlert(false)}>
      <AnimatePresence initial={false}>
        {isAlert && (
          <motion.div
            key='alert'
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.55 }}
            className='fixed top-[20px] right-[20px] z-50 w-[400px] h-[110px] px-[20px] pr-[20px] rounded-[10px] text-[#ffffff] shadow-[5px_8px_15.5px_rgba(1,1,1,1)] flex gap-[15px] justify-center items-center'
            style={{ backgroundColor: '#EA3123' }}
            role='alert'
          >
            <div className='w-[80px] h-[80px]'>
              <Image
                src={'/assets/icons/alert.png'}
                width={80}
                height={80}
                alt='경고 아이콘'
                className='h-full w-full object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)]'
              />
            </div>

            <div className='flex flex-col justify-center gap-[8px]'>
              <p className='text-[28px] font-semibold [text-shadow:_4px_5px_12px_rgba(0,0,0,0.45)]'>
                의심거래 발생
              </p>
              <p className='text-[15px] text-white-70 tracking-[-0.06em] text-center leading-tight'>
                사기 거래로 의심되는 거래 내역이 발생했습니다.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );
}
