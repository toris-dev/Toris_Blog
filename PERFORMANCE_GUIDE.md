# Toris Blog - 성능 최적화 가이드

> Next.js 16 + React 19 기반 블로그의 성능 최적화 전략 및 구현 방법

---

## 목차

1. [현재 상태](#현재-상태)
2. [최적화 전략](#최적화-전략)
3. [이미지 최적화](#이미지-최적화)
4. [번들 최적화](#번들-최적화)
5. [렌더링 최적화](#렌더링-최적화)
6. [캐싱 전략](#캐싱-전략)
7. [성능 모니터링](#성능-모니터링)
8. [구현 체크리스트](#구현-체크리스트)

---

## 현재 상태

### ✅ 잘 구현된 부분

- **Server Components**: 서버 렌더링 적절히 사용
- **ISR**: 6시간 재생성 주기 설정
- **Next.js Image**: 이미지 컴포넌트 사용 중
- **외부 도메인**: remotePatterns 적절히 설정

### ⚠️ 개선 필요한 부분

- **React Compiler**: 비활성화 → 활성화 필요
- **번들 분할**: 라이브러리별 코드 분할 미흡
- **CSS 최적화**: Tailwind 설정 개선 필요
- **폰트 로딩**: 최적화 전략 부재

---

## 최적화 전략

### Phase 1: 우선순위 높음 (1-2주)

#### 1.1 React Compiler 활성화
```typescript
// next.config.ts
experimental: {
  reactCompiler: true // 불필요한 리렌더링 자동 방지
}
```

**효과**: 불필요한 렌더링 30-50% 감소

#### 1.2 이미지 포맷 최적화
```typescript
// next.config.ts
images: {
  formats: ['image/avif', 'image/webp']
}
```

**효과**: 이미지 크기 40-70% 감소

#### 1.3 번들 코드 분할
```typescript
// webpack 설정으로 라이브러리별 청크 분리
// React, UI, 애니메이션 라이브러리를 별도 청크로
```

**효과**: 초기 로드 시간 20-30% 단축

### Phase 2: 우선순위 중간 (2-3주)

#### 2.1 동적 임포트 추가
```tsx
// Framer Motion은 필요할 때만 로드
const AnimatedComponent = dynamic(() => import('@/components/Animated'), {
  loading: () => <Skeleton />
});
```

**효과**: 초기 번들 크기 10-15% 감소

#### 2.2 폰트 로딩 최적화
```tsx
// @next/font 사용
import { Inter } from '@next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // FOIT 방지
  preload: true
});
```

**효과**: 텍스트 레이아웃 시프트(CLS) 개선

#### 2.3 서버 컴포넌트 확대
```tsx
// 가능한 많은 컴포넌트를 서버 컴포넌트로 전환
export default function PostList() {
  // 서버에서만 실행됨
  return (...)
}
```

**효과**: 클라이언트 번들 크기 20-30% 감소

### Phase 3: 우선순위 낮음 (3-4주)

#### 3.1 캐싱 전략 강화
```typescript
// API 응답 캐싱
export const revalidate = 3600; // 1시간

// fetch 캐싱
const data = await fetch(url, {
  next: { revalidate: 3600 }
});
```

#### 3.2 분석 도구 최적화
```bash
# 번들 분석
npm run build:analyze

# 성능 프로파일링
npm run dev -- --profile
```

#### 3.3 세 번째 파티 스크립트 최적화
```tsx
// 분석 스크립트는 다음 페인트 후 로드
<Script
  src="..."
  strategy="lazyOnload"
  onLoad={() => console.log('script loaded')}
/>
```

---

## 이미지 최적화

### 1. Next.js Image 컴포넌트 사용

```tsx
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
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 750px, 1200px"
      placeholder="blur"
      blurDataURL="data:image/png;base64,iVBORw0KGgo..." // 미리 생성
      priority={false}
    />
  );
}
```

### 2. 이미지 포맷

**우선순위**:
1. AVIF (최고 압축, 모던 브라우저만)
2. WebP (좋은 압축, 광범위 지원)
3. JPEG/PNG (폴백)

Next.js가 `formats: ['image/avif', 'image/webp']`로 자동 처리

### 3. 이미지 크기 최적화

```tsx
// 반응형 srcset 자동 생성
<Image
  src={src}
  sizes="(max-width: 640px) 100vw,
         (max-width: 1024px) 750px,
         1200px"
/>
```

### 4. Supabase 이미지 최적화

```tsx
// Supabase 이미지 CDN 활용
const supabaseUrl = 'https://tnmdprhjqnijsaqjvbtd.supabase.co/storage/v1/object/public/blog-image';

// 이미지 URL에 변환 파라미터 추가
const optimizedUrl = `${supabaseUrl}/photo.jpg?quality=80&width=800`;
```

---

## 번들 최적화

### 1. 코드 분할 전략

**자동 분할** (Next.js 기본):
- 각 라우트별로 자동 분할
- Shared chunks는 자동으로 추출

**수동 분할** (동적 임포트):
```tsx
// 무거운 컴포넌트는 동적 임포트
import dynamic from 'next/dynamic';

const TodoKanban = dynamic(() => import('@/components/todos/TodoKanban'), {
  loading: () => <div>로딩 중...</div>,
  ssr: false // 필요시 SSR 비활성화
});
```

### 2. 라이브러리별 분리

```typescript
// webpack 설정으로 큰 라이브러리 분리
cacheGroups: {
  react: { // React 번들
    test: /node_modules[\\/](react|react-dom)/,
    name: 'react-vendor'
  },
  animation: { // Framer Motion 번들
    test: /node_modules[\\/](framer-motion)/,
    name: 'animation-vendor'
  }
}
```

### 3. Tree Shaking

```typescript
// ❌ 피하기: 전체 임포트
import * as lodash from 'lodash';

// ✅ 권장: 필요한 것만 임포트
import { debounce } from 'lodash';
```

### 4. 번들 분석

```bash
# 번들 크기 시각화
npm run build:analyze
```

분석 결과:
- Large 패키지 확인
- Duplicates 제거
- Tree-shaking 기회 찾기

---

## 렌더링 최적화

### 1. React Compiler 활성화

```typescript
// next.config.ts
experimental: {
  reactCompiler: true
}
```

**이점**:
- 자동으로 불필요한 리렌더링 방지
- memo/useMemo/useCallback 불필요
- 성능 30-50% 향상

### 2. 서버 컴포넌트 사용

```tsx
// 데이터 페칭 + 렌더링을 서버에서
export default async function PostList() {
  const posts = await getPosts();
  
  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

### 3. 클라이언트 컴포넌트 최소화

```tsx
// 인터랙티브 부분만 'use client'
'use client';

export function SearchBar() {
  // 검색 입력 등 인터랙션만 여기서
  return <input onChange={handleSearch} />;
}
```

### 4. 메모이제이션 (React Compiler 없을 시)

```tsx
// ❌ 불필요한 memo (React Compiler와 함께 사용 시)
const Component = memo(() => <div>...</div>);

// ✅ 필요한 경우만 memo (복잡한 계산)
const ExpensiveComponent = memo(({ data }) => {
  // 복잡한 렌더링
  return <div>...</div>;
});
```

---

## 캐싱 전략

### 1. ISR (Incremental Static Regeneration)

```typescript
// 포스트 상세 페이지
export const revalidate = 21600; // 6시간마다 재생성

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map(post => ({ id: post.id }));
}

export default async function PostPage({ params }) {
  const post = await getPost(params.id);
  return <PostDetail post={post} />;
}
```

**이점**:
- 초기 로드: 정적 페이지 (매우 빠름)
- 6시간마다: 백그라운드에서 재생성
- 캐시 업데이트 중에도 이전 버전 제공

### 2. Fetch 캐싱

```typescript
// 기본: 모든 fetch 자동 캐싱
export const fetchCache = 'auto'; // 기본값

// 서버 데이터만 캐싱
const posts = await fetch('/api/posts', {
  next: { revalidate: 3600 } // 1시간 캐싱
});

// 캐싱 안 함
const dynamic = await fetch('/api/dynamic', {
  cache: 'no-store'
});
```

### 3. 데이터 캐싱

```typescript
import { unstable_cache } from 'next/cache';

// 비용이 많이 드는 작업 캐싱
const getCachedPosts = unstable_cache(
  async () => await getPosts(),
  ['posts'], // 캐시 키
  { revalidate: 3600 } // 1시간
);
```

### 4. 브라우저 캐싱

```typescript
// next.config.ts
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, stale-while-revalidate=86400'
        }
      ]
    },
    {
      source: '/_next/image/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable'
        }
      ]
    }
  ];
}
```

---

## 성능 모니터링

### 1. Web Vitals 측정

```tsx
'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals(metric => {
    console.log(metric); // { name, value, rating }
    
    // 성능이 안 좋으면 분석 도구로 전송
    if (metric.value > 2500) { // 2.5초 이상
      console.warn(`Performance issue: ${metric.name} = ${metric.value}ms`);
    }
  });
  
  return null;
}
```

### 2. Lighthouse 자동화

```bash
# CI/CD에서 실행
npm install -g lighthouse

