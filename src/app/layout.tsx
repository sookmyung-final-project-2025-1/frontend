import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: '결제지킴이',
  description: '기업을 위한 사기 거래 탐지 시스템',
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ko'>
      <body className='min-h-dvh bg-gradient-to-b from-[#EEF3FF] via-[#F7FAFF] to-white'>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
