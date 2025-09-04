'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import Input from './ui/Input';

type LoginForm = {
  email: string;
  password: string;
};

export default function Login() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isFilled, setIsFilled] = useState<boolean>(false);

  const methods = useForm<LoginForm>({
    mode: 'onSubmit',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { watch, control, handleSubmit } = methods;

  const userEmail = watch('email');
  const userPw = watch('password');

  useEffect(() => {
    setIsFilled(!!userEmail && !!userPw);
  }, [userEmail, userPw]);

  const onSubmit = (data: LoginForm) => {
    alert(`입력 데이터: ${data}`);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className='flex flex-col gap-[40px]'>
          <div className='w-[395px] flex flex-col gap-[10px]'>
            <Input<LoginForm>
              name='email'
              control={control}
              placeholder='이메일'
              type='email'
            />
            <Input<LoginForm>
              name='password'
              control={control}
              placeholder='비밀번호'
              type={isOpen ? 'text' : 'password'}
              rightIcon={
                <button
                  type='button'
                  onClick={() => setIsOpen((prev) => !prev)}
                >
                  <Image
                    src={`/assets/icons/${isOpen ? 'openedEye' : 'hiddenEye'}.png`}
                    width={24}
                    height={24}
                    alt='비밀번호 보기'
                  />
                </button>
              }
            />
          </div>
          <button
            disabled={!isFilled}
            className={`w-full h-[50px] text-[#ffffff] font-semibold rounded-[10px] ${isFilled ? 'bg-blue-50' : 'bg-[#E5E5E5]'}`}
          >
            로그인
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
