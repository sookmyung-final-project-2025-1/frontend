'use client';

import EmailConfirmInput from '@/components/signup/EmailConfirmInput';
import Input from '@/components/ui/Input';
import { useSignup } from '@/hooks/queries/useSignupApi';
import { useConfirmBusiness } from '@/hooks/useConfirmBusiness';
import { useConfirmEmail } from '@/hooks/useConfirmEmail';
import { INDUSTRIES, SignupSchema, SignupType } from '@/types/signUp.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

type InputFieldProps = {
  title: string;
  name: keyof SignupType;
};

export type Industry = (typeof INDUSTRIES)[number];

export default function SignUp() {
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [isPasswordConfirmVisible, setIsPasswordConfirmVisible] =
    useState(false);
  const [openConfirm, setOpenConfirm] = useState<boolean>(false);
  const [confirmEmailStr, setConfirmEmailStr] = useState<string>('');

  const methods = useForm<SignupType>({
    resolver: zodResolver(SignupSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      passwordConfirm: '',
      managerName: '',
      industry: 'BANK',
      businessNumber: {
        part1: '',
        part2: '',
        part3: '',
      },
    },
    shouldFocusError: true,
  });

  const { control, handleSubmit, getValues } = methods;

  const signUp = useSignup();
  const { run: confirmEmail } = useConfirmEmail();
  const { run: checkBusiness } = useConfirmBusiness();

  const onSubmit = async (data: SignupType) => {
    const { part1, part2, part3 } = data.businessNumber;
    const bn = `${part1}-${part2}-${part3}`;

    try {
      const ok = await checkBusiness(bn);
      if (!ok) {
        alert('이미 등록된 사업자 등록 번호입니다.');
        return;
      }
      signUp.mutate(data);
    } catch (e) {
      alert('사업자번호 확인 중 오류가 발생했습니다.');
    }
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

    const setMaxLength = inputType === 'password' ? 20 : undefined;

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
            <span className='text-[11px] font-medium text-gray-50 leading-[12px]'>
              대소문자/숫자/특수문자 포함 8자 이상
            </span>
          )}
        </div>
        <div className='flex-1'>
          <Input<SignupType>
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
            showMaxLength={inputType === 'password'}
            maxLength={setMaxLength}
            disabled={name === 'email' ? openConfirm : undefined}
          />
        </div>
        {name === 'email' && (
          <button
            className='w-[125px] h-[50px] text-[#ffffff] bg-blue-50 font-semibold rounded-[10px]'
            type='button'
            onClick={async () => {
              try {
                setConfirmEmailStr(getValues('email'));
                await confirmEmail(confirmEmailStr);
                alert('인증코드를 전송했어요');
                setOpenConfirm(true);
              } catch {
                alert('이메일 인증 요청 실패');
              }
            }}
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

    if (name === 'businessNumber') {
      return (
        <div className={commonStyle}>
          <span className={commonTextStyle}>{title}</span>
          <div className='flex gap-[10px] items-center'>
            <Input<SignupType>
              name='businessNumber.part1'
              control={control}
              type='text'
              size='w-[110px]'
              hideErrorMessage={true}
            />
            <hr className='w-[20px] h-[3px] bg-[#BDBEBE] rounded-[10px]'></hr>
            <Input<SignupType>
              name='businessNumber.part2'
              control={control}
              type='text'
              size='w-[105px]'
              hideErrorMessage={true}
            />
            <hr className='w-[20px] h-[3px] bg-[#BDBEBE] rounded-[10px]'></hr>
            <Input<SignupType>
              name='businessNumber.part3'
              control={control}
              type='text'
              size='w-[160px]'
              hideErrorMessage={true}
            />
          </div>
        </div>
      );
    } else {
      return (
        <div className={commonStyle}>
          <span className={commonTextStyle}>{title}</span>
          <Input<SignupType> name={name} control={control} type='text' />
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
                {renderUserInputField({ title: '이름', name: 'name' })}
                <div className='flex flex-col gap-[10px] w-fulls'>
                  {renderUserInputField({ title: '이메일', name: 'email' })}
                  <div className='w-[320px] ml-[140px]'>
                    {openConfirm && (
                      <EmailConfirmInput email={confirmEmailStr} />
                    )}
                  </div>
                </div>
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
                        name: 'managerName',
                      })}
                    </div>
                    <div className='w-[260px]'>
                      {renderCompanyInput({
                        title: '업종',
                        name: 'industry',
                      })}
                    </div>
                  </div>
                  <div>
                    {renderCompanyInput({
                      title: '사업자 등록번호',
                      name: 'businessNumber',
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
