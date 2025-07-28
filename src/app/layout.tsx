import Image from 'next/image';
import './globals.css';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ko'>
      <body className='w-[80vw] mx-auto relative'>
        <header className='absolute top-[30px] inset-x-0 w-[80vw] mx-auto'>
          <div className='flex justify-between items-center'>
            <Image
              src='/assets/image/LOGO.png'
              alt='로고 이미지'
              width={120}
              height={50}
            />
            <button>
              <Image
                src='/assets/icons/menu.png'
                alt='메뉴 아이콘'
                width={40}
                height={40}
              />
            </button>
          </div>
        </header>
        <main className='pt-[100px]'>{children}</main>
      </body>
    </html>
  );
}
