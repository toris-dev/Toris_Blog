# toris-blog.vercel.app 리다이렉트 셸

GSC 주소 변경(→ https://toris.kr) 완료 전까지 옛 주소를 301(308)로 유지하는
Vercel 프로젝트 `toris-blog`의 설정. (Vercel 계정: ironjustlikethat)

배포 방법: 아래 vercel.json + 빈 public/ 폴더로 `vercel deploy --prod --yes`

```json
{
  "redirects": [
    { "source": "/", "destination": "https://toris.kr/", "permanent": true },
    { "source": "/:path*", "destination": "https://toris.kr/:path*", "permanent": true }
  ]
}
```

- 전 경로 보존 리다이렉트(예: /posts/slug → toris.kr/posts/slug). 글 slug는 Astro와 동일.
- GSC 이전 절차: ① toris.kr 속성 등록·확인 → ② 옛 속성 설정 > 주소 변경 → toris.kr 선택.
- 옛 속성 재확인이 필요해지면(HTML 파일 방식) 해당 파일 경로만 리다이렉트 예외로 추가할 것.
- GSC 이전 후 최소 180일(구글 권장) 유지 후 프로젝트 삭제 가능.
