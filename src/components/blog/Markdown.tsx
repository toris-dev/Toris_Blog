'use client';

import styles from '@/styles/markdown.module.css';
import { cn } from '@/utils/style';
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo
} from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { Heading } from './TableOfContents';
import { CodeBlock } from './CodeBlock';

// Import highlight.js theme for code syntax highlighting
// 라이트/다크 모드에 따라 동적으로 로드

interface MarkdownProps {
  children: string;
  className?: string;
  onHeadingsChange?: (headings: Heading[]) => void;
}

// 텍스트를 slug로 변환하는 함수
// 이모지와 특수문자를 처리하도록 개선
const slugify = (text: string): string => {
  // 이모지와 특수문자를 제거하되, 한글과 영문은 유지
  let slug = text
    .toLowerCase()
    .trim()
    // 이모지 제거 (유니코드 범위)
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    // 영문, 숫자, 한글, 공백, 하이픈, 언더스코어만 유지
    .replace(/[^\w\s가-힣-]/g, '')
    .replace(/[\s_-]+/g, '-') // 공백, 언더스코어, 하이픈을 하이픈으로
    .replace(/^-+|-+$/g, ''); // 앞뒤 하이픈 제거

  // 빈 문자열이면 인덱스 기반 ID 생성
  if (!slug) {
    return '';
  }

  return slug;
};

// 코드 내용 기반 해시 생성 (결정론적)
const hashString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32비트 정수로 변환
  }
  return Math.abs(hash).toString(36);
};

