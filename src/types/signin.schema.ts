import { z } from 'zod';

export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, { message: '이메일을 입력해주세요.' })
    .email({ message: '이메일 형식이 올바르지 않습니다.' }),
  password: z.string().min(1, { message: '비밀번호를 입력해주세요.' }),
});

export type LoginType = z.infer<typeof LoginSchema>;

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
});

export type LoginResponseType = z.infer<typeof LoginResponseSchema>;
