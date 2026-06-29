# FCM 푸시 알림 명세 (MVP)

기준 문서: [service_plan.md](./service_plan.md), [develop_plan.md](./develop_plan.md)

## MVP 알림 이벤트

| 이벤트 | `NotificationType` | 트리거 | 수신자 | Android 채널 |
| --- | --- | --- | --- | --- |
| 새 사진 업로드 | `photo_added` | `photos/{id}` 생성 | 그룹 멤버 (업로더 제외) | `photos` |
| 리액션 | `reaction_added` | `reactions/{id}` 생성 | 사진 업로더 (본인 제외) | `social` |
| 댓글 | `comment_added` | `comments/{id}` 생성 | 사진 업로더 (본인 제외) | `social` |
| 그룹 초대 | `group_invite` | `group_invites/{id}` 생성 | 초대 대상 `inviteeId` | `invites` |
| 멤버 참여 | `member_joined` | `group_members/{id}` 생성 (오너 최초 가입 제외) | 기존 그룹 멤버 (신규 멤버 제외) | `invites` |

## 데이터 페이로드 (FCM `data`)

모든 푸시에 공통으로 포함:

```json
{
  "type": "photo_added",
  "groupId": "…",
  "photoId": "…",
  "actorId": "…",
  "actorName": "Jason",
  "preview": "제주 여행",
  "inviteCode": "…",
  "channelId": "photos"
}
```

클라이언트는 `type` + ID로 화면 이동. 인앱 목록은 Firestore `notifications` 컬렉션과 동기화.

## 아키텍처

```
Firestore 이벤트 (photo / reaction / comment / invite / member)
        ↓
Cloud Functions (onDocumentCreated)
        ↓
  ① notifications/{id} 기록 (인앱 피드)
  ② users.fcmTokens → FCM multicast
        ↓
expo-notifications (기기 수신 · 채널 · 딥링크)
```

## 클라이언트

- 로그인 후 `registerCurrentUserForPush()` → `users.fcmTokens`에 FCM 토큰 저장
- `usePushNotifications` — 권한, 수신, 탭 시 라우팅
- 카메라 업로드 → `photos` 문서 생성 → Functions가 자동 발송

## 배포

```bash
cd functions && npm install && npm run build
firebase deploy --only functions,firestore:indexes
```

> **Expo Go (SDK 53+)**: 원격 푸시(FCM/APNs)는 **비활성화**됩니다. 앱은 `isExpoGo()`일 때 토큰 등록·리스너를 건너뜁니다. 실제 푸시 테스트는 **EAS development build**에서 하세요. 인앱 `notifications` 피드(Firestore)는 Expo Go에서도 동작합니다.

## Phase 3+ (미구현)

- 추억 타임라인 (`memory_reminder`)
- 1년 전 오늘 (`on_this_day`)
- 월간 회고 (`monthly_recap`)
