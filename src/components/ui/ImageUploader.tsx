'use client';

import { FaCloudUploadAlt, FaImage, FaTimesCircle } from '@/components/icons';
import { cn } from '@/utils/style';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ChangeEvent, useRef, useState } from 'react';

interface ImageUploaderProps {
  onImageSelect: (imageUrl: string) => void;
  className?: string;
}

export default function ImageUploader({
  onImageSelect,
  className
}: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Reset state
    setError(null);

    // Check file type
    if (!file.type.match('image.*')) {
      setError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    // Check file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setError('2MB 이하의 이미지만 업로드할 수 있습니다.');
      return;
    }

    setUploading(true);

    // Generate a local preview URL for the selected image
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewUrl(result);

      // In a real implementation, you would upload the file to your server or
      // cloud storage here and get back a URL

      // For demo purposes, we're just using the local preview URL
      // In production, replace this with your actual upload logic
      setTimeout(() => {
        onImageSelect(result);
        setUploading(false);
      }, 1000);
    };
    reader.readAsDataURL(file);
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const clearImage = () => {
    setPreviewUrl(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative flex min-h-[200px] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-all',
          dragActive
            ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30'
            : 'border-gray-300 dark:border-gray-700',
          previewUrl ? 'bg-gray-50 dark:bg-gray-800' : ''
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleChange}
        />

        {previewUrl ? (
          <div className="relative w-full">
            <button
              type="button"
              onClick={clearImage}
              className="absolute right-1 top-1 z-10 rounded-full bg-gray-800/70 p-1 text-white hover:bg-gray-800"
            >
              <FaTimesCircle size={16} />
            </button>
            <div className="relative mx-auto h-[300px] w-full">
              <Image
                src={previewUrl}
                alt="Preview"
                className="rounded-md object-contain"
                fill
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <FaCloudUploadAlt
              className="mb-3 text-gray-400 dark:text-gray-500"
              size={48}
            />
            <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">클릭</span> 또는 이미지 파일을
              드래그하여 업로드하세요
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              SVG, PNG, JPG or GIF (최대 2MB)
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={handleButtonClick}
              className="mt-4 flex items-center rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
              <FaImage className="mr-2" size={12} />
              이미지 선택
            </motion.button>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
            <div className="rounded-md bg-white p-4 shadow-lg dark:bg-gray-800">
              <div className="flex items-center space-x-3">
                <div className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  업로드 중...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
