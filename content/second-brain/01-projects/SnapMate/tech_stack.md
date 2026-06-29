# 실시간 공유 갤러리 앱 기술 스택 명세서

(React Native + Expo + Firebase 기반)

---

# 1. 기술 스택 방향성

## 목표

- 빠른 MVP 개발
- iOS/Android 동시 대응
- 소규모 팀 운영 최적화
- 단일 레포 기반 관리
- 실시간 기능 구현 단순화
- 운영 비용 최소화

---

# 2. 전체 아키텍처

```
[ React Native Expo App ]
          │
          ▼
[ Firebase Backend ]
 ├─ Firebase Auth
 ├─ Firestore
 ├─ Firebase Cloud Messaging
 ├─ Firebase Functions (R2 presigned URLs)
 └─ Firebase Analytics

[ Cloudflare R2 ]
 └─ Photo / thumbnail / profile / cover binaries

          │
          ▼
[ Admin / Monitoring ]
 ├─ Firebase Console
 ├─ Sentry
 └─ Mixpanel / Amplitude
```

---

# 3. 프론트엔드 스택

## Core Framework

- React Native
- Expo (Managed Workflow)

## 선택 이유

- 빠른 개발 속도
- OTA 업데이트 가능
- 카메라/푸시 구현 간단
- iOS/Android 동시 대응
- 작은 팀에 적합

---

## 주요 라이브러리

| 영역          | 스택                     |
| ------------- | ------------------------ |
| Navigation    | React Navigation         |
| State         | Zustand                  |
| Server State  | TanStack Query           |
| Styling       | NativeWind (Tailwind RN) |
| Form          | React Hook Form          |
| Validation    | Zod                      |
| Animation     | Reanimated               |
| Gesture       | Gesture Handler          |
| Camera        | expo-camera              |
| Media         | expo-image-picker        |
| Notifications | expo-notifications       |
| Image Cache   | expo-image               |
| Storage       | MMKV                     |
| Date          | dayjs                    |
| Icons         | lucide-react-native      |

---

# 4. 백엔드 스택 (Firebase)

---

# A. Authentication

## Firebase Auth

### 로그인 방식

- Google Login
- Kakao Login (추후)
- Anonymous Login (온보딩용)

### 역할

- 사용자 인증
- 세션 관리
- 디바이스 식별

---

# B. Database

## Cloud Firestore

### 사용 이유

- 실시간 동기화
- 모바일 친화적
- 구조 단순
- 서버 없이 빠른 개발 가능

---

## 주요 컬렉션 구조

```
users
groups
group_members
photos
reactions
comments
notifications
```

---

## 예시 구조

### users

```json
{
  "id": "uid",
  "name": "Jason",
  "profileImage": "",
  "createdAt": ""
}
```

---

### groups

```json
{
  "id": "groupId",
  "type": "couple",
  "name": "우리 데이트",
  "members": ["uid1", "uid2"],
  "createdAt": ""
}
```

---

### photos

```json
{
  "id": "photoId",
  "groupId": "groupId",
  "userId": "uid",
  "imageUrl": "",
  "thumbnailUrl": "",
  "createdAt": "",
  "metadata": {
    "width": 1080,
    "height": 1920
  }
}
```

---

# C. Storage

## Cloudflare R2 (Firebase Storage 미사용)

### 저장 항목

- 피드용 압축 이미지
- 썸네일
- 프로필 이미지
- 그룹 커버

업로드: 앱에서 압축 → Firebase Callable로 presigned PUT URL 발급 → R2 직접 업로드.  
자세한 설정: `docs/r2-setup.md`

---

## 이미지 전략

### 업로드 시 (클라이언트)

1. 로컬 리사이즈·JPEG 압축 (썸네일 + 피드)
2. 썸네일 R2 업로드 → Firestore 문서 생성
3. 피드 이미지 R2 업로드 → URL 갱신

---

## 추천 정책

| 타입              | 품질 |
| ----------------- | ---- |
| Feed Thumbnail    | 압축 |
| Gallery View      | 중간 |
| Original Download | 원본 |

---

# D. Push Notifications

## Firebase Cloud Messaging (FCM)

### 사용 케이스

- 새 사진 업로드
- 댓글
- 리액션
- 그룹 초대

---

## Expo Push 병행

MVP에서는:

- Expo Notifications 사용 추천

확장 시:

- Native FCM 직접 연동

---

# E. Server Logic

## Firebase Functions

### 역할

- 썸네일 생성
- 알림 트리거
- AI 처리 예약
- 이미지 검수
- 그룹 권한 체크

---

## 추천 Runtime

- Node.js 20
- TypeScript

---

# 5. 상태 관리 구조

---

# Client State

## Zustand

### 관리 항목

- 로그인 상태
- 현재 그룹
- UI 상태
- 카메라 상태

---

# Server State

## TanStack Query

### 관리 항목

