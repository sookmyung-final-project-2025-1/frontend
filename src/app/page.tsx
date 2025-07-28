'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const goToTestPage = () => {
    router.push('/test');
  };

  return (
    <div className='flex flex-col justify-center items-center gap-[80px] w-full'>
      <div className='felx flex-col gap-[20px]'>
        <div className='h-[100px] mt-[80px] flex flex-col gap-[20px] justify-center items-center text-white-50'>
          <div className='text-headline1 font-bold'>
            사기 거래 탐지를 쉽고 빠르게
          </div>
          <div className='text-subtitle font-normal'>
            지금 바로 테스트 해보세요!
          </div>
        </div>
      </div>
      <button
        className='w-[311px] h-[70px] flex bg-white-50 rounded-[50px] items-center justify-between px-[10px]'
        onClick={goToTestPage}
      >
        <div className='text-headline3 font-bold ml-[18%]'>바로 시작하기</div>
        <Image
          src={'/assets/icons/startBtn.png'}
          alt='시작하기 아이콘'
          width={50}
          height={50}
        />
      </button>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        viewport={{ once: true, amount: 0.2 }}
        className='bg-white-70 rounded-t-[50px] w-full h-[900px] px-[40px] py-[60px] flex flex-col items-center'
      >
        <div className='text-headline2 font-bold text-center'>
          거래 데이터를 분석하고 <br /> 그 결과를 대시보드 형태로 제공해요
        </div>
      </motion.div>
    </div>
  );
}
