# MVP 진행 현황

기준: [service_plan.md](./service_plan.md) · [service-plan-alignment.md](./service-plan-alignment.md)

마지막 업데이트: 2026-05-23

## service_plan §12 MVP 필수

| 항목 | 상태 |
|------|------|
| 그룹 생성 (5종·초대·QR·인원 제한) | ✅ |
| 앱 내 카메라 | ✅ 한국어 UX·그룹 가드·**촬영 전용**(앨범 업로드 없음) |
| 촬영 즉시 공유 | ✅ |
| 실시간 갤러리 | ✅ 피드 + 날짜별 |
| 알림 | ✅ |

## §8 화면

| 화면 | 상태 |
|------|------|
| 홈 (그룹·최근·오늘의 추억·카메라 FAB) | ✅ |
| 그룹룸 (피드·멤버·갤러리·초대) | ✅ |
| 카메라 | ✅ |
| 갤러리 (날짜·앨범 저장) | ✅ |

## 관계 UX

| 항목 | 상태 |
|------|------|
| 리액션 · Memory Note | ✅ |
| 댓글 Thread | ✅ |
| 폐쇄형 모멘트 피드 | ✅ `/social` |
| FCM + 알림함 | ✅ |

## 추억 · 프로필

| 항목 | 상태 |
|------|------|
| 추억 탭 (전체 그룹·1년 전 오늘·월별·필터) | ✅ |
| 촬영 메타 (GPS·날씨) | ✅ |
| 프로필 (이름·사진·로그아웃·탈퇴) | ✅ |
| 탭 4개 (홈·추억·그룹·나) | ✅ |

## 후속 (기획 확장)

- AI · 지도 갤러리 · 동영상 · 필터
- 신고/차단 · 방장 위임

## 배포 · 마케팅

- [deployment-checklist.md](./deployment-checklist.md) — 배포 자료·스토어·QA
- [marketing-plan.md](./marketing-plan.md) — 포지셔닝·채널·런칭 일정·KPI
- [cost-estimate.md](./cost-estimate.md) — 인프라 비용·사용자/규모별 추정
- [business-model.md](./business-model.md) — Freemium·가격·수익 로드맵

### 배포 전 (기술)

1. `npm run firestore:deploy`
2. `npm run functions:deploy`
3. `EXPO_PUBLIC_R2_PUBLIC_BASE_URL`
4. `expo-media-library` 권한 (앨범 저장)
