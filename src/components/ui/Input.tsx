'use client';

import { FieldValues, Path } from 'react-hook-form';

type InputProp<T extends FieldValues> = {
  /** useForm에서 사용할 이름 */
  name: Path<T>;
  /** useForm에서 사용할 컨트롤러 */
  // control:
  /** tailwind 스타일 */
  size: string;
  /** 플레이스 홀더 */
  placeholder?: string;
  /** input 타입 */
  type?: 'text' | 'password' | 'email';
  /** 비활성화 여부 */
  disabled?: boolean;
  /** input 스타일 지정 */
  inputStyle?: string;
  /** text 스타일 지정 */
  textStyle?: string;
  /** 최대 글자 수 */
  maxLength?: number;
  /** 글자수 카운트 여부 */
  showCharacterCount?: boolean;
  /** 비밀번호 토클 표시 여부 */
  showPasswordToggle?: boolean;
};

export default function Input() {}
