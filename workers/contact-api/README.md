# toris-contact-api

정적 Astro 사이트와 분리 배포되는 폼 접수 API (Cloudflare Worker, 의존성 없음).

- `POST /contact` — `{name, email, message}` → GitHub 이슈 #16에 코멘트 생성
- `POST /waitlist` — `{slug, projectName, email}` → 프로젝트별 사전등록 이슈 find-or-create + 댓글

## 배포

```bash
cd workers/contact-api
npx wrangler secret put GITHUB_TOKEN   # issues 쓰기 권한 PAT
npx wrangler deploy
```

CORS 허용 오리진은 `wrangler.jsonc`의 `vars.ALLOWED_ORIGIN`으로 관리합니다
(커스텀 도메인 전환 시 갱신).

## Astro 연동

배포된 Worker URL을 Astro 빌드 환경변수로 전달합니다.

```bash
# astro/.env
PUBLIC_CONTACT_API_URL=https://toris-contact-api.<account>.workers.dev
```

폼 컴포넌트에서 `fetch(`${import.meta.env.PUBLIC_CONTACT_API_URL}/contact`, ...)` 형태로 호출합니다.

## 로컬 테스트

```bash
npx wrangler dev   # http://localhost:8787

curl -X POST http://localhost:8787/contact \
  -H 'Content-Type: application/json' \
  -d '{"name":"홍길동","email":"test@example.com","message":"문의합니다"}'

curl -X POST http://localhost:8787/waitlist \
  -H 'Content-Type: application/json' \
  -d '{"slug":"catchmeme","projectName":"밈캐치","email":"test@example.com"}'
```
