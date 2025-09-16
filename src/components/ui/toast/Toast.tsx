import Image from 'next/image';

type ToastProps = {
  message: string;
  type: 'error' | 'success';
};

export default function Toast({ message, type }: ToastProps) {
  const backgroundStyle = type === 'error' ? 'bg-red-20' : 'bg-[#05B63B]';
  const iconSrc =
    type === 'error' ? '/assets/icons/error.png' : '/assets/icons/success.png';

  return (
    <div
      className={`absolute top-1/4 left-1/2 w-[200px] h-[70px] flex justify-between pl-[20px] pr-[20px] rounded-[10px] ${backgroundStyle}`}
    >
      <Image src={iconSrc} alt={`${type} icon`} width={24} height={24} />
      <span className='text-white-50 font-semibold'>{message}</span>
    </div>
  );
}
