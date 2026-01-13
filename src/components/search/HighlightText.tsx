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
              className="rounded bg-yellow-200 px-0.5 dark:bg-yellow-900/50"
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
