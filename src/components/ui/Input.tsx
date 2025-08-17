'use client';

import { ReactNode } from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

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
  hideErrorMessage?: boolean;
  showMaxLength?: boolean;
  maxLength?: number;
};

const INPUTSTYLE =
  'h-[50px] border rounded-[10px] px-[15px] py-[5px] outline-none placeholder:text-[#BDBEBE]';
const ERROR_BORDER = 'border-red focus:border-red';
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
  hideErrorMessage = false,
  showMaxLength,
  maxLength,
}: InputProps<T>) {
  return (
    <>
      <div className='relative'>
        <Controller
          name={name}
          control={control}
          render={({ field, fieldState }) => {
            const value =
              typeof field.value === 'string'
                ? field.value
                : String(field.value ?? '');
            const length = value.length;

            return (
              <div>
                <input
                  {...field}
                  name={name}
                  type={type}
                  disabled={disabled}
                  placeholder={placeholder}
                  maxLength={maxLength}
                  className={`
                ${size ? size : 'w-full'}
                ${INPUTSTYLE}
                ${fieldState.error ? ERROR_BORDER : DEFAULT_BORDER}
                ${rightIcon ? 'pr-[40px]' : ''}
                ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
                ${className}
              `}
                />
                {showMaxLength && maxLength && (
                  <div className='absolute right-[55px] top-[12.5px] font-semibold text-[17px]'>
                    <span className='text-gray-90'>{length}</span>
                    <span className='text-gray-50'> / 20</span>
                  </div>
                )}
                {fieldState.error?.message && !hideErrorMessage && (
                  <div className='ml-[5px] mt-[5px] text-red text-[12px]'>
                    {fieldState.error.message}
                  </div>
                )}
              </div>
            );
          }}
        />
        {rightIcon && (
          <div className='absolute right-[20px] top-[28px] -translate-y-1/2 z-10'>
            {rightIcon}
          </div>
        )}
      </div>
    </>
  );
}
