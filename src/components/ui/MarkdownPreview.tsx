'use client';

import { cn } from '@/utils/style';
import Image from 'next/image';
import { FC } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

// Extended language support with aliases
const getLanguageForHighlighting = (lang: string): string => {
  const languageMap: { [key: string]: string } = {
    // Solidity and blockchain
    sol: 'solidity',
    solidity: 'solidity',

    // Popular languages
    js: 'javascript',
    jsx: 'jsx',
    ts: 'typescript',
    tsx: 'tsx',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    kt: 'kotlin',
    swift: 'swift',
    dart: 'dart',
    scala: 'scala',

    // C family
    c: 'c',
    cpp: 'cpp',
    'c++': 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',

    // Scripting
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    fish: 'bash',
    ps1: 'powershell',
    powershell: 'powershell',

    // Functional
    hs: 'haskell',
    haskell: 'haskell',
    clj: 'clojure',
    cljs: 'clojure',
    clojure: 'clojure',
    ex: 'elixir',
    exs: 'elixir',
    elixir: 'elixir',
    erl: 'erlang',
    erlang: 'erlang',
    jl: 'julia',
    julia: 'julia',
    r: 'r',

    // System
    lua: 'lua',
    perl: 'perl',
    pl: 'perl',
    asm: 'nasm',
    assembly: 'nasm',

    // Web
    html: 'markup',
    xml: 'markup',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    stylus: 'stylus',

    // Data/Config
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    ini: 'ini',
    cfg: 'ini',
    conf: 'ini',

    // Database
    sql: 'sql',
    mysql: 'sql',
    postgresql: 'sql',
    sqlite: 'sql',

    // DevOps
    dockerfile: 'docker',
    docker: 'docker',
    nginx: 'nginx',
    apache: 'apacheconf',
    makefile: 'makefile',
    cmake: 'cmake',

    // Document/Markup
    md: 'markdown',
    markdown: 'markdown',
    tex: 'latex',
    latex: 'latex',
    rst: 'rest',

    // Version control
    diff: 'diff',
    patch: 'diff',
    git: 'git',

    // Others
    vim: 'vim',
    proto: 'protobuf',
    protobuf: 'protobuf',
    gql: 'graphql',
    graphql: 'graphql',
    wasm: 'wasm',
    wat: 'wasm'
  };

  const normalized = lang.toLowerCase();
  return languageMap[normalized] || normalized;
};

const MarkdownPreview: FC<MarkdownPreviewProps> = ({ content, className }) => {
  const components: Components = {
    code: (props: any) => {
      const { node, inline, className, children, ...rest } = props;
      const match = /language-(\w+)/.exec(className || '');

      if (!inline && match) {
        const language = getLanguageForHighlighting(match[1]);

        return (
          <SyntaxHighlighter
            style={oneDark}
            language={language}
            PreTag="div"
            showLineNumbers={true}
            wrapLines={true}
            customStyle={{
              margin: '1rem 0',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              lineHeight: '1.5',
              background: '#1e1e1e'
            }}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        );
      }

      return (
        <code
          className={cn(
            'rounded bg-gray-100 px-1 py-0.5 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
            className
          )}
          {...rest}
        >
          {children}
        </code>
      );
    },
    p(props) {
      return <p className="mb-4 text-gray-800 dark:text-gray-200" {...props} />;
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
        <li className="mb-1 text-gray-800 dark:text-gray-200" {...props} />
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
  };

  return (
    <div className={cn('prose max-w-none dark:prose-invert', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownPreview;
