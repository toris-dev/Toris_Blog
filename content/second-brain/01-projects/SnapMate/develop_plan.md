# 실시간 커플/그룹 공유 갤러리 앱 개발 기획서 (MVP 기준)

## 서비스 한 줄 정의

> “우리의 순간이 찍히는 즉시 함께 쌓이는 프라이빗 공유 갤러리”
> 

---

# 1. 프로젝트 개요

## 프로젝트 목적

커플, 가족, 친구, 여행 그룹 등 소규모 관계 기반 사용자들이 사진을 실시간으로 공유하고 추억을 함께 기록할 수 있는 모바일 앱 개발

---

## 핵심 가치

- 촬영 즉시 공유
- 자동 저장
- 관계 중심 추억 기록
- 폐쇄형 프라이빗 공간
- 감정 중심 인터랙션

---

# 2. 개발 목표

## MVP 목표

- 앱 내 카메라 기반 즉시 공유 경험 구현
- 실시간 그룹 갤러리 구축
- 추억 중심 UX 제공
- Firebase 기반 서버리스 구조 완성

---

# 3. 기술 스택

## Frontend

| 영역 | 기술 |
| --- | --- |
| Framework | React Native |
| Runtime | Expo |
| Language | TypeScript |
| Navigation | React Navigation |
| Styling | NativeWind |
| State | Zustand |
| Server State | TanStack Query |
| Animation | Reanimated |
| Camera | expo-camera |
| Notification | expo-notifications |
| Image | expo-image |
| Storage Cache | MMKV |

---

## Backend

| 영역 | 기술 |
| --- | --- |
| Backend | Firebase |
| Auth | Firebase Auth |
| Database | Firestore |
| Storage | Cloudflare R2 (presigned via Functions) |
| Push | FCM |
| Server Logic | Firebase Functions |

---

## DevOps

| 영역 | 기술 |
| --- | --- |
| CI/CD | GitHub Actions |
| Build | EAS Build |
| OTA Update | EAS Update |
| Monitoring | Sentry |

---

# 4. 서비스 구조

```
User
 └── Group
       └── Shared Gallery
              └── Photos
                     ├── Reactions
                     ├── Metadata
                     └── Memory Note
```

---

# 5. 핵심 기능 정의

---

# 5-1. 인증(Auth)

## 기능

- Google Login
- 익명 로그인 (선택)

---

## 데이터

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

# 5-2. 그룹(Group)

## 기능

- 그룹 생성
- 그룹 참여
- 초대 링크
- QR 초대
- 그룹 탈퇴

---

## 그룹 타입

| 타입 | 설명 |
| --- | --- |
| Couple | 커플 |
| Family | 가족 |
| Friends | 친구 |
| Travel | 여행 |
| Custom | 자유 그룹 |

---

## 데이터 구조

### groups

```json
{
  "id": "groupId",
  "name": "제주 여행",
  "type": "travel",
  "imageUrl": "",
  "createdBy": "uid",
  "createdAt": ""
}
```

---

# 5-3. 그룹 멤버

### group_members

```json
{
  "groupId": "groupId",
  "userId": "uid",
  "joinedAt": ""
}
```

---

# 5-4. 앱 내 카메라

## 기능

- 사진·동영상 촬영 (앱 내 카메라 전용)
- 전/후면 카메라
- 플래시
- 줌
- 즉시 업로드

> **정책:** 기기 갤러리·사진 앱에서 기존 미디어를 선택해 올리는 기능은 지원하지 않습니다. Snapmate 공유 피드는 앱에서 찍은 순간만 쌓입니다. (그룹 커버·프로필 아바타 등은 별도 ImagePicker 사용)

---

## 촬영 플로우

```
사진 촬영
   ↓
로컬 압축
   ↓
Cloudflare R2 업로드
   ↓
Firestore photo 생성
   ↓
실시간 피드 반영
   ↓
푸시 알림 발송
```

---

# 5-5. 실시간 공유 갤러리

## 기능

- 최신순 피드
- Infinite Scroll
- 실시간 동기화
- 썸네일 최적화

---

## 데이터 구조

### photos

```json
{
  "id": "photoId",
  "groupId": "groupId",
  "userId": "uid",
  "imageUrl": "",
  "thumbnailUrl": "",
  "createdAt": "",

  "location": {
    "name": "서울숲",
    "lat": 0,
    "lng": 0
  },

  "weather": {
    "temp": 22,
    "condition": "Sunny"
  },

  "deviceInfo": {
    "model": "iPhone 16"
  },

  "memoryNote": "우리 첫 서울숲 데이트"
}
```

---

# 5-6. 사진 상세 정보 카드

## 핵심 기능

사진 자체를 “추억 카드”로 표현

---

## 표시 정보

| 항목 | 설명 |
| --- | --- |
| 촬영 시간 | EXIF 기반 |
| 촬영 장소 | GPS 기반 |
| 촬영자 | 업로더 |
| 날씨 | 촬영 시점 API |
| 디바이스 | EXIF |
| 그룹명 | 공유 그룹 |

---

## UI 예시

