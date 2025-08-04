'use client';

import { ReactNode } from 'react';
import {
  Control,
  Controller,
  FieldError,
  FieldValues,
  Path,
} from 'react-hook-form';

type InputProps<T extends FieldValues> = {
  /** form 필드의 key 이름 */
  name: Path<T>;
  /** control 객체 -> Controller 연결 */
  control: Control<T>;
  size?: string;
  placeholder?: string;
  type?: string;
  rightIcon?: ReactNode;
  className?: string;
  disabled?: boolean;
  error?: FieldError;
};

const INPUTSTYLE =
  'h-[50px] border rounded-[10px] px-[15px] py-[5px] placeholder:text-[#BDBEBE] outline-none transition-all';
const ERROR_BORDER = 'border-red-500';
const DEFAULT_BORDER = 'border-[#E5E5E5] focus:border-blue-50';

export default function Input<T extends FieldValues>({
  name,
  control,
  size,
  placeholder,
  type = 'text',
  rightIcon,
  className = '',
  disabled = false,
  error,
}: InputProps<T>) {
  return (
    <>
      <div className='relative'>
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <input
              {...field}
              name={name}
              type={type}
              disabled={disabled}
              placeholder={placeholder}
              className={`
                ${size ? size : 'w-full'}
                ${INPUTSTYLE}
                ${error ? ERROR_BORDER : DEFAULT_BORDER}
                ${rightIcon ? 'pr-[40px]' : ''}
                ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
                ${className}
              `}
            />
          )}
        />
        {rightIcon && (
          <div className='absolute right-[20px] top-[28px] -translate-y-1/2 z-10'>
            {rightIcon}
          </div>
        )}
      </div>
      {error?.message && (
        <span className='text-sm text-red-500'>{error.message}</span>
      )}
    </>
  );
}
