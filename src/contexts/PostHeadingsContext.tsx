'use client';

import { Heading } from '@/components/blog/TableOfContents';
import { createContext, useContext, useState, ReactNode } from 'react';

interface PostHeadingsContextType {
  headings: Heading[];
  setHeadings: (headings: Heading[]) => void;
}

const PostHeadingsContext = createContext<PostHeadingsContextType | undefined>(
  undefined
);

export function PostHeadingsProvider({ children }: { children: ReactNode }) {
  const [headings, setHeadings] = useState<Heading[]>([]);

  return (
    <PostHeadingsContext.Provider value={{ headings, setHeadings }}>
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
