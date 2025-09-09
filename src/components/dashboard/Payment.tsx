import { riskColor } from '@/lib/colorChanger';

const MOCK = {
  data: [
    {
      time: '11:05',
      cardNum: '1234-1234',
      transactionAmt: 120000,
      fraudProbability: 0.0082,
    },
    {
      time: '11:30',
      cardNum: '1234-5678',
      transactionAmt: 850000,
      fraudProbability: 0.8782,
    },
    {
      time: '14:18',
      cardNum: '1234-1451',
      transactionAmt: 1320000,
      fraudProbability: 0.6502,
    },
    {
      time: '15:36',
      cardNum: '1234-5847',
      transactionAmt: 451000,
      fraudProbability: 0.0072,
    },
    {
      time: '18:05',
      cardNum: '1234-1357',
      transactionAmt: 30000,
      fraudProbability: 0.0002,
    },
  ],
};

const LABEL = ['시간', '카드번호', '금액', '사기 확률'];

export default function Payment() {
  return (
    <div className='bg-[#ffffff] rounded-[10px] py-[20px] px-[30px] flex flex-col gap-[15px]  border border-black/5 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md transition'>
      <p className='text-[20px]'>거래 리스트</p>

      <div className='flex flex-col gap-[10px] pl-[20px] text-[18px]'>
        <div className='grid grid-rows-1 grid-cols-4 gap-auto w-full ml-[20px]'>
          {LABEL.map((label) => (
            <p key={label}>{label}</p>
          ))}
        </div>
        <div className='h-px w-full bg-[#0E2975]/10' />
        {MOCK.data.map((pay, index) => {
          const { time, cardNum, transactionAmt, fraudProbability } = pay;
          const number = cardNum.split('-')[1];
          const cost = new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW',
            maximumFractionDigits: 0,
          }).format(transactionAmt);
          const probability = (fraudProbability * 100).toFixed(2);

          const level = riskColor(fraudProbability);

          return (
            <div
              key={index}
              className='grid grid-rows-1 grid-cols-4 gap-auto w-full ml-[20px]'
            >
              <p>{time}</p>
              <p>****-{number}</p>
              <p>{cost}</p>
              <p className={level}>{probability}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
