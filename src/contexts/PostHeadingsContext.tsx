'use client';

import { Heading } from '@/components/blog/TableOfContents';
import { createContext, useContext, useState, ReactNode, useMemo } from 'react';

interface PostHeadingsContextType {
  headings: Heading[];
  setHeadings: (headings: Heading[]) => void;
}

const PostHeadingsContext = createContext<PostHeadingsContextType | undefined>(
  undefined
);

export function PostHeadingsProvider({ children }: { children: ReactNode }) {
  const [headings, setHeadings] = useState<Heading[]>([]);

  // Context value를 메모이제이션하여 불필요한 리렌더링 방지
  const value = useMemo(
    () => ({ headings, setHeadings }),
    [headings]
  );

  return (
    <PostHeadingsContext.Provider value={value}>
      {children}
    </PostHeadingsContext.Provider>
  );
}

export function usePostHeadings() {
  const context = useContext(PostHeadingsContext);
  if (context === undefined) {
    throw new Error(
      'usePostHeadings must be used within a PostHeadingsProvider'
    );
  }
  return context;
}
