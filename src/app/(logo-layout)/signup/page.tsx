import UploadFile from '@/components/ui/UploadFile';
import Image from 'next/image';

export default function SignUp() {
  return (
    <div className='relative bg-white-50 rounded-[30px] w-full h-[80vh] px-[5%] py-[3%] flex flex-col'>
      <div className='flex flex-col gap-[5px]'>
        <div className='flex gap-[20px] text-headline1 font-bold items-center'>
          <Image
            src={'/assets/icons/Upload cloud.png'}
            alt='업로드 구름 아이콘'
            width={45}
            height={45}
            className='w-[45px] h-[45px]'
          />
          <div>테스트 거래 데이터를 업로드 해주세요</div>
        </div>
        <div className='text-subtitle text-gray-70'>
          LOGO에서 거래 안전성을 파악해 진단 결과를 빠르게 알려드릴게요
        </div>
      </div>

      <div className='flex-1 flex justify-center items-center'>
        <UploadFile />
      </div>
    </div>
  );
}
