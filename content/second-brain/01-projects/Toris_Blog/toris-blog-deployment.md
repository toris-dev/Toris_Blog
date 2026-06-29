---
tags:
  - toris-blog
  - deployment
---

# Toris_Blog — 배포 및 설정

## 배포 환경

| 항목 | 내용 |
|------|------|
| 호스팅 | Vercel (Pro) |
| DB | MongoDB Atlas (M10+ 클러스터) |
| 도메인 | toris.dev (Vercel DNS) |
| CI/CD | GitHub → Vercel 자동 배포 |

## 환경 변수

```env
# MongoDB
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=torisblog
MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1

# GitHub (연락처 폼)
GITHUB_TOKEN=ghp_...

# 지갑 인증 (Todo)
NEXT_PUBLIC_AUTHORIZED_ADDRESSES=0x...

# 분석
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_VERCEL_ANALYTICS=1
```

## 빌드 명령어

```bash
# 개발 서버 (port 8080)
pnpm dev

# 프로덕션 빌드
pnpm build

# 번들 분석
ANALYZE=true pnpm build

# lint
pnpm lint
pnpm lint:fix

# 포맷
pnpm format
pnpm format:check
```

## 테스트

```bash
# 단위 테스트 (Jest)
pnpm test
pnpm test:watch
pnpm test:coverage

# E2E 테스트 (Cypress)
pnpm cypress:open    # 대화형 모드
pnpm cypress:run     # 헤드리스

# 특정 E2E 스펙
pnpm cypress:run:navigation
pnpm cypress:run:blog
pnpm cypress:run:responsive
pnpm cypress:run:search
pnpm cypress:run:portfolio
pnpm cypress:run:design-system
```

## next.config.ts 주요 설정

- 번들 분석기 (`@next/bundle-analyzer`) — `ANALYZE=true` 활성화
- Turbopack 커스텀 리졸브 익스텐션/규칙
- 이미지 리모트 패턴: Supabase, Daum, GitHub 아바타
- React Strict Mode
- Stale time: dynamic 30s

## ISR 캐시

| 캐시 전략 | 적용 대상 | TTL |
|-----------|----------|-----|
| unstable_cache | 모든 정적 페이지 | 21,600초 (6시간) |
| React.cache | 동일 요청 내 중복 방지 | 요청 단위 |
| Tags | 포스트 업데이트 시 수동 재검증 | `/api/revalidate` |

## PWA

- Service Worker 등록 → 오프라인 페이지 (`/offline`) 제공
- Cookie Consent 게이트로 GA/AdSense 동의 기반 로드
