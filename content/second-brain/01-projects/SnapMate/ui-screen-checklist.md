# Snapmate UI 리디자인 체크리스트 (HeroUI + service_plan)

기준: `docs/service_plan.md`, `src/constants/design.ts`, `SnapmateCard` / `SnapmateField` / `ScreenHeader` / `SubpageHeader`

## 0. 공통 컴포넌트
- [x] `SubpageHeader` — ScreenHeader 톤 통일
- [x] `login-loading-overlay` — HeroUI Card
- [x] `join-group-form`, `invite-panel`, `invite-by-email-form`

## 1. 인증·온보딩
- [x] 로그인 `login-screen`
- [x] 로그인 이메일 `login-email-form`
- [x] 닉네임 설정 `setup-nickname-screen`
- [x] 이메일 인증 `verify-email-screen`
- [x] 비밀번호 찾기 `forgot-password-screen`

## 2. 메인 탭
- [x] 홈 `home-dashboard-screen` (커스텀 인사 헤더 + HeroUI 카드)
- [x] 그룹 `app/(tabs)/groups.tsx`
- [x] 추억 `timeline-screen`
- [x] 프로필 `profile-screen`
- [x] 탐색(숨김 탭) `discover-groups-screen`

## 3. 촬영·카메라
- [x] 촬영 `camera-capture-screen` + `camera-interactive-ui` (모드 슬라이드, 줌 칩, 셔터 펄스, REC 타이머, 더블탭 전환, 촬영 플래시, 프리뷰 그라데이션)
- [x] **앱 카메라 촬영만 업로드** — 기기 갤러리·앨범에서 가져오기 UI 없음
- [x] 그룹 없음 게이트 `camera-no-group-gate`

## 4. 그룹·초대
- [x] 그룹룸 `group-room-screen` (커스텀 히어로 + Copy)
- [x] 멤버 `group-members-screen`
- [x] 초대 `group-invite-screen` + `invite-panel`
- [x] 받은 초대 `invites-screen`
- [x] QR/코드 참여 `app/groups/join.tsx` + `join-group-form`
- [x] 방 만들기 `create-group-form`

## 5. 갤러리·순간
- [x] 그룹 앨범 `group-gallery-screen`
- [x] 사진 상세 `photo-detail-screen` (커스텀 닫기 + SoftCard)
- [x] 뷰어 `group-photo-viewer-screen` (풀스크린)
- [x] 댓글 `comment-thread`
- [x] 공유 액션 `photo-share-actions`

## 6. 소셜·알림
- [x] 공개 순간 `social-feed-screen`
- [x] 알림 `notification-inbox`

## 7. 프로필 하위
- [x] 알림 설정 `notification-settings-screen`
- [x] 계정 보안 `account-security-screen`
- [x] 앱 정보 `app-info-screen`

## 8. 탭 바
- [x] `app-tab-bar` (브랜드 톤 적용)
