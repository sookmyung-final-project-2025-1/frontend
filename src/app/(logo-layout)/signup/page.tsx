'use client';

import Input from '@/components/ui/Input';
import Image from 'next/image';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

type InputFieldProps = {
  title: string;
  name: keyof SignUpForm;
};

type RegisterType = {
  part1: string;
  part2: string;
  part3: string;
};

type SignUpForm = {
  userName: string;
  email: string;
  password: string;
  passwordConfirm: string;
  companyName: string;
  businessType: string;
  registerNumber: RegisterType;
};

export default function SignUp() {
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [isPasswordConfirmVisible, setIsPasswordConfirmVisible] =
    useState(false);

  const methods = useForm<SignUpForm>({
    mode: 'onSubmit',
    defaultValues: {
      userName: '',
      email: '',
      password: '',
      passwordConfirm: '',
      companyName: '',
      businessType: '',
      registerNumber: {
        part1: '',
        part2: '',
        part3: '',
      },
    },
  });

  const { watch, control, handleSubmit } = methods;

  const onSubmit = (data: SignUpForm) => {
    const { part1, part2, part3 } = data.registerNumber;
    const fullNumber = `${part1}${part2}${part3}`;
    alert(`사업자등록번호: ${fullNumber}`);
    alert(`회원가입 입력 데이터: ${data}`);
  };

  const renderUserInputField = ({ title, name }: InputFieldProps) => {
    const isPassword = name === 'password';
    const isPasswordConfirm = name === 'passwordConfirm';

    const inputType =
      isPassword || isPasswordConfirm
        ? 'password'
        : title === '이메일'
          ? 'email'
          : 'text';

    const isVisible = isPassword
      ? isPasswordVisible
      : isPasswordConfirm
        ? isPasswordConfirmVisible
        : undefined;

    const toggleVisible = () => {
      if (isPassword) {
        setIsPasswordVisible((prev) => !prev);
      } else if (isPasswordConfirm) {
        setIsPasswordConfirmVisible((prev) => !prev);
      }
    };

    return (
      <div className='w-full flex justify-between gap-[30px]'>
        <div
          className={`w-[110px] text-gray-90 font-semibold ${title === '비밀번호' ? 'flex flex-col' : ''}`}
        >
          <span>{title}</span>
          {title === '비밀번호' && (
            <span className='text-[12px] font-medium text-gray-50'>
              특수문자 포함 8자 이상
            </span>
          )}
        </div>
        <div className='flex-1'>
          <Input<SignUpForm>
            name={name}
            control={control}
            type={isVisible ? 'text' : inputType}
            rightIcon={
              inputType === 'password' ? (
                <button type='button' onClick={toggleVisible}>
                  <Image
                    src={`/assets/icons/${isVisible ? 'openedEye' : 'hiddenEye'}.png`}
                    width={24}
                    height={24}
                    alt='비밀번호 보기'
                  />
                </button>
              ) : (
                ''
              )
            }
          />
        </div>
        {name === 'email' && (
          <button
            className='w-[125px] text-[#ffffff] bg-blue-50 font-semibold rounded-[10px]'
            type='button'
          >
            이메일 인증
          </button>
        )}
      </div>
    );
  };

  const renderCompanyInput = ({ title, name }: InputFieldProps) => {
    const commonStyle = 'w-full flex justify-between';
    const commonTextStyle = 'text-gray-90 font-semibold';

    if (name === 'registerNumber') {
      return (
        <div className={commonStyle}>
          <span className={commonTextStyle}>{title}</span>
          <div className='flex gap-[10px] items-center'>
            <Input<SignUpForm>
              name='registerNumber.part1'
              control={control}
              type='text'
              size='w-[110px]'
            />
            <hr className='w-[20px] h-[3px] bg-[#BDBEBE] rounded-[10px]'></hr>
            <Input<SignUpForm>
              name='registerNumber.part2'
              control={control}
              type='text'
              size='w-[105px]'
            />
            <hr className='w-[20px] h-[3px] bg-[#BDBEBE] rounded-[10px]'></hr>
            <Input<SignUpForm>
              name='registerNumber.part3'
              control={control}
              type='text'
              size='w-[160px]'
            />
          </div>
        </div>
      );
    } else {
      return (
        <div className={commonStyle}>
          <span className={commonTextStyle}>{title}</span>
          <Input<SignUpForm> name={name} control={control} type='text' />
        </div>
      );
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className='w-[720px] flex flex-col gap-[25px]'>
          <div className='text-[30px] font-bold text-blue-50 pl-[10px]'>
            회원가입
          </div>
          <div className='w-full px-[40px] py-[30px] bg-[#ffffff] flex flex-col gap-[35px] rounded-[20px]'>
            <div className='flex flex-col gap-[20px] pr-[10px]'>
              <div className='text-[#191D1D] text-[25px] font-semibold'>
                회원 정보
              </div>
              <div className='flex flex-col gap-[20px] pl-[15px]'>
                {renderUserInputField({ title: '이름', name: 'userName' })}
                {renderUserInputField({ title: '이메일', name: 'email' })}
                {renderUserInputField({ title: '비밀번호', name: 'password' })}
                {renderUserInputField({
                  title: '비밀번호 확인',
                  name: 'passwordConfirm',
                })}
              </div>
            </div>
            <div className='flex flex-col gap-[20px]'>
              <div className='text-[#191D1D] text-[25px] font-semibold'>
                기업 정보
              </div>
              <div className='flex flex-col gap-[20px] pl-[15px]'>
                <div className='w-full flex flex-col gap-[20px]'>
                  <div className='flex justify-between'>
                    <div className='w-[325px]'>
                      {renderCompanyInput({
                        title: '기업명',
                        name: 'companyName',
                      })}
                    </div>
                    <div className='w-[260px]'>
                      {renderCompanyInput({
                        title: '업종',
                        name: 'businessType',
                      })}
                    </div>
                  </div>
                  <div>
                    {renderCompanyInput({
                      title: '사업자 등록번호',
                      name: 'registerNumber',
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button className='w-full bg-blue-50 rounded-[10px] h-[50px] text-[#ffffff] font-semibold'>
            회원가입
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
