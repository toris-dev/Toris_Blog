# Firebase 설정 (Expo + React Native)

Snapmate는 **Firebase JS SDK** (`firebase` 패키지)로 Auth / Firestore / Functions를 사용합니다.  
**이미지 파일**은 **Cloudflare R2**에 저장합니다 → [r2-setup.md](./r2-setup.md)  
Sentry는 별도 플러그인으로 연동됩니다.

## 파일 종류 — 무엇을 어디에 쓰나

| 파일 | 용도 | 앱에서 사용 |
|------|------|-------------|
| `*-firebase-adminsdk-*.json` | **Admin SDK** (서버 권한) | ❌ 절대 넣지 않음 |
| `google-services.json` | Android **클라이언트** (FCM 등) | prebuild 시에만 (파일 있을 때) |
| `GoogleService-Info.plist` | iOS **클라이언트** (FCM 등) | prebuild 시에만 (파일 있을 때) |
| `.env.local` 의 `EXPO_PUBLIC_FIREBASE_*` | **Web 앱** 설정 (JS SDK) | ✅ 런타임 필수 |

Admin SDK JSON은 Cloud Functions·백엔드 전용입니다. Expo 앱 번들에 포함하면 안 됩니다.

## 1. 앱(Firebase JS SDK) 설정

1. [Firebase Console](https://console.firebase.google.com) → 프로젝트 선택  
2. **프로젝트 설정** → **일반** → **앱 추가** → **웹** (`</>`)  
3. 표시되는 `firebaseConfig` 값을 `.env.local`에 복사:

```bash
cp .env.example .env.local
# EXPO_PUBLIC_FIREBASE_* 항목 채우기
```

앱 코드는 `src/services/firebase/config.ts`에서 위 환경 변수를 읽습니다.

## 2. 로그인 (Authentication)

Firebase **Authentication** → **Sign-in method**에서 사용할 방식을 켭니다.

| 방식 | Expo Go | 용도 |
| --- | --- | --- |
| **Email/Password** | ✅ | 이메일 인증·닉네임·비밀번호 확인 후 가입 |
| **Google** | ✅ (브라우저 OAuth) | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` 필요 |

`auth/admin-restricted-operation` 오류는 대부분 **해당 로그인 방식이 Console에서 꺼져 있을 때** 발생합니다.

### Email/Password

1. **Email/Password** → **사용 설정**
2. (권장) **이메일 열거 보호** 켜기
3. 앱: 가입 시 인증 메일 발송 → 인증 완료 후 이용, 닉네임 유니크, 비밀번호 8자+확인

### Google 로그인

1. **Google** 사용 설정  
2. Google Cloud **OAuth 2.0 Client ID** 생성:
   - **Web client** → `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
   - **iOS** → `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
3. iOS URL scheme: iOS 클라이언트 ID를 뒤집은 값  
   예: `123456789-abc.apps.googleusercontent.com` →  
   `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME=com.googleusercontent.apps.123456789-abc`

`EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME`이 있을 때만 `app.config.ts`가 Google Sign-In 플러그인을 활성화합니다.

### Expo Go

Expo Go에는 `RNGoogleSignin` 네이티브 모듈이 없습니다. 앱은 **브라우저 OAuth**(`expo-auth-session`)로 로그인합니다.

Google Cloud Console → 해당 **Web client** → **Authorized redirect URIs**에 로그인 화면(개발 모드)에 표시되는 URI를 추가하세요. 예:

- `exp://127.0.0.1:8081/--/oauthredirect` (Expo Go)
- `snapmate://oauthredirect` (개발/프로덕션 빌드)

개발 빌드에서는 `@react-native-google-signin` 네이티브 로그인을 우선 사용합니다.  
네이티브 설정(SHA-1, `google-services.json`)이 맞지 않으면 Android 앱이 **브라우저 OAuth**로 자동 전환합니다. iOS 개발 빌드는 네이티브 로그인만 사용합니다.

### iOS Google 로그인 (개발 빌드)

1. `.env`에 아래 값 설정 (Firebase / GoogleService-Info.plist와 **일치**해야 함):
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` → Firebase **Web client** ID (`client_type: 3`, Android/iOS ID 아님)
   - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` → `GoogleService-Info.plist`의 `CLIENT_ID`
   - `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME` → `REVERSED_CLIENT_ID` (예: `com.googleusercontent.apps.123456789-abc`)
2. [Google Cloud Console](https://console.cloud.google.com) → **API 및 서비스** → **OAuth 동의 화면**
   - 앱이 **Testing** 상태면 **테스트 사용자**에 로그인할 Gmail 추가
   - 미등록 시 `Access blocked: Authorization Error` / `400 invalid_request` 발생
3. (Expo Go·브라우저 OAuth용) **Web client** → **Authorized redirect URIs**:
   - `snapmate://oauthredirect`
4. 설정 변경 후 Metro 재시작 + `npm run ios`로 앱 재설치

`400 invalid_request` + “doesn't comply with Google's OAuth 2.0 policy”는 대부분 **테스트 사용자 미등록** 또는 **Web client ID / redirect URI 불일치**입니다.

### Android SHA-1 (개발 빌드 필수)

SnapMate Android는 기본 `~/.android/debug.keystore`가 아니라 **`android/app/debug.keystore`** 를 씁니다.  
Firebase에 **이 keystore의 SHA-1**을 등록해야 `google-services.json`에 Android OAuth 클라이언트(`client_type: 1`)가 생깁니다.

```bash
npm run google:setup
# 또는: cd android && gradlew signingReport
```

1. 출력된 **SHA-1**을 Firebase Console → 프로젝트 설정 → Android 앱(`com.toris.snapmate`) → **디지털 지문 추가**
2. **google-services.json** 다시 다운로드 → 프로젝트 루트 교체
3. `npm run android` 로 앱 재설치

`google-services.json`의 `oauth_client`에 `client_type: 1`(Android) 항목이 없으면 SHA-1이 아직 반영되지 않은 것입니다.

### OAuth consent screen (Testing)

앱이 **Testing** 상태이면 로그인하려는 Google 계정을 **테스트 사용자**로 추가해야 합니다.  
그렇지 않으면 브라우저 OAuth에서 `Access blocked: Authorization Error` / `Error 400: invalid_request`가 날 수 있습니다.

1. [Google Cloud Console](https://console.cloud.google.com) → **API 및 서비스** → **OAuth 동의 화면**
2. **테스트 사용자**에 로그인할 Gmail 추가

### Firebase API 키 제한 (Android `<empty>` blocked)

Metro 로그에 아래가 보이면 **API 키가 Android 앱 전용으로 제한**된 상태입니다.

`auth/requests-from-this-android-client-application-<empty>-are-blocked`

Expo + Firebase JS SDK는 Android 패키지/SHA 헤더를 보내지 못해, API 키를 Android 앱으로만 제한하면 Google 로그인이 막힙니다.

1. Google Cloud Console → **API 및 서비스** → **사용자 인증 정보**
2. Firebase **Browser key** (`AIzaSy…`, google-services.json과 동일) 선택
3. **애플리케이션 제한사항** → **없음** (또는 HTTP 리퍼러 + IP 등 Web용 제한만)

네이티브 Google 로그인 실패 시 앱은 Cloud Functions `exchangeGoogleIdToken`으로 우회할 수 있습니다. Functions 배포 필요:

```bash
firebase use snap-6bfca
npm run functions:deploy
```

`google-services.json` / `GoogleService-Info.plist`가 있으면 `app.config.ts`가 Google Sign-In 플러그인을 **Android·iOS Firebase 연동 모드**로 적용합니다.

## 3. FCM 푸시 (Cloud Functions)

알림 이벤트·페이로드: [push-notifications.md](./push-notifications.md)

```bash
cd functions && npm install && npm run build
firebase deploy --only firestore:rules,firestore:indexes,functions
```

Functions는 `photos`, `reactions`, `comments`, `group_members`, `group_invites` 생성 시 FCM + `notifications` 인박스를 기록합니다.

## 3.1 Firestore 보안 규칙

규칙 파일: [`firestore.rules`](../firestore.rules)

| 컬렉션 | 정책 요약 |
|--------|-----------|
| `users` | 로그인 사용자 읽기 · 본인만 생성/수정 (이름·프로필·FCM 토큰) |
| `groups` | 멤버만 읽기 · 초대 코드 조회(`inviteCode` 단건 쿼리)는 가입용으로 허용 · 본인만 멤버 추가/탈퇴 |
| `group_members` | 멤버만 읽기 · 가입/그룹 생성 시 본인 멤버 문서만 생성 |
| `photos` | 그룹 멤버만 읽기/쓰기 · 업로더만 URL 갱신 · 추억 메모 100자 |
| `reactions` / `comments` | 그룹 멤버 · 본인 리액션/댓글만 수정·삭제 |
| `notifications` | 본인만 읽기/읽음 처리 · **클라이언트 생성 불가** (Functions 전용) |
| `group_invites` | 초대자/피초대자만 읽기 · 멤버가 초대 생성 · 피초대자만 수락/거절 |

미디어 파일은 Firestore가 아니라 **R2 presigned URL** + Functions `path-auth`로 보호합니다 → [r2-setup.md](./r2-setup.md)

규칙만 배포:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## 4. 네이티브 클라이언트 파일 (prebuild / FCM)

Expo Go만 쓸 때는 없어도 JS SDK 동작은 가능합니다.  
**개발 빌드·EAS·FCM·네이티브 Google 로그인**을 쓸 때는 Console에서 플랫폼 앱을 등록한 뒤 파일을 받습니다.

1. Firebase Console → **프로젝트 설정** → **내 앱**  
2. **iOS** 앱 추가 → `GoogleService-Info.plist` 다운로드 → 프로젝트 루트  
3. **Android** 앱 추가 → `google-services.json` 다운로드 → 프로젝트 루트  

`app.config.ts`는 파일이 **실제로 있을 때만** `googleServicesFile`을 설정합니다.  
없으면 prebuild가 깨지지 않습니다.

## 4. Admin SDK (서버 / Functions)

루트의 `snap-*-firebase-adminsdk-*.json`은 **로컬·CI에서만** 사용하고 Git에는 올리지 마세요 (`.gitignore` 처리됨).

권장:

- `functions/`에서 Firebase Admin SDK 초기화  
- 또는 `GOOGLE_APPLICATION_CREDENTIALS` 환경 변수로 경로 지정  
- 프로덕션은 [Application Default Credentials](https://firebase.google.com/docs/admin/setup) / Secret Manager

## 5. Sentry

`.env.local`의 `SENTRY_AUTH_TOKEN`은 EAS 빌드·소스맵 업로드용입니다.  
앱 런타임 Firebase 설정과 무관합니다.

## 체크리스트

- [ ] `npm run firebase:verify` 통과 (Firebase / Google / R2 설정 일치)
- [ ] `.env.local`에 `EXPO_PUBLIC_FIREBASE_*` 입력  
- [ ] Admin SDK JSON이 앱 소스/import에 없음  
- [ ] Google 로그인 사용 시 Web/iOS client ID + iOS URL scheme 설정  
- [ ] 네이티브 빌드 시 `google-services.json` / `GoogleService-Info.plist` 배치 (선택)
