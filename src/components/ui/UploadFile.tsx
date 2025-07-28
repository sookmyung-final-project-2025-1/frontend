'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

const BUTTONSTYLE =
  'bg-blue-50 text-white-50 text-subtitle2 font-semibold w-[300px] h-[60px] text-center rounded-[20px]';

export default function UploadFile() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDelete = () => setFile(null);

  const handleChange = () => {
    const uploadedFile = fileInputRef.current?.files?.[0];
    if (uploadedFile) setFile(uploadedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      e.dataTransfer.clearData();
    }
  };

  return (
    <div
      className={`w-[60%] h-[70%] rounded-[50px] flex flex-col justify-evenly items-center shadow-custom-black transition border-2 border-dashed ${
        isDragging
          ? 'border-blue-50 bg-blue-30/20'
          : 'border-gray-50 bg-blue-10'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={handleDrop}
    >
      <Image
        src='/assets/icons/Folder plus.png'
        alt='파일 아이콘'
        width={70}
        height={70}
      />

      {file ? (
        <div className='bg-blue-50 px-[20px] py-[20px] w-[90%] rounded-[40px] flex justify-between items-center'>
          <div className='flex items-center gap-[20px] px-[40px] flex-1 min-w-0'>
            <div className='text-headline3 text-white-50 font-semibold truncate min-w-0'>
              {file.name}
            </div>
            <div className='text-headline3 text-gray-50 whitespace-nowrap'>
              {(file.size / (1024 * 1024)).toFixed(2)}MB
            </div>
          </div>
          <button onClick={handleDelete}>
            <Image
              src='/assets/icons/delete.png'
              alt='삭제 아이콘'
              width={50}
              height={50}
            />
          </button>
        </div>
      ) : (
        <div className='text-subtitle text-gray-30 text-center'>
          파일을 마우스로 끌어오거나
          <br />
          업로드 해주세요
        </div>
      )}

      {file ? (
        <button className={BUTTONSTYLE}>업로드</button>
      ) : (
        <button
          className={BUTTONSTYLE}
          onClick={() => fileInputRef.current?.click()}
        >
          파일 찾기
        </button>
      )}
      <input
        ref={fileInputRef}
        type='file'
        name='testFile'
        className='hidden'
        onChange={handleChange}
      />
    </div>
  );
}
