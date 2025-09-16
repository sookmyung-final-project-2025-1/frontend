import { ApiError, fetcher } from '@/api/fetcher';
import { SendVerifyEmailSchema } from '@/types/signUp.schema';
import { useQueryClient } from '@tanstack/react-query';
import { useSendEmailCode } from './queries/useSignupApi';
import { QUERY_KEYS } from './queryKeys';

export const useConfirmEmail = () => {
  const queryClient = useQueryClient();
  const sendCode = useSendEmailCode();

  const run = async (email: string) => {
    SendVerifyEmailSchema.parse({ email });

    await queryClient
      .fetchQuery({
        queryKey: QUERY_KEYS.emailCheck(email),
        queryFn: () =>
          fetcher<void>({
            method: 'GET',
            endpoint: `/api/auth/check-email?email=${encodeURIComponent(email)}`,
            authorization: false,
          }),
        staleTime: 0,
        retry: false,
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 409) {
          throw new Error('이미 사용 중인 이메일입니다.');
        }
        throw e;
      });

    const res = await sendCode.mutateAsync({ email });

    return res;
  };

  return { run, isSending: sendCode.isPending };
};
