import '../globals.css';

export default function SignInLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='w-[100vw] h-[100vh] flex justify-center items-center'>
      {children}
    </div>
  );
}