const MarkdownViewerComponent: React.FC<MarkdownProps> = ({
  children,
  className,
  onHeadingsChange
}) => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  // 헤딩 ID를 동기적으로 계산 (결정론적, hydration mismatch 방지)
  // 서버와 클라이언트에서 동일한 결과를 보장하기 위해 렌더링 시점에 계산
  const computeHeadingIdsSync = useCallback((content: string) => {
    const headingIdsMap = new Map<string, string>();
    const idCounts = new Map<string, number>();
    let headingIndex = 0;

    // 마크다운에서 h2 헤딩만 추출하여 ID 미리 계산 (목차는 h2만 표시)
    const headingRegex = /^(#{2})\s+(.+)$/gm;
    let match;
    const headingOrder: Array<{ level: number; text: string }> = [];

    while ((match = headingRegex.exec(content)) !== null) {
      headingOrder.push({
        level: 2, // h2만 추출
        text: match[2].trim()
      });
    }

    // 순서대로 ID 할당 (결정론적)
    headingOrder.forEach(({ level, text }) => {
      const key = `${level}-${text}`;
      let baseId = slugify(text);

      // slugify가 실패하면 텍스트 기반 해시 생성
      if (!baseId) {
        // 텍스트의 해시값을 기반으로 ID 생성 (결정론적)
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
          const char = text.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash = hash & hash; // 32비트 정수로 변환
        }
        baseId = `heading-${Math.abs(hash).toString(36)}`;
      }

      // 중복 ID 처리
      if (idCounts.has(baseId)) {
        const count = idCounts.get(baseId)! + 1;
        idCounts.set(baseId, count);
        headingIdsMap.set(key, `${baseId}-${count}`);
      } else {
        idCounts.set(baseId, 0);
        headingIdsMap.set(key, baseId);
      }
    });

    return headingIdsMap;
  }, []);

  // Mermaid ID를 동기적으로 계산 (결정론적)
  const computeMermaidIdsSync = useCallback((content: string) => {
    const mermaidIdsMap = new Map<string, string>();
    let mermaidIndex = 0;

    // Mermaid 코드 블록 ID 미리 계산
    const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
    let mermaidMatch;

    while ((mermaidMatch = mermaidRegex.exec(content)) !== null) {
      const code = mermaidMatch[1].trim();
      const codeHash = hashString(code);
      const mermaidId = `mermaid-${mermaidIndex}-${codeHash}`;
      mermaidIdsMap.set(code, mermaidId);
      mermaidIndex++;
    }

    return mermaidIdsMap;
  }, []);

  // 렌더링 시점에 동기적으로 ID 계산 (서버와 클라이언트에서 동일)
  // useMemo로 메모이제이션하여 무한 루프 방지
  const headingIdsMap = useMemo(
    () => computeHeadingIdsSync(children),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [children]
  );
  const mermaidIdsMap = useMemo(
    () => computeMermaidIdsSync(children),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [children]
  );

  // Mermaid 초기화 및 테마 설정
  useEffect(() => {
    const isDark = theme === 'dark' || theme === 'cyberpunk';

    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'default',
        securityLevel: 'loose',
        fontFamily: 'inherit',
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true
        }
      });
    } catch (error) {
      console.error('Mermaid initialization error:', error);
    }
  }, [theme]);

  // Shiki는 CodeBlock 컴포넌트 내부에서 처리되므로 highlight.js 테마 로드 제거

  // Mermaid 다이어그램 렌더링
  const renderMermaid = useCallback(
    async (id: string, code: string, element: HTMLDivElement) => {
      try {
        // 기존 SVG 제거
        element.innerHTML = '';

        // Mermaid가 초기화되었는지 확인
        if (!mermaid || typeof mermaid.render !== 'function') {
          throw new Error('Mermaid is not initialized');
        }

        // Mermaid 렌더링
        const { svg } = await mermaid.render(id, code);
        if (svg) {
          element.innerHTML = svg;
        } else {
          throw new Error('Mermaid returned empty SVG');
        }
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        element.innerHTML = `<pre class="${styles.mermaidError}">Mermaid 다이어그램 렌더링 실패: ${error instanceof Error ? error.message : 'Unknown error'}</pre>`;
      }
    },
    []
  );

  // 헤딩 ID를 추적하기 위한 ref
  const headingIdsRef = useRef<Map<string, string>>(new Map());

  // 헤딩 컴포넌트 커스터마이징 (ID 부여)
  const headingComponents: Partial<Components> = {
    h2({ node, children, ...props }: any) {
      const text = String(children).trim();
      const key = `2-${text}`;
      let id = headingIdsMap.get(key);

      // headingIdsMap에 없으면 slugify 시도
      if (!id) {
        id = slugify(text);

        // slugify도 실패하면 해시 기반 ID 생성
        if (!id) {
          let hash = 0;
          for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
          }
          id = `heading-${Math.abs(hash).toString(36)}`;
        }
      }

      // 실제 렌더링된 ID를 추적
      headingIdsRef.current.set(text, id);

      return (
        <h2 id={id} {...props}>
          {children}
        </h2>
      );
    },
    h3({ node, children, ...props }: any) {
      const text = String(children);
      const key = `3-${text}`;
      const id = headingIdsMap.get(key) || slugify(text) || 'heading-0';

      return (
        <h3 id={id} {...props}>
          {children}
        </h3>
      );
    },
    h4({ node, children, ...props }: any) {
      const text = String(children);
      const key = `4-${text}`;
      const id = headingIdsMap.get(key) || slugify(text) || 'heading-0';

      return (
        <h4 id={id} {...props}>
          {children}
        </h4>
      );
    },
    h5({ node, children, ...props }: any) {
      const text = String(children);
      const key = `5-${text}`;
      const id = headingIdsMap.get(key) || slugify(text) || 'heading-0';

      return (
        <h5 id={id} {...props}>
          {children}
        </h5>
      );
    },
    h6({ node, children, ...props }: any) {
      const text = String(children);
      const key = `6-${text}`;
      const id = headingIdsMap.get(key) || slugify(text) || 'heading-0';

      return (
        <h6 id={id} {...props}>
          {children}
        </h6>
      );
    }
  };

  // code 컴포넌트 커스터마이징
  const codeComponents: Partial<Components> = {
    code({ node, className, children, ...props }: any) {
      const inline = !className || !className.includes('language-');
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const codeString = String(children).replace(/\n$/, '');

      // Mermaid 코드 블록 처리
      if (language === 'mermaid' && !inline) {
        // 결정론적 ID 생성 (hydration mismatch 방지)
        const mermaidId =
          mermaidIdsMap.get(codeString) || `mermaid-${hashString(codeString)}`;

        return (
          <div
            key={mermaidId}
            className={styles.mermaidContainer}
            data-mermaid-id={mermaidId}
            data-mermaid-code={codeString}
          />
        );
      }

      // 코드 블록 (pre > code) 처리
      if (!inline && language) {
        return (
          <CodeBlock
            code={codeString}
            language={language}
            className={className}
          />
        );
      }

      // 인라인 코드 처리
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    pre({ node, children, ...props }: any) {
      // ReactMarkdown은 pre > code 구조로 렌더링하므로
      // code 컴포넌트에서 CodeBlock을 반환한 경우 pre 태그를 제거
      const firstChild = React.Children.toArray(children)[0] as any;

      // CodeBlock 컴포넌트인지 확인
      const isCodeBlock =
        firstChild?.props?.['data-code-block'] === 'true' ||
        firstChild?.type === CodeBlock ||
        firstChild?.type?.displayName === 'CodeBlock' ||
        (firstChild?.props && firstChild.props.code !== undefined);

      if (isCodeBlock) {
        // CodeBlock이 자체적으로 스타일링하므로 pre 태그 제거
        return <>{children}</>;
      }

      // 일반 pre 태그 (CodeBlock이 아닌 경우)
      return <pre {...props}>{children}</pre>;
    }
  };

  // 이미지 컴포넌트 - SEO 최적화
  const imageComponents: Partial<Components> = {
    img({ node, src, alt, title, ...props }: any) {
      // src 처리: 로컬 이미지(/images/...)는 그대로 사용, 외부 이미지만 baseUrl과 결합
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app';
      
      let imageSrc = src;
      
      if (src?.startsWith('http')) {
        // 외부 URL은 그대로 사용
        imageSrc = src;
      } else if (src?.startsWith('/images/')) {
        // 로컬 이미지는 그대로 사용 (Next.js가 자동으로 처리)
        imageSrc = src;
      } else if (src?.startsWith('/')) {
        // 다른 로컬 경로도 그대로 사용
        imageSrc = src;
      }

      // alt 텍스트 개선: 없으면 제목에서 추출하거나 기본값 사용
      const optimizedAlt = alt || title || '블로그 포스트 이미지';

      // width와 height 추출 시도 (props에서)
      const width = props.width ? Number(props.width) : 800;
      const height = props.height ? Number(props.height) : 600;

      // 외부 이미지인 경우 unoptimized 사용
      // 로컬 이미지(/images/...)는 최적화 사용, 외부 이미지만 unoptimized
      const isExternal =
        imageSrc?.startsWith('http') && 
        !imageSrc?.includes('localhost') && 
        !imageSrc?.includes('127.0.0.1');

      return (
        <div className="my-6 flex flex-col items-center">
          <Image
            src={imageSrc || ''}
            alt={optimizedAlt}
            width={width}
            height={height}
            className="max-h-[600px] w-auto rounded-lg object-contain"
            sizes="(max-width: 768px) 100vw, 800px"
            loading="lazy"
            title={title || optimizedAlt}
            unoptimized={isExternal}
            {...props}
          />
          {title && (
            <div className="mt-2 text-sm text-muted-foreground text-center">
              {title}
            </div>
          )}
        </div>
      );
    }
  };

  // p 컴포넌트 커스터마이징 - 이미지가 포함된 경우 p 태그를 렌더링하지 않음
  const pComponents: Partial<Components> = {
    p({ node, children, ...props }: any) {
      // 자식 요소 중에 img가 있는지 확인
      const hasImage = node?.children?.some(
        (child: any) => child.type === 'element' && child.tagName === 'img'
      );

      // 이미지가 포함된 경우 div로 렌더링
      if (hasImage) {
        return <div {...props}>{children}</div>;
      }

      // 일반적인 경우 p 태그로 렌더링
      return <p {...props}>{children}</p>;
    }
  };

  // components 병합
  const components: Partial<Components> = {
    ...headingComponents,
    ...codeComponents,
    ...imageComponents,
    ...pComponents
  };

  // children이 변경될 때 헤딩 추출
  useEffect(() => {
    if (!onHeadingsChange || !containerRef.current) return;

    let debounceTimer: NodeJS.Timeout | null = null;
    let isExtracting = false;

    const extractHeadings = () => {
      if (!containerRef.current || isExtracting) return;
      isExtracting = true;

      const headings: Heading[] = [];
      const h2Elements = containerRef.current.querySelectorAll('h2');

      // 실제 DOM의 h2 요소들에서 직접 추출
      Array.from(h2Elements).forEach((h2) => {
        const id = h2.id;
        const text = h2.textContent?.trim() || '';

        // ID가 없거나 heading-0, heading-1 같은 fallback ID인 경우 재생성
        if (!id || (id.startsWith('heading-') && /^heading-\d+$/.test(id))) {
          // 해시 기반 ID 생성
          let hash = 0;
          for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
          }
          const newId = `heading-${Math.abs(hash).toString(36)}`;
          h2.id = newId;
          headings.push({
            id: newId,
            text,
            level: 2
          });
        } else if (id && text) {
          headings.push({
            id, // 실제 DOM의 ID 사용
            text,
            level: 2
          });
        }
      });

      // 목차 업데이트
      if (headings.length > 0) {
        onHeadingsChange(headings);
      }

      isExtracting = false;
    };

    // 디바운스된 추출 함수
    const debouncedExtract = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(extractHeadings, 500);
    };

    // 초기 추출 (지연) - ReactMarkdown 렌더링 완료 대기
    const initialTimer = setTimeout(extractHeadings, 1000);

    // MutationObserver로 DOM 변경 감지 (최적화된 설정)
    // 성능 최적화: 관련 변경사항만 감지하고 디바운싱 적용
    let lastExtractTime = 0;
    const EXTRACT_INTERVAL = 1000; // 최소 1초 간격으로만 추출

    const observer = new MutationObserver((mutations) => {
      const now = Date.now();
      // 너무 자주 실행되지 않도록 제한
      if (now - lastExtractTime < EXTRACT_INTERVAL) {
        return;
      }

      // ID 속성 변경이나 h2 요소 추가/제거만 감지
      const hasRelevantChange = mutations.some((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'id') {
          const target = mutation.target as Element;
          return target.tagName === 'H2';
        }
        if (mutation.type === 'childList') {
          const addedNodes = Array.from(mutation.addedNodes);
          const removedNodes = Array.from(mutation.removedNodes);
          return (
            addedNodes.some(
              (node) =>
                node.nodeType === 1 &&
                ((node as Element).tagName === 'H2' ||
                  (node as Element).querySelector('h2'))
            ) ||
            removedNodes.some(
              (node) =>
                node.nodeType === 1 &&
                ((node as Element).tagName === 'H2' ||
                  (node as Element).querySelector('h2'))
            )
          );
        }
        return false;
      });

      if (hasRelevantChange) {
        lastExtractTime = now;
        debouncedExtract();
      }
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['id']
    });

    return () => {
      clearTimeout(initialTimer);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      observer.disconnect();
    };
  }, [children, onHeadingsChange]);

  // Mermaid 다이어그램 렌더링 (DOM이 준비된 후)
  useEffect(() => {
    if (!containerRef.current) return;

    const renderMermaidDiagrams = () => {
      if (!containerRef.current) return;

      const mermaidElements =
        containerRef.current.querySelectorAll<HTMLDivElement>(
          `[data-mermaid-id]`
        );

      if (!mermaidElements || mermaidElements.length === 0) return;

      const renderPromises = Array.from(mermaidElements).map(
        async (element) => {
          const id = element.getAttribute('data-mermaid-id');
          const code = element.getAttribute('data-mermaid-code');

          // SVG가 이미 있으면 스킵
          if (element.querySelector('svg')) {
            return;
          }

          if (id && code) {
            try {
              await renderMermaid(id, code, element);
            } catch (error) {
              console.error(`Error rendering Mermaid diagram ${id}:`, error);
            }
          }
        }
      );

      Promise.all(renderPromises).catch((error) => {
        console.error('Error rendering Mermaid diagrams:', error);
      });
    };

    // DOM이 완전히 렌더링된 후 실행 (더 긴 지연)
    const timer = setTimeout(renderMermaidDiagrams, 500);

    // MutationObserver로 Mermaid 요소 추가 감지
    const observer = new MutationObserver((mutations) => {
      const hasMermaidAdded = mutations.some((mutation) => {
        if (mutation.type === 'childList') {
          const addedNodes = Array.from(mutation.addedNodes);
          return addedNodes.some(
            (node) =>
              node.nodeType === 1 &&
              ((node as Element).hasAttribute('data-mermaid-id') ||
                (node as Element).querySelector('[data-mermaid-id]'))
          );
        }
        return false;
      });

      if (hasMermaidAdded) {
        // Mermaid 요소가 추가되면 렌더링
        setTimeout(renderMermaidDiagrams, 200);
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true
      });
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [children, theme, renderMermaid]);

  return (
    <div ref={containerRef} className={cn(styles.viewerContainer, className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

// React.memo로 메모이제이션하여 props가 변경되지 않으면 리렌더링 방지
export const MarkdownViewer = React.memo(
  MarkdownViewerComponent,
  (prevProps, nextProps) => {
    // children(마크다운 content)가 변경된 경우에만 리렌더링
    if (prevProps.children !== nextProps.children) {
      return false; // 리렌더링 필요
    }
    // className이 변경된 경우에만 리렌더링
    if (prevProps.className !== nextProps.className) {
      return false; // 리렌더링 필요
    }
    // onHeadingsChange 함수 참조가 변경된 경우에만 리렌더링
    if (prevProps.onHeadingsChange !== nextProps.onHeadingsChange) {
      return false; // 리렌더링 필요
    }
    // 모든 props가 동일하면 리렌더링 불필요
    return true; // 리렌더링 스킵
  }
);
