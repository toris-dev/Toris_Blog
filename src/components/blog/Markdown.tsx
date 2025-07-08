'use client';

import styles from '@/styles/markdown.module.css';
import { cn } from '@/utils/style';
import styles from '@/styles/markdown.module.css';
import { cn } from '@/utils/style';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface MarkdownProps {
  children: string;
  className?: string;
}

export const MarkdownViewer: React.FC<MarkdownProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn(styles.markdown, className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};