- Firestore fetch
- 캐싱
- Pagination
- Infinite Scroll

---

# 6. 폴더 구조

```
src/
 ├── app/
 ├── screens/
 ├── components/
 ├── features/
 │    ├── auth/
 │    ├── camera/
 │    ├── groups/
 │    ├── gallery/
 │    └── chat/
 ├── services/
 │    ├── firebase/
 │    ├── api/
 │    └── notifications/
 ├── hooks/
 ├── stores/
 ├── types/
 ├── utils/
 └── constants/
```

---

# 7. 실시간 동기화 전략

## Firestore Snapshot Listener

### 적용 위치

- 그룹 피드
- 댓글
- 리액션
- 멤버 상태

---

## 전략

### 초기

- 최신 사진 30개 fetch

### 이후

- onSnapshot subscribe

---

# 8. 카메라 업로드 플로우

> 그룹 피드 업로드는 **앱 내 카메라 촬영**만 허용합니다. `expo-image-picker`의 `launchImageLibraryAsync`는 그룹 커버·프로필 등 비피드 용도에만 사용합니다.

```
앱 카메라 촬영 (사진 또는 동영상)
   ↓
로컬 압축
   ↓
Cloudflare R2 업로드
   ↓
Firestore photo document 생성
   ↓
실시간 feed 반영
   ↓
FCM Push 전송
```

---

# 9. 성능 최적화 전략

---

# 이미지 최적화

## 필수

- 썸네일 생성
- lazy loading
- prefetch
- WebP 사용

---

# 리스트 최적화

## FlashList 추천

### 이유

- RN FlatList보다 성능 우수
- 이미지 피드 최적화

---

# 캐싱

## expo-image

- aggressive cache 사용

---

# 10. 보안 정책

---

# Firestore Security Rules

## 핵심

- 그룹 멤버만 접근 가능
- 본인 데이터만 수정 가능

---

## 예시

```jsx
match /photos/{photoId} {
  allow read: if request.auth.uid in resource.data.members;
}
```

---

# Storage Rules

```jsx
allow write: if request.auth != null;
```

---

# 11. 분석/모니터링

---

# Analytics

## Firebase Analytics

### 추적 이벤트

- 사진 업로드
- 그룹 생성
- 공유 수
- 리텐션

---

# Error Monitoring

## Sentry

### 추적

- Crash
- API 실패
- 업로드 실패

---

# Product Analytics

## 추천

- Mixpanel
  또는
- Amplitude

---

# 12. CI/CD

---

# EAS Build

## 사용 이유

- Expo 공식 빌드 시스템
- OTA 지원

---

# EAS Update

## 장점

- 앱스토어 심사 없이 업데이트 가능

---

# GitHub Actions

## 자동화

- lint
- test
- build
- deploy

---

# 13. 추천 개발 환경

| 영역              | 추천                 |
| ----------------- | -------------------- |
| Language          | TypeScript           |
| Package Manager   | pnpm                 |
| Monorepo          | Turborepo            |
| Formatting        | Prettier             |
| Lint              | ESLint               |
| Git Hooks         | Husky                |
| Commit Convention | Conventional Commits |

---

# 14. 모노레포 구조 추천

```
apps/
 └── mobile/

packages/
 ├── ui/
 ├── config/
 ├── types/
 └── utils/
```

---

# 15. MVP 기준 추천 우선순위

---

## 1순위

- Auth
- 그룹 생성
- 카메라
- 실시간 공유
- Push

---

## 2순위

- 댓글
- 리액션
- 앨범 정리

---

## 3순위

- AI
- 영상
- 얼굴 인식

---

# 16. 예상 트래픽 고려사항

## 초기

Firebase 단독으로 충분

## 성장 시

아래 분리 가능

| 기능        | 확장 방향        |
| ----------- | ---------------- |
| 이미지 처리 | Cloud Run        |
| AI          | Vertex AI/OpenAI |
| Feed 검색   | Algolia          |
| CDN         | Cloudflare       |

---

# 17. 최종 추천 스택

| 영역       | 선택                |
| ---------- | ------------------- |
| App        | React Native + Expo |
| Language   | TypeScript          |
| Backend    | Firebase            |
| Database   | Firestore           |
| Storage    | Cloudflare R2       |
| Push       | FCM                 |
| Auth       | Firebase Auth       |
| State      | Zustand             |
| Query      | TanStack Query      |
| Styling    | NativeWind          |
| Build      | EAS                 |
| Monitoring | Sentry              |

---

# 18. 이 구조의 장점

## 장점

- 빠른 MVP 가능
- 서버 운영 부담 적음
- 실시간 구현 쉬움
- 소규모 팀 최적화
- 유지보수 간단
- 단일 레포 운영 가능

---

# 19. 향후 확장성

이 구조는 이후에도:

- Web App
- AI 기능
- 영상 기능
- 대규모 그룹 기능

까지 무리 없이 확장 가능.
