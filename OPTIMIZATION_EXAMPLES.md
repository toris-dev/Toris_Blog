# 성능 최적화 구현 예제

> 실제 코드로 보는 성능 최적화 패턴

---

## 1. 동적 임포트 (Code Splitting)

### 예제 1: Heavy Animation Component

**문제**: Framer Motion을 항상 로드

```tsx
// ❌ 비효율적: 항상 로드
import { motion } from 'framer-motion';

export function PostCard({ post }) {
  return (
    <motion.div whileHover={{ scale: 1.05 }}>
      <h3>{post.title}</h3>
    </motion.div>
  );
}
```

**해결책**: 동적 임포트 사용

```tsx
// ✅ 효율적: 필요할 때만 로드
import dynamic from 'next/dynamic';
import Skeleton from '@/components/Skeleton';

const AnimatedPostCard = dynamic(
  () => import('@/components/AnimatedPostCard'),
  {
    loading: () => <Skeleton className="h-64" />,
    ssr: true // SSR은 필요하면 활성화
  }
);

export function PostList({ posts }) {
  return (
    <div>
      {posts.map(post => (
        <AnimatedPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

### 예제 2: Heavy UI Library

**문제**: 모달, 드롭다운이 항상 로드됨

```tsx
// ❌ 비효율적
import { Dialog, Popover } from '@headlessui/react';

export function Header() {
  return (
    <header>
      <Dialog open={false} />
      <Popover>...</Popover>
    </header>
  );
}
```

**해결책**: 조건부 동적 임포트

```tsx
// ✅ 효율적: 필요할 때만 로드
import dynamic from 'next/dynamic';

const SearchDialog = dynamic(
  () => import('@/components/SearchDialog'),
  { loading: () => null }
);

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <header>
      {isOpen && <SearchDialog onClose={() => setIsOpen(false)} />}
      <button onClick={() => setIsOpen(true)}>Search</button>
    </header>
  );
}
```

### 예제 3: Route-based Code Splitting

```tsx
// app/todos/page.tsx - 자동 분할
import dynamic from 'next/dynamic';

const TodoKanban = dynamic(() => import('./_components/TodoKanban'), {
  loading: () => <div>로딩 중...</div>
});

const TodoCalendar = dynamic(() => import('./_components/TodoCalendar'), {
  loading: () => <div>로딩 중...</div>
});

export default function TodosPage() {
  const [view, setView] = useState('kanban');
  
  return (
    <div>
      <div>
        <button onClick={() => setView('kanban')}>칸반</button>
        <button onClick={() => setView('calendar')}>캘린더</button>
      </div>
      {view === 'kanban' && <TodoKanban />}
      {view === 'calendar' && <TodoCalendar />}
    </div>
  );
}
```

---

## 2. Server Components 활용

### 예제 1: 데이터 페칭 (SSR)

```tsx
// app/posts/page.tsx - 서버 컴포넌트
// 이것은 자동으로 서버에서 렌더링됨

