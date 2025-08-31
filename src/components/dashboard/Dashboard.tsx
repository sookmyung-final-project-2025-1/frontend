const COMMONSTYLE =
  'bg-[#ffffff] rounded-[10px] py-[20px] px-[30px] flex justify-between';
const FONTSTYLE =
  'font-bold text-[30px] w-fit text-center flex items-center pr-[10px]';

export default function Dashboard() {
  return (
    <div className='grid grid-cols-4 grid-rows-1 gap-9 min-h-[110px]'>
      <div className={COMMONSTYLE}>
        <p className='text-gray-70'>총 거래수</p>
        <p className={`${FONTSTYLE}`}>12,340</p>
      </div>
      <div className={COMMONSTYLE}>
        <p className='text-gray-70'>의심 거래 비율</p>
        <p className={`${FONTSTYLE} text-red`}>8.2%</p>
      </div>
      <div className={COMMONSTYLE}>
        <p className='text-gray-70'>확정 사기 건수</p>
        <p className={`${FONTSTYLE} text-red`}>54</p>
      </div>
      <div className={COMMONSTYLE}>
        <p></p>
      </div>
    </div>
  );
}
