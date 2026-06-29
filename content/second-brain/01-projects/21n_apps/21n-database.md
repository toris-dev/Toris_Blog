---
tags:
  - 21n
  - database
---

# 21n — 데이터베이스 스키마

## 개요

- **ORM**: Prisma 7 (`@21n/database` 패키지)
- **DB**: PostgreSQL 17
- **연결**: `@prisma/adapter-pg`
- **클라이언트**: `PrismaService` (NestJS Global Module)

## 주요 모델

### 사용자/인증

| 모델 | 설명 | 주요 필드 |
|------|------|-----------|
| `User` | 사용자 계정 | email, role (USER/HOSPITAL_ADMIN/SUPER_ADMIN), totpSecret, deletedAt (soft delete) |
| `Profile` | 사용자 프로필 (1:1) | name, nickname, phone, gender, birthDate, profileImageUrl |
| `Account` | OAuth 계정 | provider, providerAccountId (unique: [provider, providerAccountId]) |
| `RefreshToken` | 리프레시 토큰 | tokenHash, deviceId, expiresAt, rotatedAt |
| `PushToken` | 푸시 토큰 | token, deviceId, platform |

### 병원

| 모델 | 설명 |
|------|------|
| `Hospital` | 병원 정보 (name, address, businessNumber, directorVideoUrl, hashtags) |
| `HospitalDoctor` | 병원 의사 |
| `HospitalDoctorSubCategory` | 의사-시술 카테고리 N:M |
| `HospitalApplication` | 병원 입점 신청 (status 워크플로, 계약 PDF, Modusign) |
| `HospitalReview` | 병원 리뷰 (1 user 1 review per hospital) |

### 계약/전자서명

| 모델 | 설명 |
|------|------|
| `Contract` | 계약 (type, surgeryDate, modelDisclosureType, modusign fields) |
| `ContractSignature` | 서명자별 서명 (timestamped) |
| `ContractSignArea` | PDF 서명 필드 좌표 |
| `EsignSession` | 전자서명 세션 (Naver/Kakao/Toss/Modusign) |
| `EsignWebhookEvent` | 웹훅 멱등성 처리 |

### 업무(Engagement)

| 모델 | 설명 |
|------|------|
| `Engagement` | 병원-모델 업무 브릿지 (sourceType, kind, status, interviewStatus, procedureStatus) |

### 미션/리뷰

| 모델 | 설명 |
|------|------|
| `Mission` | 리뷰 미션 (type, status, roundNumber, snsPlatform) |
| `Review` | 수술 후 리뷰 (snsPostUrl, plasticSurgeryReviewPlatform) |
| `ReviewMedia` | 리뷰 첨부파일 (정규화) |
| `Manuscript` | 원고 제출 |
| `Inspection` | 검수 워크플로 (PENDING/APPROVED/REJECTED) |

### 기타

| 모델 | 설명 |
|------|------|
| `Schedule` | 일정 (dDayCount, callSessionId) |
| `Notification` | 알림 (read tracking, deep link) |
| `CallSession` | 화상 통화 세션 (Daily.co) |
| `ModelWantedProfile` | 모델 모집 프로필 |
| `PreOpChecklistTemplate` | 수술 전 체크리스트 템플릿 |
| `PlatformNotice` | 플랫폼 공지 |
| `PlatformPopup` | 앱 내 팝업 |
| `PlatformTerm` | 약관 (버전 관리) |
| `SupportConversation` | 고객센터 대화 |
| `StoredFile` | 파일 저장 (dev: BYTEA, prod: S3) |
| `IntakeFormSchema` | 동적 폼 정의 |
| `Category/SubCategory` | 시술 카테고리 (눈/코/피부 등) |

## 주요 설계 원칙

- **Soft delete**: 모든 모델에 `deletedAt` 필드
- **Timestamps**: 모든 모델에 `createdAt`/`updatedAt`
- **ID**: `cuid` 사용
- **인덱스**: 자주 조회되는 외래키/상태 필드에 복합 인덱스
- **PII 보호**: 전화번호/닉네임 AES-256 암호화 + HMAC 검색 해시
- **데이터 접근 로깅**: `DataAccessLog` (6개월~2년 보관)
- **@@map()**: 레거시 테이블명 매핑 (예: `Account` → `auth_providers`)

## 의존성

```
@21n/types ← Prisma enum 미러 (TypeScript-only, Prisma 의존성 없음)
@21n/trpc  → @21n/types
apps/api    → @21n/database (PrismaClient)
apps/admin  → @21n/types
user-app    → @21n/types
```
