---
tags:
  - project
status: active
phase: development
repo: 21n_apps/
aliases:
  - 21n
  - 예쁜계약
  - 21n-app
---

# 21n_apps

성형외과 플랫폼 "예쁜계약" — Turborepo 모노레포 (NestJS / Next.js 16 / React Native / Prisma).

## 링크

- GitHub: [toris-dev/21n_apps](https://github.com/toris-dev/21n_apps) (private)
- 코드: `21n_apps/`
- **문서 허브**: `docs/01-projects/21n_apps/`

## 단계

- [x] [[Planning]] — 기획, 요구사항
- [x] [[Design]] — FSD 아키텍처, DB 스키마, API 설계
- [x] [[Development]] — API / Admin / User-App 구현 중
- [ ] [[Testing]] — API 테스트 진행 중
- [ ] [[Deployment]] — Docker 기반 배포 준비 중

## 핵심 문서 (빠른 이동)

| 영역 | 문서 |
|------|------|
| 아키텍처 | [[21n-architecture]] |
| DB 스키마 | [[21n-database]] |
| API 명세 | [[21n-api]] |
| 배포/인프라 | [[21n-deployment]] |
| 개발 워크플로 | [[21n-dev-workflow]] |

## 프로젝트 구조

```
21n_apps/
├── apps/
│   ├── api/          # NestJS + tRPC (백엔드)
│   ├── admin/        # Next.js 16 (관리자 웹)
│   ├── user-app/     # Expo (사용자 모바일 앱)
│   └── infra/        # Terraform (인프라)
├── packages/
│   ├── database/     # Prisma 스키마 + 클라이언트
│   ├── trpc/         # tRPC 라우터 정의
│   ├── types/        # 공유 타입
│   └── admin-ui/     # 관리자 UI 컴포넌트 (Radix 기반)
```

## 기술 스택

| 앱 | 스택 |
|----|------|
| **api** | NestJS 10, tRPC 11, Prisma 7, PostgreSQL, Redis, Passport (JWT/OAuth), Sentry |
| **admin** | Next.js 16, React 19, Tailwind 4, Radix UI, tRPC Client, TanStack Query |
| **user-app** | Expo SDK 55, NativeWind 5, Expo Router, tRPC Client, Zustand, Naver Maps, Daily.co |
| **database** | Prisma, PostgreSQL 17 |
| **infra** | Docker Compose, Terraform, Nginx, coturn (TURN/STUN) |

## 기능 (요약)

| 기능 | 상태 | 설명 |
|------|------|------|
| 회원가입/로그인 | ✅ | 이메일, OAuth (Google/Kakao/Naver/Facebook/Apple) |
| 2FA | ✅ | TOTP 기반 2단계 인증 |
| 병원 신청/심사 | ✅ | 병원 입점 신청 워크플로 |
| 계약 전자서명 | ✅ | Modusign 연동 |
| 수술 후 리뷰 | ✅ | SNS 연동 리뷰, 인스펙션 |
| 미션 관리 | ✅ | 리뷰/원고/사진/영상 미션 |
| 화상 인터뷰 | ✅ | Daily.co WebRTC + coturn TURN |
| 알림 (푸시) | ✅ | FCM + 카카오 알림톡 |
| 모델 모집 | ✅ | 모델 프로필/지원/매칭 |
| 수술 전 체크리스트 | ✅ | 동적 폼 |
| 플랫폼 공지/팝업 | ✅ | 관리자 콘텐츠 관리 |
