import Image from 'next/image';
import '../globals.css';

export default function LogoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <body className='w-[80vw] mx-auto relative bg-[#F2F4F8]'>
      <header className='absolute top-[30px] inset-x-0 w-[80vw] mx-auto'>
        <div className='flex justify-between items-center'>
          <Image
            src='/assets/images/LOGO.png'
            alt='로고 이미지'
            width={120}
            height={48}
          />
          <div></div>
        </div>
      </header>
      <main className='pt-[100px] flex justify-center items-center'>
        {children}
      </main>
    </body>
  );
}
