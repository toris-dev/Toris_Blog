---
tags:
  - 21n
  - architecture
---

# 21n — 아키텍처

## 앱별 구조

### API (apps/api) — NestJS + tRPC

```
apps/api/src/
├── main.ts                  # Bootstrap (Express + tRPC + Swagger + Sentry)
├── app.module.ts            # 30+ 모듈 import
├── auth/                    # Auth 컨트롤러 (login, register, OAuth, 2FA, password-reset)
├── trpc/
│   ├── routers/             # model / hospitalAdmin / admin 3개 네임스페이스
│   └── procedures.ts        # 인증 레벨별 procedure (public, protected, admin, ...)
├── modules/                 # 도메인별 NestJS 모듈
│   ├── users/
│   ├── hospitals/
│   ├── contracts/
│   ├── engagements/
│   ├── missions/
│   ├── reviews/
│   └── ... (30+ 모듈)
├── common/
│   ├── guards/              # JwtAuthGuard, RolesGuard, ThrottlerGuard
│   ├── decorators/          # @Public(), @CurrentUser(), @Roles()
│   ├── filters/             # HttpExceptionFilter, SentryGlobalFilter
│   └── pipes/               # ValidationPipe
└── prisma/
    └── prisma.service.ts    # PrismaClient wrapper (global module)
```

**API 레이어 구분:**

```
NestJS Controller  ──→  NestJS Service  ──→  PrismaService
     │                         │
     ▼                         ▼
  REST (/auth, /client/*, /admin/*, /hospital-admin/*)
     │
tRPC Router ──→  Service Port (adapter) ──→  같은 NestJS Service
  (/api/trpc)
```

### Admin (apps/admin) — Next.js 16 App Router

```
apps/admin/src/
├── app/                     # App Router pages + layouts
│   ├── (public)/            # /login, /apply, /legal, /unauthorized
│   ├── admin/               # SUPER_ADMIN 영역
│   ├── hospital-admin/      # HOSPITAL_ADMIN 영역
│   └── proxy.ts             # Next.js 미들웨어 (인증 + 리디렉트)
├── features/                # FSD features (17개)
│   ├── auth/
│   ├── dashboard/
│   ├── contracts/
│   ├── hospitals/
│   ├── models/
│   └── ...
├── entities/                # FSD entities (18개)
├── widgets/                 # header, sidebar
├── shared/                  # 공통 UI, API, hooks
└── trpc/                    # tRPC 클라이언트 설정
```

### User-App (apps/user-app) — Expo Router

```
apps/user-app/src/
├── app/                     # Expo Router (파일 기반 라우팅)
│   ├── (model)/(tabs)/      # 모델 탭 (home, calendar, hospital, profile, contract)
│   ├── (hospital-admin)/(tabs)/  # 병원 관리자 탭
│   ├── login.tsx
│   ├── signup/
│   └── ...
├── features/                # FSD features (25개)
├── entities/                # FSD entities (20개)
├── shared/                  # 공통 (api, constants, hooks, stores, ui)
├── trpc/                    # tRPC 클라이언트
├── screens/                 # 화면 단위 컴포넌트
└── bootstrap/               # 앱 초기화 (폰트, 네비게이션, 프로바이더)
```

## FSD (Feature-Sliced Design) 의존성 규칙

```
app/pages → features → entities → shared
```

- **절대 역방향 import 금지**
- 각 feature는 `ui/`, `model/`, `api/` 서브 디렉토리로 구성

## tRPC 네임스페이스

| 네임스페이스 | 대상 클라이언트 | 인증 레벨 |
|-------------|---------------|-----------|
| `model` | User-App (모바일) | USER |
| `hospitalAdmin` | Admin Web (병원) | HOSPITAL_ADMIN |
| `admin` | Admin Web (통합) | SUPER_ADMIN |

## 인증 흐름

### 일반 사용자 로그인
1. `POST /auth/login` (email/password)
2. → JWT 액세스 토큰 (1h) + 리프레시 토큰 (14d)
3. 리프레시 토큰은 SHA256 해시로 저장, 매 사용마다 로테이션

### 관리자 로그인
1. `POST /auth/admin/login` → 2FA 챌린지
2. 처음이면 `GET /auth/2fa/setup` → QR 코드
3. `POST /auth/2fa/confirm` → TOTP 활성화
4. `POST /auth/verify-otp` → OTP 검증 → 토큰 발급

### OAuth (모바일)
- Google id_token 직접 검증
- Kakao/Instagram access_token 검증
- 네이티브 SDK → 서버 검증

## 계약/전자서명 흐름

1. 병원 입점 신청 → 승인
2. 계약 생성 (Modusign 문서 생성)
3. 참여자 서명 (Modusign 위젯)
4. 서명 완료 → 서명된 PDF 저장 + 문서 해시 체인
5. 계약 기간 시작 → 미션/리뷰/인스펙션 워크플로
