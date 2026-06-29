---
tags:
  - 21n
  - api
---

# 21n — API 명세

## REST 엔드포인트

글로벌 prefix: `/api`

### Auth (`/api/auth`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/auth/login` | 이메일/비밀번호 로그인 |
| POST | `/auth/admin/login` | 관리자 로그인 (2FA) |
| POST | `/auth/verify-otp` | TOTP OTP 검증 |
| GET | `/auth/2fa/setup` | 2FA QR 코드 설정 |
| POST | `/auth/2fa/confirm` | 2FA 설정 확인 |
| POST | `/auth/2fa/reset-target` | 관리자 2FA 초기화 (SUPER_ADMIN) |
| POST | `/auth/signup/email/send-code` | 이메일 인증코드 발송 |
| POST | `/auth/signup/email/verify-code` | 이메일 인증코드 검증 |
| POST | `/auth/register` | 회원가입 |
| POST | `/auth/phone/send-code` | SMS 인증코드 발송 |
| POST | `/auth/phone/verify-code` | SMS 인증코드 검증 |
| POST | `/auth/password-reset/*` | 비밀번호 재설정 (이메일/전화) |
| POST | `/auth/refresh` | 토큰 갱신 |
| POST | `/auth/logout` | 로그아웃 |
| GET | `/auth/me` | 내 정보 조회 |
| POST | `/auth/change-password` | 비밀번호 변경 |
| POST | `/auth/withdraw` | 회원 탈퇴 |
| POST | `/auth/oauth/verify-id-token` | OAuth 토큰 검증 (모바일) |

### OAuth Callbacks (`/api/auth/oauth`)

- Google, Kakao, Naver, Facebook

### 기타 REST prefix

| Prefix | 대상 | 용도 |
|--------|------|------|
| `/client/*` | 모바일 앱 | 사용자 API |
| `/hospital-admin/*` | 병원 관리자 웹 | 병원 관리 API |
| `/admin/*` | 통합 관리자 웹 | 슈퍼 관리자 API |

## tRPC API

Mount: `/api/trpc` (Express adapter, JWT Bearer 인증)

### model 네임스페이스 (모바일 앱)

25개 서브 라우터:
- contracts, hospitals, missions, modelWanted, notifications, schedules, users
- manuscripts, reviews, platformNotices, platformPopups, platformTerms
- support, interviews, hospitalApplication, modusign, instagram
- files, categories, snsConnections, preOpChecklist, engagements
- appVersion, platformAds

### hospitalAdmin 네임스페이스 (병원 관리자 웹)

15개 서브 라우터:
- dashboard, missions, contracts, hospital, inspections, reviews, users
- modusign, modelNoShowPenalties, categories, inbox, interviewSessions
- modelWanted, engagements, masterContract

### admin 네임스페이스 (통합 관리자 웹)

19개 서브 라우터:
- dashboard, contracts, hospital, inspections, modelNoShowPenalties
- modelWanted, reviews, hospitalApplications, support, platformNotices
- platformPopups, platformTerms, platformConfig, platformAds
- notifications, missions, categories, users

## tRPC Procedure 권한

| Procedure | 접근 가능 |
|-----------|-----------|
| `publicProcedure` | 모두 |
| `protectedProcedure` | 인증된 모든 사용자 |
| `adminProcedure` | SUPER_ADMIN or HOSPITAL_ADMIN |
| `superAdminProcedure` | SUPER_ADMIN 전용 |
| `hospitalAdminProcedure` | HOSPITAL_ADMIN 전용 |
| `clientUserProcedure` | USER 전용 |
| `clientAppUserProcedure` | USER or HOSPITAL_ADMIN |
| `adminWebUserProcedure` | SUPER_ADMIN or HOSPITAL_ADMIN |

## 글로벌 미들웨어

| 미들웨어 | 설명 |
|----------|------|
| `ThrottlerGuard` | Rate limiting (3 tiers: 120/min, 5/min strict, 30/min moderate) |
| `JwtAuthGuard` | JWT 검증 (@Public() 데코레이터로 면제) |
| `RolesGuard` | 역할 기반 접근 제어 |
| `ValidationPipe` | whitelist, forbidNonWhitelisted, transform |
| `HttpExceptionFilter` | 에러 포맷팅 |
| `SentryGlobalFilter` | Sentry 에러 트래킹 (production) |

## 인증 흐름 상세

### 로그인
1. 일반 사용자: `POST /auth/login` → 즉시 토큰 발급
2. 병원 관리자: `POST /auth/login` → 2FA 챌린지 (QR 설정 또는 OTP 입력)
3. 슈퍼 관리자: `POST /auth/admin/login` → 2FA 필수
4. OTP 5회 실패 → 5분 잠금

### 토큰
- **Access Token**: JWT, 1시간 만료, `JWT_SECRET` 서명
- **Refresh Token**: Random 32-byte, SHA256 저장, 14일 만료, 매 사용 로테이션
- **Device Binding**: refresh token에 deviceId/deviceName 저장

### 회원가입 흐름
1. 이메일 인증코드 발송 → 검증 → emailVerificationToken (JWT, 30분)
2. (선택) 전화 인증 → phoneVerificationToken
3. `POST /auth/register` → 계정 생성

### 탈퇴
- Soft delete (deletedAt) + PII 마스킹
- 6개월 후 hard delete 예약 (scheduledHardDeleteAt)
