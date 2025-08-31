'use client';

import { SignupType } from '@/types/signup.schema';
import { Control, Controller } from 'react-hook-form';
import Input from '../ui/Input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select';

type InputFieldProps = {
  title: string;
  name: keyof SignupType;
  control: Control<SignupType>;
};

const commonStyle = 'w-full flex justify-between';
const commonTextStyle = 'text-gray-90 font-semibold';
const commonSelectStyle = 'h-[50px] text-[15px]';

export const RenderCompanyInput = ({
  title,
  name,
  control,
}: InputFieldProps) => {
  if (name === 'businessNumber') {
    return (
      <div className={commonStyle}>
        <span className={commonTextStyle}>{title}</span>
        <div className='flex gap-[10px] items-center'>
          <Input<SignupType>
            name='businessNumber.part1'
            control={control}
            type='text'
            size='w-[110px]'
            hideErrorMessage={true}
          />
          <hr className='w-[20px] h-[3px] bg-[#BDBEBE] rounded-[10px]'></hr>
          <Input<SignupType>
            name='businessNumber.part2'
            control={control}
            type='text'
            size='w-[105px]'
            hideErrorMessage={true}
          />
          <hr className='w-[20px] h-[3px] bg-[#BDBEBE] rounded-[10px]'></hr>
          <Input<SignupType>
            name='businessNumber.part3'
            control={control}
            type='text'
            size='w-[160px]'
            hideErrorMessage={true}
          />
        </div>
      </div>
    );
  } else if (name === 'industry') {
    return (
      <div className={commonStyle}>
        <span className={commonTextStyle}>{title}</span>
        <Controller
          name='industry'
          rules={{ required: '업종을 선택해주세요.' }}
          render={({ field, fieldState }) => (
            <div>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className='w-[180px] h-[50px] outline-none text-[15px]'>
                  <SelectValue placeholder='업종을 선택하세요.' />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value='PG' className={commonSelectStyle}>
                      PG사
                    </SelectItem>
                    <SelectItem value='BANK' className={commonSelectStyle}>
                      은행
                    </SelectItem>
                    <SelectItem value='CARD' className={commonSelectStyle}>
                      카드사
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              {fieldState.error && (
                <p className='mt-1 text-red text-xs'>
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />
      </div>
    );
  } else {
    return (
      <div className={commonStyle}>
        <span className={commonTextStyle}>{title}</span>
        <Input<SignupType> name={name} control={control} type='text' />
      </div>
    );
  }
};
