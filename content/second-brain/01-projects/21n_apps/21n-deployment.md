---
tags:
  - 21n
  - deployment
---

# 21n — 배포 및 인프라

## Docker Compose Services

| 서비스 | Dockerfile | 포트 | 의존성 |
|--------|-----------|------|--------|
| `admin` | `apps/admin/Dockerfile` | 8002 | api |
| `api` | `apps/api/Dockerfile` | 8000 | postgres, redis |
| `postgres-5431` | PostgreSQL 17 | 5431 | - |
| `redis` | Redis 7 Alpine | 6379 | - |
| `coturn` | TURN/STUN | 3478/5349 | - |

## 환경 변수 (apps/api/.env.production)

```env
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Auth
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# OAuth
GOOGLE_CLIENT_ID=...
KAKAO_CLIENT_ID=...
NAVER_CLIENT_ID=...
FACEBOOK_APP_ID=...
APPLE_CLIENT_ID=...

# Storage
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_BUCKET=...

# Push
EXPO_ACCESS_TOKEN=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

# SMS/Email
NAVER_CLOUD_ACCESS_KEY=...
NAVER_CLOUD_SECRET_KEY=...

# E-signature
MODUSIGN_API_KEY=...
MODUSIGN_API_SECRET=...

# Monitoring
SENTRY_DSN=...

# PII
PII_ENCRYPTION_KEY=...
ALLOW_LEGACY_PHONE_FULL_SCAN=0
```

## 개발 명령어

```bash
# 전체 dev
pnpm dev

# 특정 앱만
pnpm dev:api
pnpm dev:admin
pnpm dev:user

# 빌드
pnpm build

# 테스트
pnpm test:api
pnpm test:api:watch
pnpm test:api:cov
```

## Prisma

```bash
pnpm prisma:generate    # Prisma 클라이언트 생성
pnpm prisma:migrate     # 마이그레이션 실행
pnpm prisma:migrate:reset  # 리셋
pnpm prisma:studio      # DB 스튜디오
pnpm prisma:push        # 스키마 push (dev)
```

## 배포 환경

| 환경 | 구성 |
|------|------|
| Development | Docker Compose (로컬) |
| Staging | EC2 + Docker Compose |
| Production | (TBD: ECS / EKS) |

## 보안

- **CORS**: dev는 all origins, prod는 `CORS_ORIGIN` 제한
- **CSP**: Next.js에서 self + 특정 CDN만 허용
- **X-Frame-Options**: SAMEORIGIN
- **PII 암호화**: AES-256 + HMAC 검색 해시
- **OTP 잠금**: 5회 실패 시 5분 차단