async function PostList() {
  // 클라이언트에 번들되지 않음
  const posts = await getPosts();
  
  return (
    <div className="grid grid-cols-3">
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

export default PostList;
```

**이점**:
- 데이터베이스 로직 클라이언트 번들에 포함 안 됨
- 서버에서만 실행되는 코드 분리
- API 라우트 불필요

### 예제 2: 서버 + 클라이언트 혼합

```tsx
// app/posts/page.tsx
import { PostFilter } from './_components/PostFilter'; // 클라이언트
import { PostList } from './_components/PostList'; // 서버

export default async function PostsPage() {
  // 서버에서 모든 포스트 로드
  const allPosts = await getPosts();
  
  return (
    <div>
      {/* 클라이언트: 필터 인터랙션 */}
      <PostFilter />
      
      {/* 서버: 필터된 포스트 렌더링 */}
      <PostList posts={allPosts} />
    </div>
  );
}
```

```tsx
// _components/PostFilter.tsx - 클라이언트 컴포넌트
'use client';

export function PostFilter() {
  const [category, setCategory] = useState('all');
  
  return (
    <select onChange={e => setCategory(e.target.value)}>
      <option value="all">All</option>
      <option value="learning">Learning</option>
    </select>
  );
}
```

```tsx
// _components/PostList.tsx - 서버 컴포넌트
async function PostList({ posts }) {
  return (
    <div className="grid grid-cols-3">
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

export default PostList;
```

### 예제 3: Suspense로 로딩 개선

```tsx
// app/posts/page.tsx
import { Suspense } from 'react';
import { PostListSkeleton } from './_components/PostListSkeleton';

async function PostList() {
  const posts = await getPosts();
  return (
    <div className="grid grid-cols-3">
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

export default function PostsPage() {
  return (
    <div>
      {/* Suspense로 스켈레톤 표시 */}
      <Suspense fallback={<PostListSkeleton />}>
        <PostList />
      </Suspense>
    </div>
  );
}
```

---

## 3. 이미지 최적화

### 예제 1: 반응형 이미지

```tsx
// components/PostImage.tsx
import Image from 'next/image';

export function PostImage({ src, alt, title }) {
  return (
    <Image
      src={src}
      alt={alt}
      title={title}
      width={800}
      height={450}
      quality={85}
      loading="lazy"
      sizes={`
        (max-width: 640px) 100vw,
        (max-width: 1024px) 750px,
        1200px
      `}
      placeholder="blur"
      blurDataURL="data:image/png;base64,iVBORw0KGgo..." // 임시 이미지
      priority={false} // 필요시 true로 변경
      className="rounded-lg"
    />
  );
}
```

### 예제 2: Hero 이미지 (우선 로드)

```tsx
// components/HeroSection.tsx
import Image from 'next/image';

export function HeroSection() {
  return (
    <Image
      src="/hero.webp"
      alt="Hero image"
      width={1920}
      height={1080}
      priority={true} // 우선 로드
      quality={90}
      sizes="100vw"
      className="w-full h-auto"
    />
  );
}
```

### 예제 3: 외부 도메인 이미지

```tsx
// next.config.ts에 remotePattern 추가된 상태
import Image from 'next/image';

export function ExternalImage({ post }) {
  return (
    <Image
      src={`https://oopy.lazyrockets.com/api/v2/notion/${post.imageId}`}
      alt={post.title}
      width={800}
      height={450}
      quality={80}
      loading="lazy"
      onError={(result) => {
        // 이미지 로드 실패 처리
        result.target.src = '/fallback-image.png';
      }}
    />
  );
}
```

---

## 4. 캐싱 전략

### 예제 1: ISR (Incremental Static Regeneration)

```tsx
// app/posts/[id]/page.tsx
export const revalidate = 21600; // 6시간마다 재생성

export async function generateStaticParams() {
  // 빌드 타임에 이 경로들을 정적 생성
  const posts = await getPosts();
  return posts.map(post => ({
    id: post.id.toString()
  }));
}

async function PostPage({ params }) {
  // 정적 페이지로 제공되지만 6시간마다 재생성
  const post = await getPost(params.id);
  
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}

export default PostPage;
```

### 예제 2: Fetch 캐싱

```tsx
// app/api/posts/route.ts
export async function GET() {
  // 1시간 캐싱
  const posts = await fetch('https://db.example.com/posts', {
    next: { revalidate: 3600 }
  });
  
  return Response.json(posts);
}
```

### 예제 3: 불변 캐싱 (이미지)

```typescript
// next.config.ts
async headers() {
  return [
    {
      source: '/_next/image/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable' // 1년 캐싱
        }
      ]
    },
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, stale-while-revalidate=86400'
        }
      ]
    }
  ];
}
```

---

## 5. 폰트 최적화

### 예제 1: Google Fonts with @next/font

```tsx
// app/layout.tsx
import { Inter, JetBrains_Mono } from '@next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // FOIT 방지
  preload: true,
  weight: ['400', '500', '600', '700']
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  preload: true
});

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={inter.className}>
      <head>
        <style>{`
          code {
            font-family: ${jetbrainsMono.style.fontFamily};
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 예제 2: 폰트 로딩 전략

```tsx
// ✅ 권장: subset 사용으로 폰트 크기 감소
const inter = Inter({
  subsets: ['latin', 'korean'],
  display: 'swap'
});

// ✅ 권장: 필요한 weight만 로드
const inter = Inter({
  weight: ['400', '600', '700']
});

// ❌ 피하기: 모든 가중치 로드
const inter = Inter({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
});
```

---

## 6. React Compiler 예제

### React Compiler 활성화 후 불필요한 코드 제거

```tsx
// 활성화 전: 이 코드가 필요했음
'use client';
import { useState, useMemo } from 'react';

export function BlogSearch({ posts }) {
  const [query, setQuery] = useState('');
  
  // React Compiler가 없으면 필요
  const filtered = useMemo(
    () => posts.filter(p => p.title.includes(query)),
    [query, posts]
  );
  
  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <ul>
        {filtered.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

```tsx
// 활성화 후: 간단하게 작성 가능
'use client';
import { useState } from 'react';

export function BlogSearch({ posts }) {
  const [query, setQuery] = useState('');
  
  // React Compiler가 자동으로 최적화
  const filtered = posts.filter(p => p.title.includes(query));
  
  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <ul>
        {filtered.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 7. 번들 분석

### 번들 분석 실행

```bash
# 분석 활성화로 빌드
npm run build:analyze

# 분석 결과 확인
# 브라우저에서 .next/analyze/client.html 열기
```

### 분석 결과 개선

**Large Chunks 찾기**:
1. `client.html` 분석 보고서에서 50KB 이상인 모듈 찾기
2. `node_modules` 크기 확인
3. Tree-shaking 가능 여부 확인

**최적화 순서**:
1. 큰 라이브러리 동적 임포트
2. 불필요한 의존성 제거
3. 중복 패키지 제거

---

## 8. 성능 측정

### Web Vitals 수집

```tsx
// app/layout.tsx
import { WebVitals } from '@/components/WebVitals';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <WebVitals />
      </body>
    </html>
  );
}
```

```tsx
// components/WebVitals.tsx
'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { useEffect } from 'react';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // 분석 도구로 전송
    if (metric.value > 2500) {
      console.warn(`⚠️ ${metric.name}: ${Math.round(metric.value)}ms`);
    } else {
      console.log(`✅ ${metric.name}: ${Math.round(metric.value)}ms`);
    }
    
    // Vercel Analytics와 통합
    window.gtag?.event(metric.name, {
      value: Math.round(metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true
    });
  });
  
  return null;
}
```

---

## 예상 개선 효과

| 최적화 | 예상 효과 |
|--------|----------|
| React Compiler | -30-50% 리렌더링 |
| 코드 분할 | -20-30% 초기 번들 |
| 동적 임포트 | -10-15% 초기 로드 |
| 이미지 최적화 | -40-70% 이미지 크기 |
| ISR | -50-80% 서버 부하 |
| 폰트 최적화 | -20% 폰트 로드 시간 |

---

**작성일**: 2025-07-04
**버전**: 1.0.0
