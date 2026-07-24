# 현장완료 비공개 미디어 저장소 준비

`@fieldstep/server`에는 `MEDIA`라는 비공개 R2 바인딩과 `media_assets` 메타데이터
테이블이 준비되어 있습니다. R2 객체는 공개 URL이나 커스텀 도메인으로 노출하지 않고,
조직·작업 권한 또는 승인 토큰을 확인한 Worker가 원본 바이트를 스트리밍합니다.

## 최초 원격 환경 준비

Cloudflare API 토큰에 R2 버킷 생성·쓰기 권한이 있는지 먼저 확인한 뒤 서버 패키지에서
버킷을 한 번 생성합니다.

```bash
cd fieldstep/apps/server
pnpm exec wrangler r2 bucket create fieldstep-media
```

그 다음 D1 스키마를 적용하고 Worker를 배포합니다.

```bash
pnpm --filter @fieldstep/server run db:migrate:remote
pnpm --filter @fieldstep/server run deploy
```

`db:migrate:local`과 `db:migrate:remote`는 신규 설치용 `d1/0000_init.sql`부터
아직 적용하지 않은 번호형 migration을 ledger 순서대로 적용합니다. 따라서 기존 원격
D1에도 `0001_media_assets.sql`을 포함한 미디어·업무·승인·청구·정기점검 스키마가
전진 적용됩니다.

로컬 테스트와 기존 D1 사진 폴백은 `MEDIA`가 없어도 실행되지만, 원격 배포는
`wrangler.jsonc`에 선언된 `fieldstep-media` 버킷이 먼저 존재해야 합니다.

## 현재 저장 동작

- `MEDIA`가 있으면 새 사진·음성 원본은 R2에 저장되고 D1에는 소유권, MIME, 크기,
  체크섬과 불변 저장 키만 기록됩니다.
- `MEDIA`가 없는 로컬·테스트 환경에서 사진은 기존 `photos.data_url` 경로로
  제한적으로 폴백합니다(원본 1.4MB 이하). 음성 원본은 큰 D1 행을 만들지 않도록
  503으로 명확히 거부합니다.
- 웹은 사진과 음성을 base64 JSON이 아닌 MIME이 지정된 raw binary로 업로드합니다.
  서버는 선언 MIME, magic bytes, 최대 크기(사진 5MB·음성 25MB)를 검증합니다.
- 인증 화면의 미디어 URL은 Bearer 세션으로 보호되고, 공개 보고서 사진 URL은 해당
  승인 토큰의 보고서 버전에 포함된 사진만 읽을 수 있습니다. 두 경로 모두
  `private, no-store` 응답이며 R2 공개 URL은 만들지 않습니다.
- 새 확정 보고서는 D1 폴백 사진도 `photos_json`에 base64 원문을 복제하지 않고
  photo id·종류·캡션·시각만 스냅샷합니다. R2 사진은 여기에 불변 저장 키·MIME·
  체크섬을 더합니다. 기존 inline data URL 버전은 스트리밍 엔드포인트 안에서만
  하위 호환으로 해석합니다.
- 삭제 중 R2 장애가 나면 D1 tombstone을 되돌려 같은 삭제 요청을 재시도할 수
  있습니다. R2 삭제 성공 뒤 메타데이터를 제거합니다.
- 제출 이후에는 사진·음성 추가와 삭제가 잠깁니다.

기존 D1 `photos.data_url`을 R2로 일괄 복사하는 운영 마이그레이션은 별도입니다.
복사·체크섬 검증·보고서 버전 참조 검증 전에는 기존 D1 원본을 삭제하지 마세요.

현재 자동 이메일·SMS·카카오 발송은 외부 발송 서비스와 자격증명 결정 전이라 지원하지
않으며, 초대·승인 링크를 담당자가 복사해 전달하는 흐름입니다. 보고서 초안도 현재는
결정적인 규칙 기반 엔진이며 LLM/STT 연동은 별도의 제품·비용·개인정보 판단 후 진행합니다.
