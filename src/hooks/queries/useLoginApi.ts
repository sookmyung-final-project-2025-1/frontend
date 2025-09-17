import { tokenStore } from '@/api/fetcher';
import { LoginResponseType, LoginType } from '@/types/signin.schema';
import { useRouter } from 'next/navigation';
import { useApiMutation } from './useApi';

export const useLogin = () => {
  const router = useRouter();

  return useApiMutation<LoginResponseType, LoginType>({
    method: 'POST',
    endpoint: '/proxy/auth/login',
    authorization: false,
    onSuccess: (res) => {
      if (res?.accessToken) {
        tokenStore.set(res?.accessToken);
        router.replace('/');
      } else {
        alert('로그인 실패');
      }
    },
    onError: (err) => {
      if (err.status === 400) alert('아이디/비밀번호를 다시 확인해주세요.');
    },
  });
};