```
2026.05.23 오후 7:42
서울 성수동 서울숲

Jason이 촬영
🌤 맑음 / 22도
iPhone 16 Pro
```

---

# 5-7. 감정 리액션

## 기능

댓글 중심이 아닌 감정 표현 중심 UX

---

## 지원 타입

| 리액션 | 의미 |
| --- | --- |
| ❤️ | 좋아 |
| 🥹 | 감동 |
| 😂 | 웃김 |
| 🔥 | 인생샷 |
| 😍 | 너무 좋음 |

---

## 데이터 구조

### reactions

```json
{
  "photoId": "photoId",
  "userId": "uid",
  "type": "heart",
  "createdAt": ""
}
```

---

# 5-8. Memory Note

## 기능

사진별 짧은 추억 메모

---

## 정책

| 항목 | 정책 |
| --- | --- |
| 최대 길이 | 100자 |
| 수정 | 가능 |
| Thread | 없음 |

---

## 예시

```
“비 엄청 왔는데 재밌었다”
“우리 첫 제주 여행”
```

---

# 5-9. 추억 타임라인

## 기능

시간 기반 추억 재노출

---

## 예시

| 기능 | 설명 |
| --- | --- |
| 1년 전 오늘 | 과거 사진 노출 |
| 여행 Day | 여행별 자동 묶음 |
| 월간 회고 | 월별 앨범 |

---

# 5-10. 푸시 알림

## 이벤트

| 이벤트 | 알림 |
| --- | --- |
| 새 사진 업로드 | O |
| 리액션 | O |
| 그룹 초대 | O |

---

# 6. Firestore 구조

```
users
groups
group_members
photos
reactions
notifications
```

---

# 7. 폴더 구조

```
src/
 ├── app/
 ├── components/
 ├── screens/
 ├── features/
 │    ├── auth/
 │    ├── groups/
 │    ├── camera/
 │    ├── gallery/
 │    └── timeline/
 ├── services/
 │    ├── firebase/
 │    ├── media/
 │    ├── r2/
 │    └── notifications/
 ├── hooks/
 ├── stores/
 ├── utils/
 ├── constants/
 └── types/
```

---

# 8. 상태 관리 구조

---

# Client State

## Zustand

### 관리 항목

- 로그인 상태
- 현재 그룹
- 카메라 상태
- UI 상태

---

# Server State

## TanStack Query

### 관리 항목

- Firestore Fetch
- Pagination
- 캐싱

---

# 9. 실시간 동기화

## Firestore Snapshot Listener

### 적용 영역

- 그룹 피드
- 리액션
- 타임라인

---

# 10. 스토리지 전략

## 업로드 구조

```
original/
thumbnails/
profiles/
```

---

## 최적화

| 항목 | 방식 |
| --- | --- |
| 이미지 압축 | 클라이언트 |
| 썸네일 생성 | Firebase Function |
| 캐싱 | expo-image |
| 포맷 | WebP |

---

# 11. 보안 정책

## Firestore Rules

```jsx
match /photos/{photoId} {
  allow read: if request.auth != null;
}
```

---

## 그룹 접근 제한

```jsx
allow read, write:
if request.auth.uid in resource.data.members;
```

---

# 12. 성능 최적화

## 리스트 최적화

- FlashList 사용

---

## 이미지 최적화

- Lazy Load
- Thumbnail 우선 로드
- Prefetch

---

# 13. 분석 이벤트

| 이벤트 | 설명 |
| --- | --- |
| photo_upload | 사진 업로드 |
| group_create | 그룹 생성 |
| reaction_click | 리액션 |
| invite_sent | 초대 전송 |

---

# 14. MVP 범위

## 포함

✅ 로그인

✅ 그룹 생성

✅ 그룹 초대

✅ 실시간 사진 공유

✅ 실시간 피드

✅ 감정 리액션

✅ 사진 정보 카드

✅ Memory Note

✅ 푸시 알림

---

## 제외

❌ 공개 SNS 기능

❌ 댓글 Thread

❌ 신고/차단

❌ 관리자 시스템

❌ 팔로우

❌ 공개 프로필

❌ AI 기능

❌ 영상 자동 편집

---

# 15. 개발 우선순위

---

# Phase 1

## 핵심 기능

- Auth
- Group
- Camera
- Upload
- Feed

---

# Phase 2

## 관계 UX

- Reactions
- Memory Note
- Push Notification

---

# Phase 3

## 추억 기능

- Timeline
- Monthly Album
- Metadata 강화

---

# 16. KPI 목표

| KPI | 목표 |
| --- | --- |
| 그룹 생성률 | 60% |
| D7 리텐션 | 35% |
| 업로드 수 | 사용자당 일 5장 |
| 초대 전환율 | 40% |

---

# 17. 향후 확장 기능

## AI

- 자동 베스트 컷
- 얼굴 분류
- 추억 영상 생성

---

## 감성 기능

- 연간 회고
- 관계 히스토리
- 데이트 카운트

---

# 18. 최종 서비스 방향

> “관계 속 순간들을 자동으로 함께 기록하는 프라이빗 메모리 플랫폼”
>