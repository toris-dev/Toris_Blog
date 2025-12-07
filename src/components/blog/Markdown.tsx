'use client';

import styles from '@/styles/markdown.module.css';
import { cn } from '@/utils/style';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

// Import highlight.js theme for code syntax highlighting
import 'highlight.js/styles/github-dark.css';

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
                // Solidity and blockchain
                sol: 'javascript',
                solidity: 'javascript',
                // JavaScript/TypeScript
                js: 'javascript',
                jsx: 'javascript',
                mjs: 'javascript',
                cjs: 'javascript',
                ts: 'typescript',
                tsx: 'typescript',
                // Scripting languages
                py: 'python',
                rb: 'ruby',
                sh: 'bash',
                bash: 'bash',
                zsh: 'bash',
                fish: 'bash',
                ps1: 'powershell',
                pwsh: 'powershell',
                // System languages
                rs: 'rust',
                rust: 'rust',
                kt: 'kotlin',
                kotlin: 'kotlin',
                swift: 'swift',
                go: 'go',
                golang: 'go',
                dart: 'dart',
                scala: 'scala',
                java: 'java',
                // Config files
                yml: 'yaml',
                yaml: 'yaml',
                toml: 'toml',
                json: 'json',
                // DevOps
                dockerfile: 'docker',
                docker: 'docker',
                // Documentation
                md: 'markdown',
                markdown: 'markdown',
                tex: 'latex',
                latex: 'latex',
                // Others
                proto: 'protobuf',
                protobuf: 'protobuf',
                gql: 'graphql',
                graphql: 'graphql',
                sql: 'sql',
                css: 'css',
                scss: 'scss',
                sass: 'sass',
                html: 'xml',
                xml: 'xml'
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
