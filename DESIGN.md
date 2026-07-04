# Toris Blog - Design System

> 인터랙티브하고 모던한 기술 블로그를 위한 포괄적인 디자인 가이드입니다.
> 이 문서는 개발자 친화적이면서도 미니멀하고 고급스러운 사용자 경험을 제공하도록 설계되었습니다.

---

## Table of Contents

1. [디자인 철학](#디자인-철학)
2. [색상 팔레트](#색상-팔레트)
3. [타이포그래피](#타이포그래피)
4. [컴포넌트 가이드](#컴포넌트-가이드)
5. [애니메이션 & 인터랙션](#애니메이션--인터랙션)
6. [접근성 (Accessibility)](#접근성-accessibility)
7. [반응형 디자인](#반응형-디자인)
8. [다크모드 전략](#다크모드-전략)
9. [레이아웃 패턴](#레이아웃-패턴)
10. [성능 고려사항](#성능-고려사항)

---

## 디자인 철학

### 핵심 가치

- **Content First (콘텐츠 우선)**: 블로그 글이 주인공입니다. 모든 UI는 글 읽기를 방해하지 않습니다.
- **Developer-Friendly (개발자 친화적)**: 명확한 정보 계층, 일관된 패턴, 빠른 로딩
- **Minimal & Modern (미니멀 & 모던)**: 불필요한 장식 제거, 깔끔한 라인, 우아한 간격
- **Dark Mode First (다크모드 우선)**: 야간 코딩 작업 시 눈 피로 최소화
- **Interactive & Responsive (인터랙티브 & 반응형)**: 부드러운 애니메이션, 모든 디바이스 지원

### 디자인 패턴

```
Pattern: Newsletter / Content First
├── Hero (Value Prop + Recent Posts)
├── Post List (카테고리별 필터)
├── Search & Navigation
├── Social Proof (조회수, 댓글 수)
└── Call to Action (뉴스레터, 소셜 공유)
```

---

## 색상 팔레트

### 다크모드 (OLED Optimized)

| Role | Hex | CSS Variable | 용도 |
|------|-----|--------------|------|
| **Background** | `#0F172A` | `--color-bg` | 메인 배경 (눈 친화적) |
| **Surface** | `#1E293B` | `--color-surface` | 카드, 패널 배경 |
| **Surface Hover** | `#334155` | `--color-surface-hover` | 호버 상태 |
| **Foreground** | `#F8FAFC` | `--color-fg` | 기본 텍스트 |
| **Foreground Muted** | `#CBD5E1` | `--color-fg-muted` | 보조 텍스트 |
| **Accent (Primary)** | `#22C55E` | `--color-accent` | CTA, 주요 액션 (성공/그린) |
| **Accent Secondary** | `#3B82F6` | `--color-accent-secondary` | 링크, 하이라이트 (블루) |
| **Border** | `#475569` | `--color-border` | 구분선, 테두리 |
| **Border Light** | `#64748B` | `--color-border-light` | 약한 구분선 |
| **Destructive** | `#EF4444` | `--color-destructive` | 삭제, 에러 (레드) |
| **Muted** | `#272F42` | `--color-muted` | 비활성, 드래프트 상태 |

### CSS Variables (root에 추가)

```css
:root {
  /* Dark Mode (Default) */
  --color-bg: #0F172A;
  --color-surface: #1E293B;
  --color-surface-hover: #334155;
  --color-fg: #F8FAFC;
  --color-fg-muted: #CBD5E1;
  --color-accent: #22C55E;
  --color-accent-secondary: #3B82F6;
  --color-border: #475569;
  --color-border-light: #64748B;
  --color-destructive: #EF4444;
  --color-muted: #272F42;
  
  /* Spacing Scale (8dp system) */
  --space-0: 0;
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */
  
  /* Border Radius */
  --radius-sm: 0.25rem; /* 4px - small elements */
  --radius-md: 0.5rem; /* 8px - standard elements */
  --radius-lg: 1rem; /* 16px - cards, buttons */
  --radius-xl: 1.5rem; /* 24px - large components */
  --radius-full: 9999px;
  
  /* Shadows (Dark Mode) */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
  --shadow-glow: 0 0 20px rgba(34, 197, 94, 0.15);
  
  /* Animation */
  --duration-fast: 100ms;
  --duration-base: 150ms;
  --duration-slow: 300ms;
  --easing-ease-out: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-ease-in: cubic-bezier(0.4, 0, 0.6, 1);
  --easing-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```

### 시맨틱 컬러 토큰

```css
/* 상태별 색상 */
--color-success: #22C55E;
--color-warning: #F59E0B;
--color-error: #EF4444;
--color-info: #3B82F6;

/* 콘텐츠 타입별 */
--color-category-archive: #8B5CF6;
--color-category-career: #F59E0B;
--color-category-learning: #3B82F6;
--color-category-personal: #EC4899;
--color-category-projects: #10B981;
```

---

## 타이포그래피

### 폰트 스택

```css
/* Heading Font */
--font-heading: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Body Font */
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Monospace (코드 블록) */
--font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
```

### 타입 스케일

| Level | Size | Weight | Line Height | Letter Spacing | 용도 |
|-------|------|--------|-------------|----------------|------|
| **h1** | 2.5rem (40px) | 700 | 1.2 | -0.02em | 페이지 제목 |
| **h2** | 2rem (32px) | 700 | 1.3 | -0.01em | 섹션 제목 |
| **h3** | 1.5rem (24px) | 600 | 1.4 | 0 | 서브 제목 |
| **h4** | 1.25rem (20px) | 600 | 1.5 | 0 | 카드 제목 |
| **body-lg** | 1.125rem (18px) | 400 | 1.6 | 0 | 포스트 본문 (데스크톱) |
| **body** | 1rem (16px) | 400 | 1.6 | 0 | 기본 텍스트 |
| **body-sm** | 0.875rem (14px) | 400 | 1.5 | 0 | 보조 텍스트 |
| **label** | 0.875rem (14px) | 500 | 1.5 | 0 | 레이블, 태그 |
| **caption** | 0.75rem (12px) | 400 | 1.5 | 0.01em | 메타 정보 (날짜, 조회수) |
| **code** | 0.875rem (14px) | 400 | 1.5 | 0 | 인라인 코드 |

### 구글 폰츠 임포트

```html
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" as="style">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap">
```

---

## 컴포넌트 가이드

### 1. 버튼 (Button)

#### Primary Button

```css
.btn-primary {
  background-color: var(--color-accent);
  color: var(--color-bg);
  padding: 12px 24px;
  border-radius: var(--radius-lg);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-base) var(--easing-ease-out);
  border: none;
}

.btn-primary:hover {
  filter: brightness(1.1);
  box-shadow: var(--shadow-glow);
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

#### Secondary Button

```css
.btn-secondary {
  background-color: var(--color-surface);
  color: var(--color-fg);
  border: 1px solid var(--color-border);
  padding: 12px 24px;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--duration-base) var(--easing-ease-out);
}

.btn-secondary:hover {
  background-color: var(--color-surface-hover);
  border-color: var(--color-border-light);
}
```

### 2. 카드 (Card)

```css
.card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  transition: all var(--duration-slow) var(--easing-ease-out);
  cursor: pointer;
}

.card:hover {
  background-color: var(--color-surface-hover);
  border-color: var(--color-border-light);
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}
```

### 3. 입력 필드 (Input)

```css
.input {
  background-color: var(--color-surface);
  color: var(--color-fg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  font-size: 1rem;
  transition: all var(--duration-base) var(--easing-ease-out);
}

.input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.input::placeholder {
  color: var(--color-fg-muted);
  opacity: 0.7;
}
```

---

## 애니메이션 & 인터랙션

### 핵심 원칙

- **Duration**: 150-300ms (마이크로인터랙션)
- **Easing**: `ease-out` (진입), `ease-in` (퇴장)
- **Motion**: 의미 있는 움직임만
- **Accessibility**: `prefers-reduced-motion` 존중

### 스켈레톤 로딩

```css
@keyframes skeleton-loading {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-muted) 25%,
    var(--color-surface) 50%,
    var(--color-muted) 75%
  );
  background-size: 1000px 100%;
  animation: skeleton-loading 2s infinite;
  border-radius: var(--radius-md);
  min-height: 20px;
}
```

### 페이드 인 애니메이션

```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fade-in var(--duration-slow) var(--easing-ease-out);
}
```

### 슬라이드 업 애니메이션

```css
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-up {
  animation: slide-up var(--duration-slow) var(--easing-ease-out);
}
```

---

## 접근성 (Accessibility)

### 색상 대비 비율

- 본문 텍스트: 4.5:1 이상 (WCAG AA)
- 큰 텍스트: 3:1 이상
- 확인된 조합:
  - `#F8FAFC` on `#0F172A` = **17:1** ✓
  - `#CBD5E1` on `#1E293B` = **7.2:1** ✓
  - `#22C55E` on `#0F172A` = **5.8:1** ✓

### 포커스 상태

```css
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: var(--radius-md);
}
```

### ARIA 속성

```html
<!-- Skip to main content -->
<a href="#main-content" class="sr-only">
  Skip to main content
</a>

<!-- 폼 필드 -->
<label for="search">Search posts</label>
<input id="search" type="search" aria-label="Search posts" />

<!-- 라이브 리전 -->
<div aria-live="polite" role="status">
  Post published successfully!
</div>
```

### Reduced Motion 지원

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 반응형 디자인

### 브레이크포인트

```css
/* Mobile First (< 376px) */
/* Default styles */

/* Tablet (≥768px) */
@media (min-width: 768px) {
  /* iPad, 7-10" 태블릿 */
}

/* Desktop (≥1024px) */
@media (min-width: 1024px) {
  /* 노트북, 데스크톱 */
}

/* Large Desktop (≥1440px) */
@media (min-width: 1440px) {
  /* 대형 모니터 */
}
```

### 그리드 레이아웃

```css
.posts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

@media (min-width: 768px) {
  .posts-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-8);
  }
}

@media (min-width: 1024px) {
  .posts-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

## 다크모드 전략

### CSS 변수 기반 구현

```css
/* Light Mode */
[data-theme="light"] {
  --color-bg: #FFFFFF;
  --color-fg: #0F172A;
  --color-accent: #16A34A;
}

/* Dark Mode */
[data-theme="dark"] {
  --color-bg: #0F172A;
  --color-fg: #F8FAFC;
  --color-accent: #22C55E;
}
```

---

## 성능 고려사항

### 이미지 최적화

```html
<img 
  src="/image.webp" 
  alt="Description"
  loading="lazy"
  width="800"
  height="450"
/>
```

### 폰트 로딩

```css
@font-face {
  font-family: 'Inter';
  font-display: swap; /* FOIT 방지 */
}
```

### 번들 최적화

```typescript
// 동적 임포트
const Component = dynamic(() => import('@/components/Heavy'), {
  loading: () => <Skeleton />,
});
```

---

## 체크리스트

### 구현 전 확인

- [ ] 모든 색상이 CSS 변수로 정의됨
- [ ] 타이포그래피 스케일이 일관됨
- [ ] 포커스 상태가 명확히 표시됨
- [ ] 색상 대비 4.5:1 이상 (WCAG AA)

### 개발 후 검증

- [ ] 375px, 768px, 1024px, 1440px에서 테스트
- [ ] 다크모드/라이트모드 테스트
- [ ] 키보드 네비게이션 테스트
- [ ] Lighthouse 성능 90+ 달성
- [ ] 모바일 가로 모드 테스트

---

**마지막 업데이트**: 2025년 7월 4일
**버전**: 1.0.0
