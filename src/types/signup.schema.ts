import { z } from 'zod';

// 이메일 인증코드 확인
export const ConfirmVerifyEmailSchema = z.object({
  email: z.email('이메일 형식이 올바르지 않습니다.'),
  code: z
    .string()
    .nonempty({ message: '인증코드를 입력해주세요.' })
    .regex(/^[0-9]{6}$/, { message: '인증코드는 숫자 6자리입니다.' }),
});
export type ConfirmVerifyEmailType = z.infer<typeof ConfirmVerifyEmailSchema>;

// 이메일 인증코드 요청 응답 스키마
export const EmailVerificationResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  expirationSeconds: z.number().int().nonnegative(),
});

// 이메일 인증코드 발송
export const SendVerifyEmailSchema = z.object({
  email: z.email(),
});
export type SendVerifyEmailType = z.infer<typeof SendVerifyEmailSchema>;

// 회원가입
const BNPartsSchema = z.object({
  part1: z.string().regex(/^\d{3}$/),
  part2: z.string().regex(/^\d{2}$/),
  part3: z.string().regex(/^\d{5}$/),
});
export type BusinessType = z.infer<typeof BNPartsSchema>;

const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
export const INDUSTRIES = ['PG', 'BANK', 'CARD'] as const;

export const SignupSchema = z
  .object({
    name: z
      .string()
      .nonempty({ message: '이름을 입력해주세요.' })
      .min(2, { message: '이름은 두 글자 이상으로 작성해주세요.' }),
    businessNumber: BNPartsSchema,
    email: z
      .string()
      .trim()
      .min(1, { message: '이메일을 입력해주세요.' })
      .email({ message: '이메일 형식이 올바르지 않습니다.' }),
    password: z
      .string()
      .min(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
      .max(20, { message: '비밀번호는 20자 이하여야 합니다.' })
      .regex(PASSWORD_PATTERN, {
        message:
          '영문 대문자/소문자, 숫자, 특수문자(@$!%*?&)를 각각 1자 이상 포함해야 합니다.',
      }),
    passwordConfirm: z
      .string()
      .min(1, { message: '비밀번호를 확인해주세요.' })
      .min(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
      .max(20, { message: '비밀번호는 20자 이하여야 합니다.' }),
    managerName: z.string().min(2, { message: '기업명을 입력해주세요.' }),
    industry: z.enum(INDUSTRIES, {
      message: '업종을 선택해주세요.',
    }),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    path: ['passwordConfirm'],
    message: '비밀번호가 일치하지 않습니다.',
  });
export type SignupType = z.infer<typeof SignupSchema>;

export const SignupRequestSchema = SignupSchema.omit({
  businessNumber: true,
  passwordConfirm: true,
}).extend({ businessNumber: z.string().regex(/^\d{3}-\d{2}-\d{5}$/) });
export type SignupRequest = z.infer<typeof SignupRequestSchema>;

export const SignupResponseSchema = z.object({
  accessToken: z.string().min(1),
});
export type SignupResponse = z.infer<typeof SignupResponseSchema>;
