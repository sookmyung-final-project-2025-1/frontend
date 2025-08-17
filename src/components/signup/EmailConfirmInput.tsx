import { useConfirmEmailCode } from '@/hooks/queries/useSignupApi';
import { ConfirmVerifyEmailSchema } from '@/types/signUp.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import z from 'zod';
import Input from '../ui/Input';

type ConfirmProps = {
  email: string;
};

const CodeOnlySchema = ConfirmVerifyEmailSchema.pick({ code: true });
type CodeForm = z.infer<typeof CodeOnlySchema>;

export default function EmailConfirmInput({ email }: ConfirmProps) {
  const { control, handleSubmit } = useForm<CodeForm>({
    resolver: zodResolver(CodeOnlySchema),
    mode: 'onChange',
    defaultValues: { code: '' },
    shouldFocusError: true,
  });

  const confirmCode = useConfirmEmailCode();

  const onSubmit = ({ code }: CodeForm) => {
    confirmCode.mutate({ email, code });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className='flex items-start gap-[15px] justify-center'>
        <div className='flex-1'>
          <Input<CodeForm>
            name='code'
            control={control}
            placeholder='인증번호 6자리'
            type='text'
            showMaxLength={false}
            maxLength={6}
          />
        </div>

        <button
          type='submit'
          className='w-[70px] h-[50px] text-[#ffffff] bg-blue-50 font-semibold rounded-[10px] disabled:bg-gray-30'
          disabled={confirmCode.isPending}
        >
          확인
        </button>
      </div>
    </form>
  );
}