lighthouse https://your-site.com --output-path=./lighthouse.html
```

### 3. 성능 목표

| Metric | Goal | Current |
|--------|------|---------|
| LCP | < 2.5s | TBD |
| FID | < 100ms | TBD |
| CLS | < 0.1 | TBD |
| TTI | < 3.8s | TBD |
| FCP | < 1.8s | TBD |

### 4. 분석 도구 통합

```tsx
// Vercel Analytics
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout() {
  return (
    <html>
      <body>
        <Analytics />
      </body>
    </html>
  );
}
```

---

## 구현 체크리스트

### Phase 1 (1-2주)

- [ ] React Compiler 활성화
- [ ] 이미지 포맷 최적화 (AVIF, WebP)
- [ ] 번들 코드 분할 설정
- [ ] next.config.ts 최적화 완료
- [ ] Lighthouse 점수 측정

### Phase 2 (2-3주)

- [ ] Framer Motion 동적 임포트
- [ ] 폰트 로딩 최적화
- [ ] 서버 컴포넌트 비율 증가 (70% 목표)
- [ ] 번들 분석 보고서 작성
- [ ] TTI < 3초 달성

### Phase 3 (3-4주)

- [ ] ISR/캐싱 전략 검증
- [ ] 써드파티 스크립트 최적화
- [ ] 성능 모니터링 자동화
- [ ] Core Web Vitals 최적화
- [ ] Lighthouse 90+ 달성

### 검증

- [ ] 로컬에서 빌드 및 분석
- [ ] 프로덕션에서 실제 성능 측정
- [ ] Devtools에서 성능 프로파일링
- [ ] 다양한 네트워크 환경에서 테스트
- [ ] 모바일 기기에서 테스트

---

## 예상 성능 개선

| 항목 | 현재 | 목표 | 개선율 |
|------|------|------|--------|
| 번들 크기 | ~450KB | ~300KB | 33% ↓ |
| 초기 로드 | ~4.5s | ~2.5s | 44% ↓ |
| TTI | ~5.2s | ~3s | 42% ↓ |
| LCP | ~2.8s | ~1.5s | 46% ↓ |
| Lighthouse | ~75 | ~90+ | +20 |

---

## 참고 자료

- [Next.js 성능 최적화](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [React 컴파일러](https://react.dev/learn/react-compiler)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

**작성일**: 2025-07-04
**버전**: 1.0.0
