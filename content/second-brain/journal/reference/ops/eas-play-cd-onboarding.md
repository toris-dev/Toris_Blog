# EAS / Play Store CD 최초 설정

## 변경 내용 (2026-05-15)

### app.json
iOS에서 `Linking.canOpenURL("youtube://...")` 동작에 필요한 스킴 등록:
`youtube`, `instagram`, `snssdk1233` (TikTok) — 등록하지 않으면 iOS 18+에서 canOpenURL이 항상 false 반환.

### .github/workflows/cd-main.yml — build-eas-android job
- deploy-ec2 성공 후 실행 (새 API 배포 확인 후 앱 배포)
- pnpm workspace 의존성 설치 → EAS CLI 인증 → Play Service Account 키 파일 생성
- `eas build --profile production --platform android --non-interactive --auto-submit`
- EAS 클라우드에서 .aab 빌드 후 자동으로 Play Store production 트랙에 제출

## 최초 1회 수동 진행 순서

1. expo.dev → Account Settings → Access Tokens → 토큰 생성 → GitHub Secrets: `EXPO_TOKEN`
2. Google Cloud Console → 서비스 계정 생성 → JSON 키 발급
3. Google Play Console → 설정 → API 액세스 → 위 서비스 계정에 "릴리스 관리자" 권한 부여
4. JSON 키 파일 전체 내용 → GitHub Secrets: `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY`
5. `eas build --profile production --platform android` (로컬 1회 실행)
   - EAS가 Android 서명 키스토어를 생성·저장
   - .aab 파일을 Play Console에 수동 업로드 (내부 테스트 트랙이라도 OK)
6. 이후부터 main 푸시 시 CD 워크플로우가 자동으로 빌드 + 제출

> `skip_eas: true` 입력으로 workflow_dispatch를 실행하면 EAS job을 건너뛰고 EC2만 배포합니다.
