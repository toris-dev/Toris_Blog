# 배포 체크리스트 및 필요 자료

Snapmate 스토어 출시·프로덕션 배포에 필요한 기술 설정, 계정, 법적 문서, 스토어 에셋을 한곳에 정리합니다.

관련 문서: [firebase-setup.md](./firebase-setup.md) · [r2-setup.md](./r2-setup.md) · [push-notifications.md](./push-notifications.md) · [account-deletion-policy.md](./account-deletion-policy.md) · [mvp-progress.md](./mvp-progress.md)

마지막 업데이트: 2026-05-23

---

## 1. 배포 전 요약

| 구분 | 필수 여부 | 담당 |
|------|-----------|------|
| Firebase (Auth, Firestore, Functions, FCM) | 필수 | 백엔드 |
| Cloudflare R2 (미디어) | 필수 | 인프라 |
| EAS Build (iOS/Android 바이너리) | 스토어 출시 시 필수 | 모바일 |
| Apple Developer / Google Play Console | 스토어 출시 시 필수 | 운영 |
| 개인정보처리방침·이용약관 URL | 스토어 심사 필수 | 법무/운영 |
| 스토어 스크린샷·설명·아이콘 | 스토어 등록 필수 | 디자인/마케팅 |

---

## 2. 계정·서비스 준비

### 2.1 개발·인프라

