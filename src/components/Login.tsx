'use client';

import { useLogin } from '@/hooks/queries/useLoginApi';
import { LoginType } from '@/types/signin.schema';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import Input from './ui/Input';

export default function Login() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFilled, setIsFilled] = useState(false);

  const { mutate: requestLogin, isPending } = useLogin();

  const methods = useForm<LoginType>({
    mode: 'onSubmit',
    defaultValues: { email: '', password: '' },
  });

  const { watch, control, handleSubmit } = methods;

  const userEmail = watch('email');
  const userPw = watch('password');

  useEffect(() => {
    setIsFilled(!!userEmail && !!userPw);
  }, [userEmail, userPw]);

  const onSubmit = (data: LoginType) => {
    if (isPending) return; // 중복 제출 방지
    requestLogin(data);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} aria-busy={isPending}>
        <div className='flex flex-col gap-[40px]'>
          <div className='w-[395px] flex flex-col gap-[10px]'>
            <Input<LoginType>
              name='email'
              control={control}
              placeholder='이메일'
              type='email'
            />
            <Input<LoginType>
              name='password'
              control={control}
              placeholder='비밀번호'
              type={isOpen ? 'text' : 'password'}
              rightIcon={
                <button
                  type='button'
                  onClick={() => setIsOpen((prev) => !prev)}
                  aria-label={isOpen ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  <Image
                    src={`/assets/icons/${isOpen ? 'openedEye' : 'hiddenEye'}.png`}
                    width={24}
                    height={24}
                    alt=''
                  />
                </button>
              }
            />
          </div>

          <button
            type='submit'
            disabled={!isFilled || isPending}
            className={`w-full h-[50px] rounded-[10px] font-semibold text-[#ffffff]
              flex items-center justify-center gap-2
              ${isPending ? 'bg-slate-500' : isFilled ? 'bg-blue-50' : 'bg-[#E5E5E5]'}
            `}
          >
            {isPending && (
              <svg
                className='animate-spin h-5 w-5'
                viewBox='0 0 24 24'
                aria-hidden='true'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                  fill='none'
                />
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z'
                />
              </svg>
            )}
            <span>{isPending ? '로그인 중…' : '로그인'}</span>
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
