---
brand_name: Toris Blog
domain: toris-blog.vercel.app
geo_score: 64
business_type: Publisher (개인 기술 블로그)
date: 2026-07-07
location: KR / ko-KR
---

# GEO + SEO Audit — Toris Blog

**종합 GEO 점수: 64 / 100 — Fair (강한 기술·온페이지 기반 / 약한 외부 권위)**

한 줄 요약: **기술·구조·크롤러 접근·인용가능성은 개인 블로그 중 최상위권**인데, 종합 점수는 **브랜드/엔티티 외부 권위(8/100)** 하나가 거의 전부를 끌어내립니다. 온페이지는 이미 "AI가 인용하기 좋은" 상태이고, 앞으로의 성장은 대부분 **오프사이트(엔티티 corroboration)** 에서 나옵니다.

---

## 카테고리 점수

| 카테고리 | 가중치 | 점수 | 상태 |
|---|---|---|---|
| AI Citability & Visibility | 25% | **85** | 우수 |
| Brand Authority Signals | 20% | **8** | 위험 (병목) |
| Content Quality & E-E-A-T | 20% | **74** | 양호 |
| Technical Foundations | 15% | **82** | 양호 |
| Structured Data | 10% | **80** | 양호 |
| Platform Optimization | 10% | **63** | 보통 |
| **종합** | | **64** | **Fair** |

플랫폼별: Google AI Overviews 68 · Perplexity 67 · ChatGPT 66 · Bing Copilot 64 · Gemini 51.

---

## 잘 되어 있는 것 (건드리지 말 것)

- **완전한 SSR/프리렌더** — 포스트 본문·제목·메타·JSON-LD가 초기 HTML에 존재. JS 실행 없이도 GPTBot/ClaudeBot/PerplexityBot이 전체 내용을 봄. (`x-nextjs-prerender: 1` 확인). GEO에서 가장 중요한 항목이고 이미 정답.
- **AI 크롤러 명시 허용** — robots.txt가 GPTBot·ChatGPT-User·ClaudeBot·Google-Extended·PerplexityBot을 명시적으로 `Allow`. (크롤러 접근 98/100)
- **llms.txt 존재** + `## Citation` 섹션(모델에게 인용 방법을 알려줌 — 드물게 사려 깊음).
- **탄탄한 JSON-LD** — `@graph`(Person→WebSite→WebPage→BreadcrumbList→BlogPosting), `speakable`, `SearchAction`, `datePublished/dateModified/wordCount/inLanguage`.
- **인용 가능한 콘텐츠** — AI 시리즈 포스트의 정의 블록·비교표·TL;DR·통계·공식 출처, 그리고 21n 회고의 1인칭 실경험(가짜로 못 만드는 Experience 신호).
- **최신성** — 발행일 분 단위 표기, 프론티어 주제를 실시간으로 다룸.

---

## 핵심 문제 (여러 에이전트가 공통 지적)

### 🔴 Critical
1. **브랜드/엔티티 외부 권위 ≈ 0** (Brand 8/100). Wikipedia/Wikidata 없음, Reddit/YouTube/velog 발자국 없음. AI 모델이 "Toris Blog"를 알려진 엔티티로 인식할 제3자 신호가 없음. → **종합 점수의 실질적 병목.** 온페이지로는 못 고침(오프사이트 필요).
2. **메타 description = 원시 마크다운 덤프** (Technical·Schema 공통 HIGH). `description`/`og:description`/`twitter:description`이 포스트 마크다운을 그대로 긁어 `# 제목 <img src="...unsplash...">`로 시작. **모든 포스트의 검색 스니펫·소셜/AI 프리뷰가 깨짐.** AI가 이 텍스트를 그대로 인용함. → 사이트 전역, 가장 큰 온페이지 버그.

### 🟠 High
3. **JSON-LD `@graph` 중복 출력** — 페이지마다 `<script type="application/ld+json">`이 2개(축약본+전체본, 같은 `@id`). 레이아웃 레벨 + 페이지 레벨 인젝터 중복. 한 번만 출력할 것.
4. **`publisher`가 Organization이 아님** — BlogPosting의 publisher가 `Person`(logo 없음) → Rich Results "publisher logo 누락" 경고. `Organization` 노드 추가 후 publisher를 그쪽으로.
5. **Person.sameAs 얕음(3개, Discord는 약한 신호)** — LinkedIn·Wikidata 추가가 최대 레버(위키피디아 없는 것의 기계 판독 대체물). Schema·Platform·AI-visibility 모두 공통 지적.
6. **llms.txt가 얇음** — 네비게이션 링크만. 대표 포스트(AI 시리즈, 21n 회고)를 `- [제목](/posts/slug): 한 줄 설명`으로 나열 + `/llms-full.txt` 추가하면 68→90.
7. **INP/Core Web Vitals 위험(High)** — framer-motion + 홈 3D + 읽기 진행바 + AdSense/GTM 서드파티 JS가 메인스레드 부담. 크롤러 가시성엔 무관하나 실사용 필드 점수 위험.
8. **Naver Search Advisor + Google Search Console 미등록** — 한국어 블로그는 Naver(Yeti)가 주요 발견 경로이자 한국어 AI 답변 소스. GSC는 Gemini/Knowledge Graph 신뢰의 전제.

