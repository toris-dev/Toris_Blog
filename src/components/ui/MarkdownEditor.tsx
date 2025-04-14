'use client';

import { cn } from '@/utils/style';
import React, { useEffect, useRef } from 'react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
  className
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      placeholder={placeholder || 'Write your markdown content here...'}
      className={cn(
        'w-full resize-none overflow-hidden rounded-md border-0 bg-transparent p-0 text-base text-gray-900 outline-none focus:ring-0 dark:text-gray-100',
        className
      )}
      style={{ minHeight: '200px' }}
    />
  );
}
