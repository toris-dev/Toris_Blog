---
tags:
  - 21n
  - workflow
---

# 21n — 개발 워크플로

## 로컬 개발 환경

### 필수 조건

```bash
Node.js 20+
pnpm 9+
Docker Desktop (PostgreSQL + Redis)
Ollama (선택, AI 기능)
```

### 시작하기

```bash
# 의존성 설치
pnpm install

# DB 및 Redis 실행
docker compose up -d postgres-5431 redis

# Prisma 클라이언트 생성
pnpm prisma:generate

# 마이그레이션
pnpm prisma:migrate

# 개발 서버 실행
pnpm dev
```

## 코드 컨벤션

### TypeScript
- `strict: true`, `any` 사용 금지
- `import type` 사용 (`@typescript-eslint/consistent-type-imports`)
- NonNull 단언(`!`) 최소화, 타입 가드 선호
- Prettier: semi, singleQuote: false, printWidth: 100

### FSD 의존성
```
app/pages → features → entities → shared
```
역방향 import 절대 금지.

### Git 커밋 컨벤션

| type | 이모지 | 용도 |
|------|--------|------|
| feat | ✨ | 새 기능 |
| fix | 🐛 | 버그 수정 |
| refactor | ♻️ | 리팩토링 |
| perf | ⚡ | 성능 개선 |
| test | ✅ | 테스트 |
| docs | 📝 | 문서 |
| chore | 🔧 | 설정/의존성 |
| style | 🎨 | 코드 포맷 |
| revert | ⏪ | 되돌리기 |

scope: `admin`, `api`, `user-app`, `db`, `ui`, `trpc`, `ci`, `infra`

### 자동화 훅

| 환경 | 이벤트 | 동작 |
|------|--------|------|
| Claude Code | Edit/Write | `pnpm format --write` + `eslint --fix` |
| Claude Code | Stop | `tsc --noEmit` (변경 워크스페이스) |
| Cursor | afterFileEdit | `pnpm format` + `pnpm lint` |

## 아키텍처 원칙

1. **NestJS Service에서만 Prisma 직접 호출** (Controller/tRPC는 Service 호출)
2. **tRPC 경유 API**: REST 직접 호출 금지 (인증/OAuth/파일 업로드 제외)
3. **Prisma는 `PrismaService` (Global Module)**로만 접근
4. **모든 엔티티 soft delete** (`deletedAt`)
5. **PII는 AES-256 암호화 + HMAC 검색 해시** 저장

## 배포 파이프라인

1. PR 생성 → GitHub Actions (lint + test + build)
2. Docker 이미지 빌드 → 레지스트리 푸시
3. EC2 배포 (staging) → 승인 후 production
4. Terraform 인프라 관리 (`apps/infra/terraform/`)
