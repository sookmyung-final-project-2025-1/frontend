'use client';

import EmailConfirmInput from '@/components/signup/EmailConfirmInput';
import { RenderCompanyInput } from '@/components/signup/RenderCompanyInput';
import Input from '@/components/ui/Input';
import { useSignup } from '@/hooks/queries/useSignupApi';
import { useConfirmBusiness } from '@/hooks/useConfirmBusiness';
import { useConfirmEmail } from '@/hooks/useConfirmEmail';
import {
  INDUSTRIES,
  SendVerifyEmailSchema,
  SignupRequestSchema,
  SignupSchema,
  SignupType,
} from '@/types/signup.schema';

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
  const [confirmEmail, setConfirmEmail] = useState<boolean>(false);

  const methods = useForm<SignupType>({
    resolver: zodResolver(SignupSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      passwordConfirm: '',
      managerName: '',
      industry: undefined,
      businessNumber: {
        part1: '',
        part2: '',
        part3: '',
      },
    },
    shouldFocusError: true,
  });

  const { control, handleSubmit, getValues, trigger, setFocus, setValue } =
    methods;

  const signUp = useSignup();
  const { run: checkEmail } = useConfirmEmail();
  const { run: checkBusiness } = useConfirmBusiness();

  const onSubmit = async (data: SignupType) => {
    const { part1, part2, part3 } = data.businessNumber;
    const bn = `${part1}-${part2}-${part3}`;

    const payload = {
      ...data,
      businessNumber: bn,
    };

    // 사업자 등록번호 중복 확인
    try {
      const ok = await checkBusiness(bn);
      if (!ok) {
        alert('이미 등록된 사업자 등록 번호입니다.');
        return;
      }
      signUp.mutate(SignupRequestSchema.parse(payload));
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
            disabled={name === 'email' ? confirmEmail : undefined}
          />
        </div>
        {name === 'email' && (
          <button
            className={`w-[125px] h-[50px] text-[#ffffff] font-semibold rounded-[10px] ${confirmEmail ? 'bg-gray-50' : 'bg-blue-50'}`}
            type='button'
            onClick={async () => {
              try {
                const ok = await trigger('email');
                if (!ok) {
                  setFocus('email');
                  return;
                }

                const { email } = SendVerifyEmailSchema.parse({
                  email: getValues('email'),
                });
                setOpenConfirm(true);

                const { success, message, expirationSeconds } =
                  await checkEmail(email);

                if (!success) {
                  alert(message || '인증 요청 실패');
                  return;
                }

                setConfirmEmailStr(email);
                alert(
                  `인증코드를 전송했습니다. (유효시간 ${expirationSeconds}초)`
                );
              } catch {
                setOpenConfirm(false);
                alert('이메일 인증 요청에 실패했습니다. 다시 시도해 주세요.');
                setValue('email', '');
                setFocus('email');
              }
            }}
            disabled={confirmEmail ? confirmEmail : undefined}
          >
            {confirmEmail ? '인증 완료' : '이메일 인증'}
          </button>
        )}
      </div>
    );
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
                    {openConfirm && !confirmEmail && (
                      <EmailConfirmInput
                        email={confirmEmailStr}
                        setConfirmEmail={setConfirmEmail}
                        setOpenConfirm={setOpenConfirm}
                      />
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
                      <RenderCompanyInput
                        title='기업명'
                        name='managerName'
                        control={control}
                      />
                    </div>
                    <div className='w-[260px]'>
                      <RenderCompanyInput
                        title='업종'
                        name='industry'
                        control={control}
                      />
                    </div>
                  </div>
                  <div>
                    <RenderCompanyInput
                      title='사업자 등록번호'
                      name='businessNumber'
                      control={control}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button
            className={`w-full rounded-[10px] h-[50px] text-[#ffffff] font-semibold ${confirmEmail ? 'bg-blue-50' : 'bg-gray-50'}`}
            disabled={confirmEmail ? false : true}
          >
            회원가입
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
