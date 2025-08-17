import { EmailVerifiationResponse } from '@/types/auth-response';
import {
  BusinessType,
  ConfirmVerifyEmailType,
  SendVerifyEmailType,
  SignupRequest,
  SignupType,
} from '@/types/signUp.schema';
import { useRouter } from 'next/navigation';
import { useApiMutation } from './useApi';

// 이메일 인증 코드 요청
export const useSendEmailCode = () => {
  return useApiMutation<void, SendVerifyEmailType>({
    method: 'POST',
    endpoint: '/auth/send-verification-code',
    authorization: false,
  });
};

// 이메일 인증 코드 확인
export const useConfirmEmailCode = () => {
  return useApiMutation<EmailVerifiationResponse, ConfirmVerifyEmailType>({
    method: 'POST',
    endpoint: '/auth/verify-email',
    authorization: false,
    onSuccess: () => {
      alert('인증코드가 확인되었습니다.');
    },
    onError: () => {
      alert('인증번호가 올바르지 않습니다.');
    },
  });
};

// 회원가입
export const useSignup = () => {
  const router = useRouter();

  const joinBusinessNumber = (businessNumber: BusinessType) => {
    const p1 = businessNumber.part1;
    const p2 = businessNumber.part2;
    const p3 = businessNumber.part3;

    return `${p1}-${p2}-${p3}`;
  };

  return useApiMutation<void, SignupType>({
    method: 'POST',
    endpoint: '/auth/signup',
    authorization: false,
    body: (form) => {
      const { businessNumber, ...rest } = form;
      const payload: SignupRequest = {
        ...rest,
        businessNumber: joinBusinessNumber(businessNumber),
      };
      return payload;
    },
    onSuccess: () => {
      router.replace('/signin');
    },
    onError: (err) => {
      if (process.env.NODE_ENV === 'development') console.log(err);
    },
  });
};
