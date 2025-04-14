'use client';

import { cn } from '@/utils/style';
import Image from 'next/image';
import { FC } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

const MarkdownPreview: FC<MarkdownPreviewProps> = ({ content, className }) => {
  return (
    <div className={cn('prose max-w-none dark:prose-invert', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          code({
            inline,
            className,
            children,
            ...props
          }: {
            inline: boolean;
            className: string;
            children: React.ReactNode;
            props: any;
          }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code
                className={cn(
                  'rounded bg-gray-100 px-1 py-0.5 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
                  className
                )}
                {...props}
              >
                {children}
              </code>
            );
          },
          p(props) {
            return (
              <p className="mb-4 text-gray-800 dark:text-gray-200" {...props} />
            );
          },
          a(props) {
            return (
              <a
                className="text-blue-500 hover:underline dark:text-blue-400"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              />
            );
          },
          ul(props) {
            return (
              <ul
                className="mb-4 list-disc pl-5 text-gray-800 dark:text-gray-200"
                {...props}
              />
            );
          },
          ol(props) {
            return (
              <ol
                className="mb-4 list-decimal pl-5 text-gray-800 dark:text-gray-200"
                {...props}
              />
            );
          },
          li(props) {
            return (
              <li
                className="mb-1 text-gray-800 dark:text-gray-200"
                {...props}
              />
            );
          },
          blockquote(props) {
            return (
              <blockquote
                className="mb-4 border-l-4 border-gray-300 pl-4 italic text-gray-700 dark:border-gray-600 dark:text-gray-300"
                {...props}
              />
            );
          },
          h1(props) {
            return (
              <h1
                className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100"
                {...props}
              />
            );
          },
          h2(props) {
            return (
              <h2
                className="mb-3 mt-8 text-2xl font-bold text-gray-900 dark:text-gray-100"
                {...props}
              />
            );
          },
          h3(props) {
            return (
              <h3
                className="mb-3 mt-6 text-xl font-bold text-gray-900 dark:text-gray-100"
                {...props}
              />
            );
          },
          h4(props) {
            return (
              <h4
                className="mb-2 mt-4 text-lg font-bold text-gray-900 dark:text-gray-100"
                {...props}
              />
            );
          },
          h5(props) {
            return (
              <h5
                className="mb-2 mt-4 text-base font-bold text-gray-900 dark:text-gray-100"
                {...props}
              />
            );
          },
          h6(props) {
            return (
              <h6
                className="mb-2 mt-4 text-sm font-bold text-gray-900 dark:text-gray-100"
                {...props}
              />
            );
          },
          img(props) {
            const { src, alt, width, height } = props;
            return (
              <Image
                className="mx-auto my-4 max-h-[400px] rounded-md"
                src={src || ''}
                width={width ? Number(width) : 600}
                height={height ? Number(height) : 400}
                alt={alt || ''}
              />
            );
          },
          table(props) {
            return (
              <div className="mb-6 overflow-x-auto">
                <table
                  className="w-full border-collapse border border-gray-300 dark:border-gray-700"
                  {...props}
                />
              </div>
            );
          },
          tr(props) {
            return (
              <tr
                className="border-b border-gray-300 dark:border-gray-700"
                {...props}
              />
            );
          },
          th(props) {
            return (
              <th
                className="border border-gray-300 bg-gray-100 p-2 text-left font-bold dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                {...props}
              />
            );
          },
          td(props) {
            return (
              <td
                className="border border-gray-300 p-2 text-gray-800 dark:border-gray-700 dark:text-gray-200"
                {...props}
              />
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownPreview;
