'use client';

import styles from '@/styles/markdown.module.css';
import { cn } from '@/utils/style';
import '@uiw/react-markdown-preview/markdown.css';
import '@uiw/react-md-editor/markdown-editor.css';
import dynamic from 'next/dynamic';
import { useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

// 클라이언트 측에서만 로드할 컴포넌트
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false
});
const MarkdownPreview = dynamic(() => import('@uiw/react-markdown-preview'), {
  ssr: false
});

interface EditorProps {
  value?: string;
  onChange?: (value: string) => void;
  height?: string;
}

export const MarkdownEditor = ({
  value = '',
  onChange,
  height = '400px'
}: EditorProps) => {
  // 콜백 함수를 메모이제이션하여 성능 향상
  const handleChange = useCallback(
    (value?: string) => {
      console.log('Editor value changed:', value?.substring(0, 20) + '...');
      onChange && onChange(value || '');
    },
    [onChange]
  );

  return (
    <div className={styles.editorContainer} data-color-mode="light">
      <MDEditor
        value={value}
        onChange={handleChange}
        height={parseInt(height, 10)}
        preview="edit"
        highlightEnable
        enableScroll
        textareaProps={{
          placeholder: 'Write your content here...'
        }}
      />
    </div>
  );
};

export const MarkdownViewer = ({
  value = '',
  className = ''
}: {
  value?: string;
  className?: string;
}) => {
  return (
    <div
      className={`${styles.viewerContainer} ${className}`}
      data-color-mode="light"
    >
      <MarkdownPreview source={value} />
    </div>
  );
};

interface MarkdownProps {
  children: string;
  className?: string;
}

export const Markdown: React.FC<MarkdownProps> = ({ children, className }) => {
  return (
    <div className={cn(styles.markdown, className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {children}
      </ReactMarkdown>
    </div>
  );
};
