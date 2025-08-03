'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

const INPUTSTYLE =
  'w-full h-[50px] border border-[#BDBEBE] rounded-[10px] px-[15px] py-[5px] placeholder:text-[#BDBEBE] outline-none focus:border-blue-50';

export default function Login() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isFilled, setIsFilled] = useState<boolean>(false);

  const methods = useForm({
    mode: 'onSubmit',
  });

  const { watch, register } = methods;

  const userEmail = watch('email');
  const userPw = watch('password');

  useEffect(() => {
    setIsFilled(!!userEmail && !!userPw);
  }, [userEmail, userPw]);

  return (
    <FormProvider {...methods}>
      <form>
        <div className='flex flex-col gap-[40px]'>
          <div className='w-[395px] flex flex-col gap-[10px]'>
            <input
              {...register('email')}
              className={INPUTSTYLE}
              placeholder='이메일'
              type='email'
            />
            <div className='relative'>
              <input
                {...register('password')}
                className={`${INPUTSTYLE} pr-[40px]`}
                placeholder='비밀번호'
                type={isOpen ? 'text' : 'password'}
              />
              <button onClick={() => setIsOpen((prev) => !prev)} type='button'>
                <Image
                  src={`/assets/icons/${isOpen ? 'openedEye' : 'hiddenEye'}.png`}
                  width={24}
                  height={24}
                  alt='눈 아이콘'
                  className='absolute right-[10px] top-1/2 -translate-y-1/2 z-10'
                />
              </button>
            </div>
          </div>
          <button
            className={`w-full h-[50px] text-[#ffffff] font-semibold rounded-[10px] ${isFilled ? 'bg-blue-50' : 'bg-[#E5E5E5]'}`}
            type={isFilled ? 'button' : 'submit'}
          >
            로그인
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
