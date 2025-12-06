'use client';

import styles from '@/styles/markdown.module.css';
import { cn } from '@/utils/style';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

// Import highlight.js theme

interface MarkdownProps {
  children: string;
  className?: string;
}

export const MarkdownViewer: React.FC<MarkdownProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn(styles.viewerContainer, className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          [
            rehypeHighlight,
            {
              ignoreMissing: true,
              subset: false, // Allow all languages
              plainText: ['txt', 'text', 'plain'],
              // Add custom language aliases
              aliases: {
                sol: 'javascript', // Use JavaScript highlighting for Solidity
                solidity: 'javascript',
                js: 'javascript',
                jsx: 'javascript',
                ts: 'typescript',
                tsx: 'typescript',
                py: 'python',
                rb: 'ruby',
                rs: 'rust',
                kt: 'kotlin',
                swift: 'swift',
                go: 'go',
                dart: 'dart',
                scala: 'scala',
                sh: 'bash',
                zsh: 'bash',
                ps1: 'powershell',
                yml: 'yaml',
                dockerfile: 'docker',
                md: 'markdown',
                tex: 'latex',
                proto: 'protobuf',
                gql: 'graphql'
              }
            }
          ]
        ]}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};
