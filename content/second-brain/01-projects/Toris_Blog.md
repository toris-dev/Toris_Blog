---
tags:
  - project
status: active
phase: production
repo: Toris_Blog/
aliases:
  - Toris Blog
  - torisdev blog
---

# Toris_Blog

개인 기술 블로그 (Next.js 16 / MongoDB / Vercel).

## 링크

- GitHub: [toris-dev/Toris_Blog](https://github.com/toris-dev/Toris_Blog) (private)
- 코드: `Toris_Blog/`
- **문서 허브**: `docs/01-projects/Toris_Blog/`

## 단계

- [x] [[Planning]] — 기술 스택 선정, 요구사항 정의
- [x] [[Development]] — 설계 및 구현 완료
- [x] [[Testing]] — Jest 단위 테스트 + Cypress E2E
- [x] [[Deployment]] — Vercel 배포 완료

## 핵심 문서 (빠른 이동)

| 영역 | 문서 |
|------|------|
| 아키텍처 | [[toris-blog-architecture]] |
| 설정/배포 | [[toris-blog-deployment]] |
| 개발 워크플로 | [[toris-blog-dev-workflow]] |
| API 명세 | [[toris-blog-api]] |
| 제2의 뇌 | [[toris-blog-second-brain]] · `docs/second-brain/` |

## 제2의 뇌 (Second Brain)

`second-brain/knowledge/` 마크다운 + **Cursor · Claude · Codex** 클라우드 AI.

- Cursor: `@second-brain/knowledge` 멘션 또는 채팅으로 경험 질문
- 프롬프트: `second-brain/prompts/ask-toris.md`

## 기술 스택

| 계층 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| 언어 | TypeScript 5.3 + React 19 |
| 스타일링 | Tailwind CSS 3.3 + next-themes (light/dark/cyberpunk) |
| DB | MongoDB Atlas (Mongoose 9) |
| 상태 관리 | TanStack React Query 5 + Context |
| 마크다운 | react-markdown + Shiki (코드 하이라이트) |
| 테스트 | Jest + RTL (unit) / Cypress (E2E) |
| 배포 | Vercel (ISR) |
| 분석 | Vercel Analytics + GA + Speed Insights |
| PWA | Service Worker + 오프라인 페이지 |

## 기능 (요약)

| 기능 | 상태 | 설명 |
|------|------|------|
| 블로그 포스트 (마크다운) | ✅ | 파일 기반 CMS (public/markdown/) |
| 댓글 시스템 | ✅ | 비밀번호 보호, bcrypt 인증 |
| 좋아요/조회수 | ✅ | IP 기반 중복 방지 + localStorage |
| 검색 | ✅ | 실시간 검색 + 히스토리 |
| 카테고리/태그 | ✅ | 동적 라우팅 |
| 방명록 | ✅ | MongoDB 저장 |
| Todo 관리 | ✅ | 지갑 인증 (ethers.js) |
| 다크모드/사이버펑크 | ✅ | 3가지 테마 |
| RSS 피드 | ✅ | feed.xml 동적 생성 |
| OG 이미지 | ✅ | Edge Runtime 동적 생성 |
| 연락처 폼 | ✅ | GitHub Issue 연동 |
| 반응형 | ✅ | 모바일/태블릿/데스크톱 |
| 접근성 | ✅ | SEO, sitemap, robots.txt |

## 결정 로그

| 날짜 | 결정 | 이유 |
|------|------|------|
| 2024 | 파일 기반 CMS 채택 | 외부 CMS 없이 Git으로 콘텐츠 관리 |
| 2024 | ISR + React.cache 이중 캐싱 | SSG 속도 + 콘텐츠 신선도 유지 |
| 2024 | IP 기반 중복 방지 | 투표/조회수 변조 방지 |
| 2024 | GitHub Issue 연락처 | 별도 이메일 서비스 불필요 |
