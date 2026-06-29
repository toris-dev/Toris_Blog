---
tags:
  - toris-blog
  - architecture
---

# Toris_Blog — 아키텍처

## 프로젝트 구조

```
Toris_Blog/
├── public/
│   └── markdown/          # 블로그 포스트 마크다운 파일 (카테고리별)
├── src/
│   ├── app/               # Next.js App Router (pages + API routes)
│   │   ├── api/           # API 엔드포인트
│   │   ├── posts/         # 블로그 포스트 페이지
│   │   ├── categories/    # 카테고리별 페이지
│   │   ├── tags/          # 태그별 페이지
│   │   ├── about/         # 소개 페이지
│   │   ├── contact/       # 연락처 페이지
│   │   ├── guestbook/     # 방명록 페이지
│   │   ├── bookmarks/     # 북마크 페이지
│   │   ├── todos/         # Todo 페이지
│   │   ├── offline/       # 오프라인 페이지
│   │   ├── feed.xml/      # RSS 피드
│   │   ├── layout.tsx     # 루트 레이아웃
│   │   └── page.tsx       # 홈 페이지
│   ├── components/        # React 컴포넌트
│   │   ├── blog/          # 포스트 관련 컴포넌트
│   │   ├── common/        # Header, Footer, Sidebar, Providers
│   │   ├── home/          # 홈 페이지 컴포넌트
│   │   ├── ui/            # 공통 UI 컴포넌트
│   │   ├── search/        # 검색 관련
│   │   ├── todos/         # Todo 관련
│   │   └── ...            # guestbook, bookmarks, forms, etc.
│   ├── contexts/          # React Context
│   │   ├── PostHeadingsContext.tsx  # TOC 목차 관리
│   │   ├── TodoContext.tsx          # Todo CRUD
│   │   └── WalletContext.tsx        # 이더리움 지갑 연결
│   ├── hooks/             # Custom hooks
│   │   ├── useBookmark.ts
│   │   ├── usePostLike.ts
│   │   └── useTodos.ts
│   ├── lib/
│   │   └── mongodb.ts     # MongoDB 연결 (DNS SRV 우회)
│   ├── models/            # Mongoose 스키마
│   │   ├── Comment.ts
│   │   ├── Guestbook.ts
│   │   ├── PostLike.ts
│   │   ├── PostView.ts
│   │   └── Todo.ts
│   ├── types/             # TypeScript 타입 정의
│   ├── utils/             # 유틸리티 함수
│   └── styles/            # 전역 CSS + 마크다운 스타일
├── cypress/               # E2E 테스트
└── src/__tests__/         # 단위 테스트
```

## 데이터 흐름

### 블로그 포스트 (파일 기반 CMS)

```
public/markdown/[category]/*.md
       │ parseFrontmatter() + createSlug()
       ▼
src/utils/markdown.ts → getPostData()
       │ React.cache() + unstable_cache() (ISR, 6h)
       ▼
Server Components 직접 소비
  ├── 페이지 (RSC) : getPostData() 직접 호출
  ├── API (/api/posts) : JSON 반환
  └── RSS/Sitemap : fetch.ts 경유
```

### 댓글 (MongoDB)

```
클라이언트 → POST /api/comments → validate → bcrypt → Comment.create()
클라이언트 → GET /api/comments → Comment.find().sort().skip/limit
```

### 좋아요/조회수 (이중 중복 방지)

- **클라이언트**: localStorage 체크 (24h 쿨다운)
- **서버**: IP 기반 중복 방지 (`x-forwarded-for` / `x-real-ip`)
- **API**: `$inc` atomic update

## 라우팅 구조

| 구분 | 페이지 | 렌더링 전략 |
|------|--------|------------|
| `/` | 홈 | ISR (21600s) |
| `/posts` | 포스트 목록 | ISR |
| `/posts/[id]` | 포스트 상세 | ISR + generateStaticParams |
| `/categories/[name]` | 카테고리별 | ISR + generateStaticParams |
| `/tags/[tag]` | 태그별 | ISR + generateStaticParams |
| `/about` | 소개 | Client |
| `/contact` | 연락처 | Client |
| `/guestbook` | 방명록 | Client |
| `/bookmarks` | 북마크 | Client |
| `/todos` | Todo | Server → Client Child |
| `/offline` | 오프라인 | Client (PWA) |

## 주요 결정 사항

1. **파일 기반 CMS**: 마크다운 파일을 FS에서 직접 읽어 빌드/요청 시점에 파싱
2. **이중 캐싱 전략**: `React.cache()` (요청 중복 제거) + `next/unstable_cache` (ISR 6h TTL)
3. **서버 컴포넌트 우선**: 필요할 때만 'use client' 마크
4. **비밀번호 보호 댓글**: bcrypt 해시로 수정/삭제 인증 (서버 전용)
5. **IP 기반 중복 방지**: 좋아요/조회수 조작 방지
6. **이더리움 지갑 인증**: Todo 쓰기 권한 제어 (`NEXT_PUBLIC_AUTHORIZED_ADDRESSES`)
7. **GitHub Issue 연동**: 연락처 폼 → GitHub Issue 댓글 (별도 SMTP 불필요)
8. **MongoDB DNS SRV 우회**: Windows DNS 이슈 대응 (SRV 레코드 수동 해석)
