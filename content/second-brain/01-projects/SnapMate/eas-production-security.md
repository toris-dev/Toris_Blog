# EAS Production 보안 (Firebase / env)

모바일 앱은 **클라이언트 바이너리**이므로 Firebase API Key·OAuth Client ID를 **완전히 숨기는 것은 불가능**합니다.  
Snapmate는 아래 **3단계**로 노출·악용 위험을 줄입니다.

## 1. JS 번들에서 `EXPO_PUBLIC_*` 제거 (production)

Expo/Metro는 `EXPO_PUBLIC_*` 변수를 **JS 번들에 평문 문자열**로 인라인합니다.  
`strings app.apk | grep AIza` 같은 방식으로 쉽게 찾을 수 있습니다.

**Production / Preview EAS 빌드:**

| 단계 | 동작 |
|------|------|
| EAS Secrets | `SNAPMATE_*` 이름으로 저장 (`npm run eas:env:sync`) |
| `app.config.ts` | `SNAPMATE_*` 우선, 없으면 `EXPO_PUBLIC_*`(EAS env) → `extra.snapmatePayload` |
| 런타임 | `__DEV__`가 아니면 `extra`만 디코딩 — `process.env.EXPO_PUBLIC_*` 참조 없음 |

로컬 개발(`expo start`)은 기존처럼 `.env.local`의 `EXPO_PUBLIC_*` 사용.

### EAS Secrets 등록

**권장 (로컬 `.env.production` / `.env.local` → EAS 한 번에 등록):**

```bash
npm run eas:env:sync
eas secret:list --scope project
```

수동 등록:

```bash
eas secret:create --scope project --name SNAPMATE_FIREBASE_API_KEY --value "YOUR_KEY"
eas secret:create --scope project --name SNAPMATE_FIREBASE_AUTH_DOMAIN --value "snap-6bfca.firebaseapp.com"
eas secret:create --scope project --name SNAPMATE_FIREBASE_PROJECT_ID --value "snap-6bfca"
eas secret:create --scope project --name SNAPMATE_FIREBASE_MESSAGING_SENDER_ID --value "17009532696"
eas secret:create --scope project --name SNAPMATE_FIREBASE_APP_ID --value "1:17009532696:web:..."
eas secret:create --scope project --name SNAPMATE_FIREBASE_MEASUREMENT_ID --value "G-..."
eas secret:create --scope project --name SNAPMATE_GOOGLE_WEB_CLIENT_ID --value "..."
eas secret:create --scope project --name SNAPMATE_GOOGLE_IOS_CLIENT_ID --value "..."
eas secret:create --scope project --name SNAPMATE_GOOGLE_IOS_URL_SCHEME --value "com.googleusercontent.apps...."
eas secret:create --scope project --name SNAPMATE_R2_PUBLIC_BASE_URL --value "https://cdn.example.com"
```

확인:

```bash
eas secret:list --scope project
eas build --profile production --platform android
```

템플릿: [`.env.eas.example`](../.env.eas.example)

## 2. 절대 앱에 넣지 말 것

| 항목 | 이유 |
|------|------|
| `*-firebase-adminsdk-*.json` | 서버 전용 — 유출 시 Firestore 전체 접근 |
| `R2_SECRET_ACCESS_KEY` | Functions Secret 전용 |
| `SENTRY_AUTH_TOKEN` | EAS 빌드 전용 (런타임 불필요) |

## 3. Firebase / GCP에서 막기 (필수)

API Key가 노출되어도 **다른 앱/스크립트가 Firebase를 남용하지 못하게** 설정합니다.

### Google Cloud — API Key 제한

[Google Cloud Console](https://console.cloud.google.com/apis/credentials) → API Key → **Application restrictions**

- **Android apps**: `com.toris.snapmate` + SHA-1 (EAS credentials에서 확인)
- **iOS apps**: `com.toris.snapmate` 번들 ID
- **API restrictions**: Firebase 관련 API만 허용

### Firebase App Check (권장)

[Firebase Console](https://console.firebase.google.com) → **App Check**

- Android: **Play Integrity**
- iOS: **App Attest** (또는 DeviceCheck)
- Firestore / Functions에서 **Enforcement** 켜기

정품 빌드가 아니면 Firebase API 호출 자체가 차단됩니다.

### Firestore / Storage 규칙

이미 [`firestore.rules`](../firestore.rules) 적용. API Key만으로는 데이터 접근 불가.

## 네이티브 plist / google-services.json

FCM·네이티브 Google Sign-In용 `GoogleService-Info.plist`, `google-services.json`에도 API Key가 있습니다.  
**JS 번들과 중복 노출을 줄였지만**, 네이티브 리소스에서 추출 가능 → App Check + API Key 제한이 실질적 방어선입니다.

## 요약

| 환경 | 설정 소스 |
|------|-----------|
| `expo start` (개발) | `.env.local` → `EXPO_PUBLIC_*` |
| `eas build --profile production` | EAS `SNAPMATE_*` → obfuscated `extra` |
| 서버 (Functions) | Firebase Secrets / ADC |

**Obfuscation ≠ 암호화.** 숙련된 리버서는 디코딩 가능합니다. **App Check + API Key 제한 + Firestore Rules**를 함께 켜야 production 수준입니다.
