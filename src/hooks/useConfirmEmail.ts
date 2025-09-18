import { fetcher } from '@/api/fetcher';
import { SendVerifyEmailSchema } from '@/types/signup.schema';
import { useQueryClient } from '@tanstack/react-query';
import { useSendEmailCode } from './queries/useSignupApi';
import { QUERY_KEYS } from './queryKeys';

type checkEmailResType = {
  exists: boolean;
  message: string;
};

export const useConfirmEmail = () => {
  const queryClient = useQueryClient();
  const sendCode = useSendEmailCode();

  const run = async (email: string) => {
    SendVerifyEmailSchema.parse({ email });

    const checkEmailRes = await queryClient.fetchQuery({
      queryKey: QUERY_KEYS.emailCheck(email),
      queryFn: () =>
        fetcher<checkEmailResType>({
          method: 'GET',
          endpoint: `/proxy/auth/check-email?email=${encodeURIComponent(email)}`,
          authorization: false,
        }),
      staleTime: 0,
      retry: false,
    });

    if (checkEmailRes?.exists) {
      throw new Error(checkEmailRes.message);
    }

    const res = await sendCode.mutateAsync({ email });

    return res;
  };

  return { run, isSending: sendCode.isPending };
};
