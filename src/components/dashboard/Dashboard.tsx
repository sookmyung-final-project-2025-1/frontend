const COMMONSTYLE =
  'bg-[#ffffff] rounded-[10px] py-[20px] px-[30px] flex justify-between shadow-[2px_4px_12.5px_rgba(0,0,0,0.25)] border border-black/5 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md transition';
const FONTSTYLE =
  'font-bold text-[35px] w-fit text-center flex items-center pr-[10px] [text-shadow:_1px_2px_5px_rgba(0,0,0,0.25)]';

export default function Dashboard() {
  return (
    <div className='grid grid-cols-4 grid-rows-1 gap-9 min-h-[110px]'>
      <div className={COMMONSTYLE}>
        <p className='text-gray-70 text-[20px]'>총 거래수</p>
        <p className={`${FONTSTYLE}`}>12,340</p>
      </div>
      <div className={COMMONSTYLE}>
        <p className='text-gray-70 text-[20px]'>의심 거래 비율</p>
        <p className={`${FONTSTYLE} text-red`}>8.2%</p>
      </div>
      <div className={COMMONSTYLE}>
        <p className='text-gray-70 text-[20px]'>확정 사기 건수</p>
        <p className={`${FONTSTYLE} text-red`}>54</p>
      </div>
      <div className={COMMONSTYLE}>
        <p></p>
      </div>
    </div>
  );
}
