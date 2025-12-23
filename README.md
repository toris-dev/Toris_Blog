# Toris 블로그

Next.js 16과 React 19를 기반으로 한 모던한 기술 블로그입니다. 마크다운 파일 기반의 정적 블로그로, 카테고리별 포스트 관리, 검색 기능, 다크모드, 댓글 시스템 등을 지원합니다.

## 📋 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [실행 방법](#실행-방법)
- [E2E 테스트](#e2e-테스트)
- [성능 최적화](#성능-최적화)
- [개선할 점](#개선할-점)

---

## 🎯 주요 기능

### 페이지 구조

```mermaid
flowchart LR
  Home[메인화면]
  SideBar(사이드바)
  Header(헤더)
  Footer(푸터)
  List[글 목록]
  Detail[글 상세 화면]
  About[소개 페이지]
  Contact[문의 페이지]

  Home --- Header
  Home --- Footer
  Home --- SideBar
  Home --- List
  List -.-> Detail
  SideBar -.-> Detail
  Header -.-> About
  Header -.-> Contact
```

### 핵심 기능

- ✅ **마크다운 기반 블로그**: `public/markdown` 디렉토리의 마크다운 파일을 자동으로 읽어 포스트로 변환
- ✅ **카테고리별 분류**: Archive, Career, Learning, Personal, Projects 등 카테고리별 포스트 관리
- ✅ **검색 기능**: 제목, 설명, 태그 기반 포스트 검색
- ✅ **다크모드**: 사용자 선호도에 따른 라이트/다크 모드 전환
- ✅ **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 기기 지원
- ✅ **SEO 최적화**: 메타 태그, 구조화된 데이터, sitemap, robots.txt, OG 이미지 자동 생성
- ✅ **RSS Feed**: `/feed.xml` 엔드포인트로 RSS 피드 제공
- ✅ **댓글 시스템**: Utterances를 활용한 GitHub 기반 댓글 시스템
- ✅ **공유 기능**: 카카오톡, 트위터, 링크 복사 등 소셜 공유 기능
- ✅ **쿠키 관리**: 사용자 동의 기반 쿠키 관리 및 Google AdSense 통합
- ✅ **성능 모니터링**: Vercel Analytics 및 Speed Insights 통합
- ✅ **접근성 개선**: ARIA 속성, 색상 대비, 링크 접근성 최적화
- ✅ **PWA 지원**: Service Worker를 통한 오프라인 지원

---

## 🛠️ 기술 스택

### Core

- **Next.js 16.0.7** - React 프레임워크 (App Router)
- **React 19.2.1** - UI 라이브러리
- **TypeScript 5.3** - 타입 안정성

### Styling & UI

- **Tailwind CSS** - 유틸리티 기반 CSS 프레임워크
- **Framer Motion** - 애니메이션 라이브러리
- **next-themes** - 다크모드 지원
- **tailwind-merge** - Tailwind 클래스 병합
- **class-variance-authority** - 컴포넌트 변형 관리

### Data & State

- **@tanstack/react-query** - 서버 상태 관리
- **React Hooks** - 클라이언트 상태 관리

### Markdown

- **@uiw/react-md-editor** - 마크다운 에디터
- **@uiw/react-markdown-preview** - 마크다운 프리뷰
- **react-markdown** - 마크다운 렌더링
- **remark-gfm** - GitHub Flavored Markdown 지원
- **rehype-highlight** - 코드 하이라이팅

### Testing

- **Cypress** - E2E 테스트

### Analytics & SEO

- **Vercel Analytics** - 웹 분석 도구
- **Vercel Speed Insights** - 성능 모니터링
- **Google Tag Manager** - 분석 도구
- **Google AdSense** - 광고 수익화 (쿠키 동의 기반)
- **Structured Data** - SEO 구조화된 데이터

### 기타

- **dayjs** - 날짜 처리
- **octokit** - GitHub API 클라이언트 (선택적)
- **react-hot-toast** - 토스트 알림
- **react-intersection-observer** - 스크롤 애니메이션
- **shiki** - 코드 하이라이팅
- **mermaid** - 다이어그램 렌더링

<div style="display:flex; flex-direction:row; gap:0.5rem; flex-wrap:wrap; margin-top:1rem">
    <img src="https://img.shields.io/badge/Next.js-16.0.7-000?logo=nextdotjs&logoColor=fff&style=for-the-badge" />
    <img src="https://img.shields.io/badge/React-19.2.1-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
    <img src="https://img.shields.io/badge/TypeScript-5.3-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
    <img src="https://img.shields.io/badge/reactMarkdown-232F3E?style=for-the-badge&logo=markdown&logoColor=white" />
    <img src="https://img.shields.io/badge/Cypress-200000?style=for-the-badge&logo=cypress&logoColor=#69D3A7" />
    <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
</div>

---

## 📁 프로젝트 구조

```
Toris_Blog/
├── public/
│   └── markdown/          # 마크다운 포스트 파일들
│       ├── Archive/       # 아카이브 카테고리
│       ├── Career/        # 커리어 관련 포스트
│       ├── Design/        # 디자인 관련 포스트
│       ├── Learning/      # 학습 자료
│       ├── Personal/      # 개인 관련 포스트
│       └── Projects/      # 프로젝트 관련 포스트
├── src/
│   ├── app/              # Next.js App Router 페이지
│   │   ├── about/        # 소개 페이지
│   │   ├── contact/      # 문의 페이지
│   │   ├── posts/        # 블로그 포스트 페이지
│   │   │   ├── [id]/     # 포스트 상세 페이지
│   │   │   ├── _components/ # 포스트 관련 컴포넌트
│   │   │   └── page.tsx  # 포스트 목록 페이지
│   │   ├── categories/   # 카테고리별 포스트 페이지
│   │   ├── tags/         # 태그별 포스트 페이지
│   │   ├── api/          # API 라우트
│   │   ├── feed.xml/     # RSS Feed
│   │   ├── layout.tsx    # 루트 레이아웃
│   │   └── page.tsx      # 홈 페이지
│   ├── components/       # React 컴포넌트
│   │   ├── ads/          # 광고 컴포넌트 (AdSense)
│   │   ├── blog/         # 블로그 관련 컴포넌트
│   │   ├── common/       # 공통 컴포넌트 (Header, Footer, CookieConsent 등)
│   │   ├── forms/        # 폼 컴포넌트
│   │   ├── seo/          # SEO 관련 컴포넌트
│   │   └── ui/           # UI 컴포넌트
│   ├── contexts/         # React Context
│   ├── styles/           # 전역 스타일
│   ├── types/            # TypeScript 타입 정의
│   └── utils/            # 유틸리티 함수
├── .cursor/              # Cursor IDE 설정
│   └── rules/            # 마크다운 작성 스타일 가이드
├── cypress/              # E2E 테스트
│   └── e2e/              # 테스트 파일들
└── README.md
```

---

## 🚀 실행 방법

### 1. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 변수들을 설정합니다:

```env
# 선택적: GitHub API 토큰 (마크다운 파일을 GitHub에서 가져올 경우)
GITHUB_TOKEN=your_github_token

# 선택적: 사이트 URL
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# 선택적: Google AdSense Publisher ID
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-xxxxxxxxxxxxx

# 선택적: Google Tag Manager ID
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

### 2. 의존성 설치

```bash
pnpm install
```

### 3. 개발 서버 실행

```bash
pnpm dev
```

개발 서버가 `http://localhost:3000`에서 실행됩니다.

### 4. 프로덕션 빌드

```bash
pnpm build
pnpm start
```

---

## 🧪 E2E 테스트

Cypress를 사용하여 E2E 테스트를 실행할 수 있습니다.

### 테스트 러너 UI 열기 (개발 및 디버깅용)

```bash
pnpm cypress:open
```

### 헤드리스 모드로 모든 테스트 실행 (CI/CD 환경에 적합)

```bash
pnpm cypress:run
```

### 특정 테스트 파일 실행

```bash
# 네비게이션 테스트
pnpm cypress:run:navigation

# 블로그 테스트
pnpm cypress:run:blog

# 반응형 테스트
pnpm cypress:run:responsive

# 검색 테스트
pnpm cypress:run:search
```

### 테스트 파일 목록

- `about.cy.ts` - 소개 페이지 테스트
- `blog.cy.ts` - 블로그 포스트 테스트
- `contact.cy.ts` - 문의 폼 테스트
- `home.cy.ts` - 홈 페이지 테스트
- `navigation.cy.ts` - 네비게이션 테스트
- `responsive.cy.ts` - 반응형 디자인 테스트
- `search.cy.ts` - 검색 기능 테스트

---

## ⚡ 성능 최적화

### Next.js 최적화 기능 활용

- **ISR (Incremental Static Regeneration)**: 포스트 데이터를 6시간마다 재생성
- **Server Components**: 서버 컴포넌트를 활용한 성능 최적화
- **Image Optimization**: Next.js Image 컴포넌트 사용
- **Code Splitting**: 자동 코드 분할

### 웹 성능 지표 (Lighthouse)

- ✅ **LCP (Largest Contentful Paint)** 최적화
- ✅ **CLS (Cumulative Layout Shift)** 최소화
- ✅ **FID (First Input Delay)** 개선
- ✅ **접근성 (Accessibility)** 개선
  - ARIA 속성 최적화
  - 색상 대비 비율 개선
  - 링크 접근성 향상

### 트러블슈팅

웹 애플리케이션을 잘 만들기 위해 다음을 신경써야 합니다:

- **LCP**: 초기 로딩 성능 최적화
- **CLS**: 레이아웃 시프트 방지
- **FID**: 인터랙션 응답성 개선
- **Next.js 렌더링 전략**: SSR, SSG, ISR을 효율적으로 사용

---

## 📝 개선할 점

### 계획된 기능

- [ ] 플립 효과 (앞: 제목, 카테고리, 태그 / 뒤: 본문)
- [ ] 비회원 댓글 기능 구현 (CRUD)
  - 작성 시 ID, PWD 입력
  - 수정, 삭제 시 입력했던 ID, PWD 확인
- [ ] 방명록 기능 구현 (CR)
  - 작성 시 닉네임만 작성
  - 삭제, 수정 불가
- [ ] 실시간 채팅 구현
- [ ] 다국어 지원 (i18n)

### 완료된 개선 사항

- [x] 적절한 캐싱 작업
- [x] 접근성 개선 (ARIA 속성, 색상 대비, 링크 접근성)
- [x] SEO 최적화 (메타 태그, 구조화된 데이터, OG 이미지 자동 생성)
- [x] E2E 테스트 강화
- [x] 댓글 시스템 (Utterances) 통합
- [x] 소셜 공유 기능 (카카오톡, 트위터, 링크 복사)
- [x] 쿠키 관리 및 Google AdSense 통합
- [x] Vercel Analytics 및 Speed Insights 통합
- [x] PWA 지원 (Service Worker)
- [x] 마크다운 작성 스타일 가이드 통일 (.cursor/rules)

---

## 📅 최근 변경 사항

### 2025년 12월

- **Next.js 16 업그레이드**: 최신 버전으로 업그레이드
- **댓글 시스템**: Utterances를 활용한 GitHub 기반 댓글 시스템 통합
- **소셜 공유**: 카카오톡, 트위터, 링크 복사 기능 추가
- **쿠키 관리**: 사용자 동의 기반 쿠키 관리 시스템 구현
- **Google AdSense**: 쿠키 동의 기반 광고 통합
- **성능 모니터링**: Vercel Analytics 및 Speed Insights 통합
- **PWA 지원**: Service Worker를 통한 오프라인 지원
- **마크다운 스타일 통일**: `.cursor/rules/toris-markdown-style.md` 가이드 작성 및 모든 마크다운 파일 스타일 통일
- **면접 질문 정리**: JavaScript와 알고리즘 기초 개념 정리 포스팅 추가

### 2025년 1월

- **접근성 개선**: Lighthouse 경고 해결
  - 금지된 ARIA 속성 수정
  - 색상 대비 비율 개선
  - 링크 접근성 향상
- **프로젝트 구조 개선**: 마크다운 기반 블로그로 전환
- **E2E 테스트 강화**: Cypress 테스트 코드 업데이트

### 2024년 7월 12일

- **기능 제거 및 구조 개선**:
  - 기존 포트폴리오, 관리자, 방명록, 인증 관련 기능 제거
  - 마크다운 콘텐츠 구조 재정비
  - `public/markdown` 디렉토리 아래 카테고리별 디렉토리 도입
- **E2E 테스트 강화**:
  - Cypress를 사용한 주요 페이지 및 기능 테스트 코드 업데이트

---

## 📄 라이선스

이 프로젝트는 개인 프로젝트입니다.

---

## 👤 작성자

**토리스 (Toris)**

- GitHub: [@toris-dev](https://github.com/toris-dev)
- 블로그: [Toris Blog](https://toris-blog.vercel.app)

## 📚 마크다운 작성 가이드

프로젝트의 모든 마크다운 파일은 `.cursor/rules/toris-markdown-style.md` 가이드를 따릅니다.

- **1년차 개발자 관점** 유지
- **개인적 경험과 감정 표현** 포함
- **초보자도 이해할 수 있도록** 설명
- **실무에서 바로 활용 가능한** 내용
- **솔직하고 친근한 톤** 사용

카테고리별 작성 가이드:

- **Projects**: 프로젝트 리뷰 형식 (처음 접했을 때 → 어려웠던 점 → 해결 방법 → 배운 점)
- **Learning**: 개념 설명 중심, 코드 예제와 실무 팁
- **Career**: 실무 중심, 알고리즘/코딩테스트 관련

---

![Visitor Count](https://visitor-badge.laobi.icu/badge?page_id=toris-dev.toris-blog)