### 🟡 Medium / Low
9. **답변형 콘텐츠 부족** — 질문형 H2 아래 40~60자 직답 블록 + FAQPage 스키마가 AIO/ChatGPT/Perplexity 추출에 유리.
10. **보안 헤더 누락** — `X-Content-Type-Options: nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, 기본 CSP (HSTS는 이미 있음).
11. **head 버그** — 빈 `<title></title>` 중복, `og:image:height=630` vs 실제 `h=600` 불일치, 서드파티 origin `preconnect` 누락.
12. **한글 슬러그 퍼센트 인코딩** — `/posts/Thiel-Fellowship%EA%B3%B3...` 공유성↓. 신규 포스트는 ASCII 슬러그(예: `harness-engineering`처럼).
13. **이미지가 제네릭 Unsplash 스톡** — 프로젝트 스크린샷/아티팩트로 교체 시 Experience 신호↑ + 유일한 "AI 콘텐츠 냄새" 제거.
14. **원본 데이터 포스트 부재** — AI 시리즈에 재현 가능한 벤치마크(Claude Code vs Codex 동일 태스크 타이밍/토큰) 1편이면 "의견"→"인용 가능한 1차 출처".

---

## 90일 로드맵 (우선순위)

### 즉시 (온페이지, 대부분 이 저장소 코드 수정 — 내가 바로 구현 가능)
- [ ] **메타 description 생성 수정** — 마크다운/HTML 제거 후 프론트매터 `description` 또는 정제된 첫 155자. (`src/utils/markdown.ts`, JSON-LD 빌더)
- [ ] **JSON-LD 중복 제거** — `@graph` 1회만 출력.
- [ ] **Organization 노드 추가** + 모든 `publisher`를 `#organization`(logo 포함)으로.
- [ ] **Person.sameAs 확장** — LinkedIn + Wikidata(+velog/dev.to). (`src/utils/jsonLd/site.ts`)
- [ ] **robots에 OAI-SearchBot, Applebot-Extended, Amazonbot 명시** + 와일드카드 `Crawl-delay` 재검토. (`src/app/robots.ts`)
- [ ] **보안 헤더 5종 추가** + head 버그(빈 title, og:image 치수) 정리.
- [ ] **llms.txt에 대표 포스트 목록 + /llms-full.txt.**

### 1~4주 (전략, 오프사이트 — 점수 병목 해소)
- [ ] **GitHub `toris-dev` 프로필 README에 블로그 링크** + 리포 공개/설명 정비 (가장 현실적인 권위 레버).
- [ ] **대표 3편(하네스/21n 회고/AI 시리즈)을 velog·dev.to·Hashnode에 canonical 링크로 크로스포스트.**
- [ ] **Naver Search Advisor + Google Search Console 등록**, 사이트맵 제출, 소유 인증.
- [ ] **Wikidata 항목 생성**(엔티티) → sameAs에 연결.

### 1~3개월 (콘텐츠 심화)
- [ ] **원본 데이터 1편** — Claude Code vs Codex 동일 태스크 재현 벤치마크(타이밍·토큰·결과).
- [ ] **회고/서사 포스트에 TL;DR + 구체 수치 + 풀쿼트** 보강(70→82 인용가능성).
- [ ] **답변형 블록 + FAQPage** 스키마.
- [ ] **스톡 이미지 → 프로젝트 스크린샷/아티팩트.**
- [ ] **INP 개선** — framer-motion/3D/진행바 지연 마운트, AdSense/GTM `lazyOnload`.

---

## 비고
- robots.txt에 대한 초기 오해(“AI 크롤러 규칙 없음”)는 라이브 파일 확인 결과 **틀렸고**, 실제로는 주요 AI 크롤러를 명시 허용 중(98/100).
- 콘텐츠는 사람 저술(진정성 높음)로 확인 — 유일한 "AI 냄새"는 제네릭 스톡 이미지뿐.
- 점수 해석: 64는 "고칠 게 많다"가 아니라 **"온페이지는 거의 다 됐고, 성장 여력이 오프사이트 권위에 몰려 있다"** 는 뜻.

*Generated by /geo audit — GEO-first, SEO-supported.*
