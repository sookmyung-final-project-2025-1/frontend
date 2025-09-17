import { EmailVerifiationResponse } from '@/types/auth-response';

import {
  ConfirmVerifyEmailType,
  EmailVerificationResponseSchema,
  SendVerifyEmailType,
  SignupRequest,
  SignupResponse,
} from '@/types/signup.schema';
import { useRouter } from 'next/navigation';
import { useApiMutation } from './useApi';

// 이메일 인증 코드 요청
export const useSendEmailCode = () => {
  return useApiMutation<EmailVerifiationResponse, SendVerifyEmailType>({
    method: 'POST',
    endpoint: '/proxy/auth/send-verification-code',
    authorization: false,
    responseSchema: EmailVerificationResponseSchema,
  });
};

// 이메일 인증 코드 확인
export const useConfirmEmailCode = ({
  onSuccess,
}: {
  onSuccess: () => void;
}) => {
  return useApiMutation<EmailVerifiationResponse, ConfirmVerifyEmailType>({
    method: 'POST',
    endpoint: '/proxy/auth/verify-email',
    authorization: false,
    onSuccess: () => {
      onSuccess();
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

  return useApiMutation<SignupResponse, SignupRequest>({
    method: 'POST',
    endpoint: '/proxy/auth/signup',
    authorization: false,
    onSuccess: () => {
      alert('회원가입이 완료되었습니다.');
      router.replace('/signin');
    },
    onError: (err) => {
      if (process.env.NODE_ENV === 'development') console.log(err);
    },
  });
};
