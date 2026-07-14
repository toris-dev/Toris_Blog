'use client';

import { highlightTextParts } from '@/utils/search';

interface HighlightTextProps {
  text: string;
  searchTerm: string;
}

export function HighlightText({ text, searchTerm }: HighlightTextProps) {
  const parts = highlightTextParts(text, searchTerm);

  return (
    <>
      {parts.map((part, index) => {
        if (part.isMatch) {
          return (
            <mark
              key={index}
              className="rounded-sm bg-[var(--toris-system)] px-1 text-[var(--toris-on-system)]"
            >
              {part.text}
            </mark>
          );
        }
        return <span key={index}>{part.text}</span>;
      })}
    </>
  );
}
