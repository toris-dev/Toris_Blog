---
tags:
  - toris-blog
  - workflow
---

# Toris_Blog — 개발 워크플로

## 포스트 작성

1. `public/markdown/[category]/` 디렉토리에 `.md` 파일 생성
2. 프론트매터 작성 (YAML 형식):
```yaml
---
title: "포스트 제목"
description: "요약"
category: "카테고리명"
tags: ["태그1", "태그2"]
date: "2024-01-01"
series: "시리즈명"   # 선택
---
```
3. PR 생성 → Vercel Preview 확인 → 머지 → 자동 배포

## 로컬 개발 환경

```bash
# 필수
Node.js 20+
pnpm 9+
MongoDB 연결 (MONGODB_URI)

# 실행
pnpm install
pnpm dev  # http://localhost:8080
```

## Git 커밋 컨벤션

| 타입 | 설명 |
|------|------|
| feat | 새 기능 |
| fix | 버그 수정 |
| refactor | 리팩토링 |
| style | 코드 포맷 |
| docs | 문서 |
| test | 테스트 |
| chore | 설정/의존성 |
| perf | 성능 개선 |

## Code Quality

```bash
# 포맷 + 린트
pnpm format
pnpm lint

# 전체 테스트
pnpm test:all

# 타입 체크
npx tsc --noEmit
```

## 배포 프로세스

1. `main` 브랜치에 PR 머지
2. Vercel GitHub Integration이 자동 감지
3. Preview 배포 (PR) → Production 배포 (main)
4. ISR 캐시는 6시간마다 자동 재검증
5. 긴급 업데이트: `/api/revalidate` POST 호출

## 관련 문서

- [[toris-blog-architecture]]
- [[toris-blog-api]]
- [[toris-blog-deployment]]