| 서비스 | 용도 | 준비물 |
|--------|------|--------|
| [Firebase](https://console.firebase.google.com) | Auth, Firestore, Functions, FCM | 프로젝트, Blaze 요금제(Functions) |
| [Cloudflare](https://dash.cloudflare.com) | R2 미디어 저장 | 버킷, API 토큰, 공개 URL 도메인 |
| [Expo / EAS](https://expo.dev) | 빌드·OTA | 계정, `projectId` (`app.config.ts` extra.eas) |
| [Sentry](https://sentry.io) | 크래시·성능 | 조직, RN 프로젝트, `SENTRY_AUTH_TOKEN` |
| [GitHub](https://github.com) | 소스·CI (선택) | Actions secrets |

### 2.2 스토어·법인

| 항목 | iOS | Android |
|------|-----|---------|
| 개발자 프로그램 | Apple Developer Program (연 $99) | Google Play Console (일회 $25) |
| 앱 ID | `com.toris.snapmate` (`app.config.ts`) | 동일 package |
| 연령 등급 | App Store Connect 설문 | Play 콘텐츠 등급 설문 |
| 데이터 안전 / 개인정보 | App Privacy 라벨 | Data safety form |

---

## 3. 기술 배포 순서

### 3.1 백엔드 (프로덕션)

```bash
# 1) Firestore 규칙·인덱스
npm run firestore:deploy

# 2) Functions R2 env (최초 1회)
cp functions/.env.example functions/.env
# functions/.env 에 R2_* 값 입력 (git 커밋 금지)

cd functions && npm install && npm run build
cd ..
npm run functions:deploy
```

상세: [production-infra.md](./production-infra.md) · [r2-setup.md](./r2-setup.md) · [firebase-setup.md](./firebase-setup.md)

### 3.2 앱 환경 변수 (EAS Secrets / 로컬)

`.env.example` → EAS **Secrets** 또는 CI에 등록 (앱 번들에 들어가는 값만 `EXPO_PUBLIC_*`).

| 변수 | 설명 |
|------|------|
| `EXPO_PUBLIC_FIREBASE_*` | Firebase Web 앱 설정 |
| `EXPO_PUBLIC_R2_PUBLIC_BASE_URL` | R2 공개 CDN 베이스 (끝 `/` 없음) |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google 로그인 |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | iOS Google 로그인 |
| `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME` | iOS URL scheme |
| `GOOGLE_SERVICES_JSON` | Android FCM (파일 경로) |
| `GOOGLE_SERVICES_PLIST` | iOS FCM (파일 경로) |
| `SENTRY_AUTH_TOKEN` | EAS 빌드 시 소스맵 업로드 |

**절대 앱/저장소에 넣지 말 것:** `*-firebase-adminsdk-*.json`, R2 Secret Key.

### 3.3 네이티브 빌드 (EAS)

프로젝트에 `eas.json`이 없으면 초기화 후 프로필을 추가합니다.

```bash
npx eas-cli login
npx eas build:configure
npx eas build --platform ios --profile production
npx eas build --platform android --profile production
```

| 체크 | 내용 |
|------|------|
| prebuild | `google-services.json`, `GoogleService-Info.plist` 프로젝트 루트 배치 |
| iOS | Push Notifications, Associated Domains(딥링크 시) |
| Android | FCM, 알림 채널 (`photos`, `social`, `invites`) |
| 버전 | `app.config.ts` `version` / 스토어별 `buildNumber`·`versionCode` 증가 정책 |

권한 문구는 `app.config.ts` 플러그인에 영문으로 정의되어 있음 → **스토어 제출 전 한국어 현지화 검토** 권장.

### 3.4 스토어 제출

```bash
npx eas submit --platform ios
npx eas submit --platform android
```

TestFlight / 내부 테스트 트랙으로 1차 QA 후 프로덕션 승격.

---

## 4. 스토어 등록 자료 (필수 에셋)

### 4.1 공통 브랜드 에셋

| 자료 | 규격·비고 | 현재 프로젝트 |
|------|-----------|---------------|
| 앱 아이콘 | 1024×1024 PNG (투명 없음) | `assets/images/icon.png` |
| Android adaptive | foreground/background/monochrome | `assets/images/android-icon-*` |
| 스플래시 | 브랜드 배경 `#FFF8FB` | `assets/images/splash-icon.png` |
| 스토어 피처 그래픽 (Play) | 1024×500 | **제작 필요** |
| App Store 프로모션 (선택) | 1200×630 등 | **제작 필요** |

브랜드 가이드: `.cursor/skills/snapmate-brand-design/SKILL.md` (핑크 `#FF6B9D`, 감성 톤)

### 4.2 스크린샷 (권장 시나리오 5~8장)

촬영·편집 시 실제 데이터가 있는 **커플룸** 데모 계정 권장.

| # | 화면 | 강조 메시지 |
|---|------|-------------|
| 1 | 홈 | 그룹·오늘의 추억·즉시 공유 |
| 2 | 카메라 | 찍는 순간 바로 공유 |
| 3 | 그룹룸 피드 | 실시간 피드 |
| 4 | 사진 상세 | 추억 카드(장소·날씨·메모) |
| 5 | 추억 탭 | 1년 전 오늘 |
| 6 | 초대(QR) | 초대 한 번에 참여 |
| 7 | 알림 | 새 사진 푸시 |
| 8 | 모멘트(선택) | 폐쇄형 공유 |

**iOS:** 6.7", 6.5", 5.5" 등 필수 해상도 세트  
**Android:** 휴대폰 + 7인치 태블릿(선택)

### 4.3 스토어 문구 초안 (한국어)

**앱 이름:** Snapmate (스토어 표기: Snapmate — 우리의 순간)

**부제 (30자 내외):**  
찍는 순간, 함께 보는 프라이빗 갤러리

**짧은 설명 (80자, Play):**  
커플·가족·친구와 앱 카메라로 찍은 사진이 즉시 공유됩니다. 별도 전송 없이 우리만의 방에 쌓이는 추억 앨범.

**전체 설명 (요지):**

- 앱 내 카메라로 촬영 → 그룹에 자동 업로드 (기기 앨범에서 가져오기 불가)
- 실시간 피드·날짜별 갤러리·추억 타임라인
- 리액션·댓글·한 줄 메모로 감정 기록
- QR·초대 코드로 그룹 참여 (최대 30명)
- Google 로그인

**키워드 (ASO):** 커플 앨범, 실시간 사진 공유, 가족 앨범, 여행 사진, 프라이빗 갤러리, 커플 다이어리

**카테고리:** 사진 및 비디오 / 라이프스타일

### 4.4 딥링크·초대 URL

| 항목 | 값 |
|------|-----|
| 앱 스킴 | `snapmate://` |
| 초대 경로 | `snapmate://join?code=XXXX` (`src/utils/invite-link.ts`) |
| Universal Links / App Links | 출시 전 도메인·`apple-app-site-association` / `assetlinks.json` **설정 필요** (웹 랜딩 연동 시) |

---

## 5. 법적·정책 자료 (심사 필수)

스토어와 Firebase Auth는 **공개 URL**이 필요합니다. 호스팅 예: Notion 공개, GitHub Pages, Vercel 정적 페이지.

| 문서 | 필수 내용 | 앱 연동 |
|------|-----------|---------|
| **개인정보처리방침** | 수집 항목(이메일, 사진, 위치·날씨 메타, FCM 토큰), 보관·제3자(Firebase, Cloudflare, Sentry), 문의처 | 스토어 URL + 앱 내 링크 권장 |
| **이용약관** | 서비스 범위, 금지 행위, 멤버 콘텐츠, 책임 제한 | 스토어 URL |
| **회원 탈퇴 안내** | 탈퇴 방법·데이터 처리 | [account-deletion-policy.md](./account-deletion-policy.md) 기반 웹 페이지 |
| **오픈소스 라이선스** | 앱 내 OSS 고지 화면 (선택·권장) | `expo-licenses` 등 |

### App Store / Play 공통 체크

- [ ] 계정 삭제: 앱 내 **프로필 → 회원 탈퇴** 구현됨 → 정책 URL에 동일 경로 명시
- [ ] 사진·카메라·알림·(선택) 위치 권한 사용 목적 설명
- [ ] UGC(사진·댓글): 신고 기능은 MVP 후속 — 심사 시 **문의 이메일**로 대응 계획 기재 가능
- [ ] 아동 대상 아님(일반 12+/Teen) 명시

---

## 6. QA 체크리스트 (출시 전)

### 6.1 핵심 플로우

- [ ] Google 로그인·로그아웃
- [ ] Google 로그인 (실기기)
- [ ] 그룹 생성(5종 타입)·초대·QR·코드 참여·인원 상한(30)
- [ ] 카메라 촬영 → R2 업로드 → 피드 반영
- [ ] 푸시: 새 사진 / 리액션 / 댓글 / 초대
- [ ] 사진 상세: 리액션·댓글·메모·**내 앨범에 저장**
- [ ] 추억 탭: 전체 그룹·1년 전 오늘
- [ ] 회원 탈퇴(방장 단독 그룹 / 멤버 있음 케이스)

### 6.2 환경

- [ ] 프로덕션 Firebase + R2 (에뮬레이터 OFF)
- [ ] `EXPO_PUBLIC_R2_PUBLIC_BASE_URL`과 Functions `R2_PUBLIC_BASE_URL` 일치
- [ ] iOS/Android 릴리스 빌드에서 Expo Go 전용 코드 경로 없음

### 6.3 비기능

- [ ] Sentry에 테스트 크래시 수신
- [ ] Firestore 규칙: 비멤버 사진 읽기 차단
- [ ] Admin SDK JSON 미커밋

---

## 7. 운영·모니터링 (출시 후)

| 항목 | 도구 |
|------|------|
| 크래시·성능 | Sentry |
| 백엔드 로그 | Firebase Functions 로그 |
| DB·규칙 | Firestore 사용량, 규칙 거부 로그 |
| 스토어 | App Store Connect / Play Console 리뷰·다운로드 |
| KPI | [marketing-plan.md](./marketing-plan.md) §5 |
| 비용·MAU 단가 | [cost-estimate.md](./cost-estimate.md) |

비용 모니터링: Firestore 읽기/쓰기, R2 저장, Functions 호출, FCM — 상세는 [cost-estimate.md](./cost-estimate.md).

---

## 8. 배포 산출물 보관 (권장)

프로젝트 외부(Notion/Drive/1Password)에 다음을 팀이 공유할 수 있게 보관합니다.

| 산출물 | 형식 |
|--------|------|
| 스토어 스크린샷 원본 | PNG/Figma |
| 최종 스토어 설명·키워드 | MD 또는 스토어 초안 |
| 개인정보처리방침·이용약관 URL | 링크 |
| EAS credentials / App Store API Key | 비밀 저장소 |
| Firebase·Cloudflare·Sentry 로그인 | 비밀 저장소 |
| TestFlight / 내부 테스트 테스터 목록 | 스프레드시트 |

---

## 9. 빠른 링크

| 작업 | 명령/문서 |
|------|-----------|
| Firestore 배포 | `npm run firestore:deploy` |
| Functions 전체 배포 | `npm run functions:deploy` |
| R2 Callable만 | `npm run functions:deploy:r2` |
| Firebase 설정 | [firebase-setup.md](./firebase-setup.md) |
| R2 설정 | [r2-setup.md](./r2-setup.md) |
| 마케팅·런칭 | [marketing-plan.md](./marketing-plan.md) |
