<!-- /autoplan restore point: /Users/toris/.gstack/projects/toris-dev-Toris_Blog/main-autoplan-restore-20260716-005439.md -->
# toris.kr SEO & AI Search Optimization Plan

Status: rough plan for `/autoplan` review  
Date: 2026-07-16  
Target branch: `origin/main`  
Primary audience: 기존 서비스를 개선하거나 새 제품을 검증하려는 한국 중소기업 의사결정자

## Outcome

toris.kr을 브랜드 소개 사이트에서 **검색으로 발견되고, 실력을 검증한 뒤, 프로젝트 문의까지 이어지는 개발 스튜디오 사이트**로 강화한다. 성공 기준은 단순 순위가 아니라 다음 퍼널이 실제로 측정되는 것이다.

1. Google·Bing·Naver가 핵심 URL을 정상적으로 크롤링하고 색인한다.
2. `웹사이트 리뉴얼`, `MVP 개발`, `업무 자동화`, `앱 개선` 같은 비브랜드 검색 의도에 답하는 페이지가 생긴다.
3. ChatGPT Search·Perplexity·Google AI 기능·Bing Copilot이 토리스의 1차 경험과 케이스 스터디를 인용할 수 있다.
4. 검색·AI 추천 방문자가 작업 사례를 확인하고 프로젝트 상담 폼을 제출한다.

## Office Hours Discovery

### Problem restatement

현재 사이트의 문제는 콘텐츠 부족이 아니다. 프로젝트·기술 글·제품 운영 경험은 이미 충분하지만, 검색엔진과 외주 고객이 이를 **하나의 명확한 사업 엔터티, 검색 의도별 서비스, 검증 가능한 근거**로 이해하도록 연결하는 구조가 약하다. 따라서 이번 작업은 트래픽을 위한 메타태그 추가가 아니라 `발견 → 신뢰 → 상담` 퍼널을 설계하는 작업이다.

### Three-layer synthesis

- **Layer 1 — 검증된 기본기:** 검색엔진이 안정적으로 크롤링·색인할 수 있는 canonical, redirect, sitemap, language, 내부 링크와 화면에 실제로 보이는 고유 콘텐츠가 먼저다.
- **Layer 2 — 현재 검색·AI 플랫폼 지침:** Google은 AI 검색을 위한 별도 특수 스키마를 요구하지 않고 기존 SEO 원칙을 강조한다. OpenAI와 Perplexity는 검색용 crawler 접근을 별도로 안내하며, Bing은 sitemap·IndexNow와 AI Performance 측정을 제공한다.
- **Layer 3 — Toris에 맞는 결론:** 이미 존재하는 `llms.txt`나 자가 생성 엔터티를 더 늘리는 것보다, 현재의 호스트·sitemap·언어·Person/Organization 불일치를 제거하고 서비스 페이지에 실제 프로젝트 근거를 연결하는 편이 발견성과 인용 가능성을 함께 높인다.

**EUREKA:** AI 검색 최적화는 AI 전용 파일을 많이 만드는 문제가 아니라, 검색엔진이 신뢰할 수 있는 동일한 사실을 사이트 구조·화면 텍스트·구조화 데이터·외부 프로필에서 일관되게 증명하는 문제다.

### Existing assets to reuse

- 대표 프로젝트와 공개 가능한 제품 화면
- 52개 이상의 기술 글과 일부 질문형 직답 블록
- 프로젝트 상담 form, 진행 방식, 소개, 영문 랜딩
- 기존 Organization·WebSite·Article·Breadcrumb·프로젝트 구조화 데이터
- IndexNow script, RSS, sitemap, `llms.txt`, 보안 header

새 CMS나 별도 사업 사이트를 만들지 않고 이 자산을 현재 Astro 코드베이스 안에서 재구성한다.

## Confirmed Premises

- **P1. 브랜드 표기:** 등기 법인이 아닌 개인사업자 상호는 `토리스`, 영문 표기는 `Toris`로 사용하고 `software/product studio`는 설명어로만 쓴다. `Toris Studio`를 별도 법인명이나 canonical 브랜드명으로 사용하지 않는다.
- **P2. 핵심 고객:** 검색 유입의 1차 고객은 기존 서비스를 개선하려는 한국 중소기업이다. 개발자 독자는 블로그의 신뢰 자산이지만 루트 전환 목표의 1차 대상은 아니다.
- **P3. 우선 시장:** 한국어 상업 검색 의도를 먼저 잡고 `/en`은 브랜드 확인용 영문 원페이지로 유지한다. 영문 리드 획득은 이번 사이클의 주목표가 아니다.
- **P4. GEO 원칙:** AI 전용 편법보다 검색 색인, 독창적 1차 경험, 정확한 엔터티, 인용 가능한 텍스트를 우선한다. `llms.txt`는 보조 자산이며 핵심 랭킹 수단으로 취급하지 않는다.
- **P5. 외부 엔터티:** 독립적이고 신뢰할 수 있는 보도가 생기기 전에는 Wikidata 항목을 직접 만들지 않는다. 온라인 전용 사업이라면 Google Business Profile도 만들지 않는다.
- **P6. 외부 계정:** Search Console, Bing Webmaster Tools, 네이버 서치어드바이저, LinkedIn, GitHub, Cloudflare 설정은 별도 사용자 승인과 자격 증명이 있을 때만 수행한다.

## Implementation Alternatives

### Approach A — Technical Integrity Sprint (minimal viable)

- **Summary:** canonical host, Astro 배포 source, sitemap, robots, `/en` language, Person/Organization schema 오류만 바로잡고 검증 script를 추가한다.
- **Effort:** S
- **Risk:** Low
- **Pros:** 가장 빠르게 잘못된 검색 신호를 제거한다; 수정 범위와 회귀 위험이 작다; 색인 문제의 원인을 먼저 격리할 수 있다.
- **Cons:** 비브랜드 서비스 검색을 받을 새 페이지가 없다; 방문 후 상담 전환 구조는 거의 개선되지 않는다; AI가 인용할 새로운 사업 근거가 제한적이다.
- **Reuses:** 기존 Astro SEO component, sitemap/robots route, IndexNow script, `/en`, 정적 build.

### Approach B — Search-to-Consultation Foundation (recommended)

- **Summary:** Approach A 전체에 `/services` hub와 세 개의 검색 의도 페이지, 사례·블로그·문의 내부 링크, 최소한의 전환 측정을 더한다.
- **Effort:** M–L
- **Risk:** Medium
- **Pros:** 발견성과 상담 전환을 한 번에 연결한다; 기존 프로젝트와 기술 글을 신뢰 자산으로 재사용한다; 7일·28일 단위로 무엇이 효과가 있었는지 측정할 수 있다.
- **Cons:** 서비스 문구와 사례 근거를 정확하게 선별해야 한다; 페이지 수가 늘어 QA 범위가 커진다; 외부 webmaster 도구 데이터가 없으면 초기 목표치는 baseline 이후 확정해야 한다.
- **Reuses:** 기존 홈/작업 사례/진행 방식/문의 UI, 프로젝트 data, 블로그 content collection, Astro layout·motion·responsive pattern.

### Approach C — Evidence Publishing Platform (ideal architecture)

- **Summary:** Approach B를 기반으로 서비스·사례·벤치마크를 구조화된 content schema로 통합하고, 변경 URL 기반 IndexNow·고유 OG asset·다국어·검색/AI 성과 dashboard까지 자동화한다.
- **Effort:** XL
- **Risk:** High
- **Pros:** 장기적으로 콘텐츠 운영과 엔터티 일관성이 가장 좋다; 새 사례·언어·서비스를 반복 가능한 방식으로 확장한다; AI 인용용 원자료와 성과 관측을 체계화할 수 있다.
- **Cons:** 현재 규모에는 과한 CMS/분석 인프라가 될 수 있다; 가치 검증 전에 구현 비용이 크다; 콘텐츠 생산 병목을 기술로만 해결하지 못한다.
- **Reuses:** 기존 content collections, project data, build/deploy scripts, 현재 SEO/GEO 보고서의 유효한 항목.

**Recommendation:** Approach B. 사용자가 원하는 것은 검색 순위 자체가 아니라 기존 서비스를 개선하려는 중소기업이 Toris를 발견하고 실력을 확인한 뒤 문의하는 흐름이므로, 기술 정합성만 고치는 A보다 사업 성과에 직접 연결되고 C보다 과투자를 피한다.

## Verified Baseline

### Already implemented

- Astro 정적 HTML, canonical, title/description, Open Graph, RSS/feed
- `BlogPosting`, `BreadcrumbList`, `Organization`, `WebSite`, 제품 `ItemList` 구조화 데이터
- 가시적 글 byline과 저자 소개 블록
- `/sitemap.xml`, Astro `/sitemap-index.xml`, `/llms.txt`, `/llms-full.txt`
- IndexNow 배포 스크립트와 네이버 사이트 인증 메타태그
- HSTS 등 보안 헤더와 PNG 기본 OG 이미지
- 질문형 직답 블록이 포함된 일부 기술 글과 케이스 스터디

### Verified gaps on the live site

- `http://toris.kr`과 `https://www.toris.kr`가 canonical 호스트로 리다이렉트되지 않고 `200`을 반환한다.
- `/en`이 `<html lang="ko">`, `og:locale=ko_KR`, JSON-LD `inLanguage=ko-KR`로 출력되고 상호 `hreflang`이 없다.
- Person JSON-LD의 `name`이 실제 저자 `유주환`이 아니라 브랜드 `토리스`이고, 개인 이미지에 회사 로고를 사용한다.
- Organization `sameAs`에 조직 프로필이 아니라 대표 개인 LinkedIn/X 프로필이 들어가 엔터티 경계가 흐리다.
- `/sitemap.xml`과 `/sitemap-index.xml`이 서로 다른 내용·lastmod 정책으로 중복 제공된다.
- custom sitemap에 `/blog`로 redirect되는 `/posts`가 포함되고, 정적 페이지 lastmod가 빌드할 때마다 갱신된다.
- 저장소에 Astro와 이전 Next SEO 출력이 함께 남아 있다. 이전 Next 경로의 robots·sitemap·`llms.txt`는 `toris-blog.vercel.app`을 가리키며 일부 route는 홈 canonical을 상속할 수 있어, 잘못된 배포 경로가 재사용되면 canonical host가 퇴행한다.
- IndexNow가 변경 URL이 아닌 전체 URL을 반복 제출할 가능성이 있다.
- Organization의 logo가 실제 정사각형 로고가 아니라 1200×630 OG card를 가리킨다.
- Cloudflare managed robots는 AI 학습용 bot 일부를 차단한다. 이 정책은 유지할 수 있지만 `OAI-SearchBot`·`PerplexityBot` 같은 AI 검색용 crawler 허용과 혼동하지 않고 live response로 분리 검증해야 한다.
- Search Console/Bing/Naver의 실제 색인·검색어·AI 인용 데이터가 저장소에 연결돼 있지 않아 성과 측정 기준이 없다.
- 현재 검색 스캔에서 `site:toris.kr` 결과를 확인하지 못했다. 엔진별 계정 데이터로 실제 색인 상태를 검증해야 한다.
- 서비스 검색 의도를 전담하는 `/services` 정보 구조가 없고, 홈·프로젝트·블로그의 내부 링크가 상담 퍼널로 충분히 수렴하지 않는다.

## Workstreams

### W1. Crawl, canonical, and index integrity

1. Cloudflare에서 `http → https`와 `www → apex`를 영구 리다이렉트한다.
2. Astro를 production SEO의 단일 source of truth로 명시하고, 이전 Next SEO route·retired Vercel host가 다시 배포 산출물에 섞이지 않게 제거하거나 동일 canonical policy로 정리한다.
3. robots 정책을 검색, AI 검색 입력, AI 학습으로 분리한다. 최소한 `Googlebot`, `OAI-SearchBot`, `PerplexityBot`, Bing 계열 검색 크롤러가 막히지 않는지 라이브 응답과 Cloudflare AI Crawl Control에서 검증한다.
4. sitemap을 하나의 권위 경로로 통합한다. redirect URL은 제외하고 canonical URL만 포함하며 콘텐츠의 실제 수정일만 lastmod로 사용한다.
5. IndexNow는 추가·수정·삭제된 URL만 제출하고 key 검증, 200/202/4xx 처리, 재시도·로그를 명시한다.
6. 404·redirect·canonical·robots·sitemap 간 모순과 retired host 문자열을 자동 검증하는 경량 스크립트를 추가한다.

Affected areas: `astro/astro.config.mjs`, `astro/public/_redirects`, `astro/src/pages/robots.txt.ts`, `astro/src/pages/sitemap.xml.ts`, `scripts/indexnow-ping.mjs`, 배포 설정.

### W2. Entity and structured-data correctness

1. Person을 `유주환`으로, Organization을 `토리스`로 분리하고 각 `@id`, `url`, `sameAs`, 이미지가 실제 보이는 콘텐츠와 일치하게 만든다.
2. 등록 상호와 설명용 영문 브랜드를 구분해 `name`, `legalName`, `alternateName`을 과장 없이 정리한다.
3. `/about`의 대표 섹션에 연결되는 저자 URL을 만들고 Article `author.url` 또는 안정적인 Person `@id`로 연결한다.
4. `datePublished`와 `dateModified`를 frontmatter의 실제 값에서 생성하고 화면에도 게시일·수정일을 구분해 표시한다.
5. 지원되는 Article·Organization·ProfilePage·Breadcrumb·SoftwareApplication 중심으로 유지하고, 검색 노출 효과가 제한된 FAQPage 남발은 하지 않는다.
6. JSON-LD가 화면 텍스트와 일치하는지 빌드 결과를 검증한다.
7. Organization logo는 실제 정사각형 브랜드 asset을 사용하고 1200×630 social preview와 역할을 분리한다.

Affected areas: `astro/src/components/SEO.astro`, `astro/src/layouts/Base.astro`, `astro/src/lib/site.ts`, `astro/src/pages/about.astro`, 포스트 레이아웃과 콘텐츠 스키마.

### W3. Search-intent service architecture

1. 상단 nav에 `서비스`를 추가하고 `/services` 허브를 만든다.
2. 검증 가능한 역량과 사례가 있는 세 하위 페이지를 만든다.
   - `/services/web-app-renewal`: 기존 웹·앱 리뉴얼과 레거시 개선
   - `/services/mvp-development`: 아이디어 검증부터 출시까지 MVP 개발
   - `/services/workflow-automation`: 반복 업무와 AI 워크플로 자동화
3. 각 페이지는 문제 징후 → 해결 범위 → 실제 사례 → 진행 방식 → 예상 산출물 → FAQ가 아닌 자연어 질문/직답 → 상담 CTA 순서의 반응형 layout으로 구성한다.
4. 홈, 프로젝트, 관련 케이스 스터디, 진행 방식, 문의 form을 문맥 링크로 연결한다.
5. 과장된 순위 키워드 반복 대신 고객이 실제로 묻는 비용·기간·리스크·인수인계·운영 질문에 답한다.
6. 로딩·오류가 없는 정적 페이지에서도 모바일 nav, keyboard focus, CTA touch target, reduced-motion을 검증한다.

Affected areas: 새 `astro/src/pages/services/**`, nav/footer, `astro/src/pages/index.astro`, `astro/src/pages/projects.astro`, `astro/src/pages/process.astro`, `astro/src/pages/contact.astro`, 공용 component와 styles.

### W4. Evidence-led content and citation design

1. 대표 케이스 4~6개에 공개 가능한 기간·규모·성능·운영 지표와 측정 방법을 추가한다. 숫자를 만들지 않고 근거가 없으면 정성 결과로 명시한다.
2. 각 서비스 페이지에 관련 케이스와 기술 글을 연결하고, 글 하단에는 다음 행동을 한 개만 제시한다.
3. 대표 글의 첫 화면에 핵심 질문과 2~3문장 직답을 유지하되 페이지마다 동일 템플릿 문구를 복제하지 않는다.
4. 원본 비교·벤치마크 글 1편을 작성한다. 환경, 버전, 테스트 절차, 원자료, 한계를 공개해 재현 가능한 1차 자료로 만든다.
5. 콘텐츠 캘린더는 검색량 추정치가 아니라 GSC/Bing의 실제 query와 상담 질문으로 갱신한다.
6. 각 핵심 페이지에 고유 1200×630 이미지와 의미 있는 alt를 제공하고, 필요한 경우 실제 제품 데모 비디오를 포함한다.

### W5. Language, discovery, and measurement

1. `/en`의 HTML lang, Open Graph locale, JSON-LD language를 `en`/`en_US`로 고치고 `/`와 `/en` 사이에 reciprocal hreflang 및 `x-default`를 추가한다.
2. Google Search Console, Bing Webmaster Tools(AI Performance 포함), 네이버 서치어드바이저에 canonical sitemap을 제출한다.
3. 기준표를 만든다: indexed URLs, crawl errors, impressions, clicks, non-brand queries, branded entity queries, AI citations, ChatGPT/Perplexity/Bing referrals, qualified contact conversions.
4. 상담 form에 개인 정보를 추가 수집하지 않는 범위에서 landing path와 UTM을 기록해 검색 유입→문의 전환을 연결한다.
5. 배포 전후 7일·28일 비교를 사용하고, 색인과 AI 인용은 보장하지 않으며 관측값으로 판단한다.

## External Actions Requiring Explicit Confirmation

- Cloudflare redirect 및 AI Crawl Control 변경
- Google Search Console 소유권 확인과 sitemap 제출
- Bing Webmaster Tools 등록, sitemap 제출, AI Performance 확인
- 네이버 서치어드바이저 제출
- GitHub profile website와 주요 공개 repository 링크 정리
- LinkedIn 회사 페이지 생성 또는 수정
- 커뮤니티 글 게시, YouTube 업로드, 외부 메시지 발송

Wikidata 직접 생성과 온라인 전용 사업자의 Google Business Profile 생성은 이번 계획에서 제외한다. 독립 매체 보도 또는 대면 서비스 자격이 생기면 정책을 다시 검토한다.

## Acceptance Criteria

### Technical

- `http://toris.kr/*`와 `https://www.toris.kr/*`가 path/query를 보존하며 `https://toris.kr/*`로 301 또는 308 이동한다.
- 모든 indexable page가 self-canonical 1개, 유효한 title/description, 올바른 language metadata를 가진다.
- authoritative sitemap 1개가 canonical 200 URL만 포함하고 실제 lastmod를 제공한다.
- production build와 deploy 설정이 Astro 한 경로를 가리키고, indexable output 어디에도 retired `toris-blog.vercel.app` canonical이 남지 않는다.
- OAI-SearchBot·PerplexityBot·Googlebot·Bingbot이 핵심 페이지를 200으로 읽고, 의도한 학습 차단 정책과 검색 허용 정책이 모순되지 않는다.
- JSON-LD 파싱, 내부 링크, redirect chain, sitemap URL, IndexNow payload를 자동 테스트한다.

### Content and UX

- 서비스 hub와 3개 하위 페이지가 desktop/mobile에서 읽히고 keyboard로 모든 nav·CTA·form을 사용할 수 있다.
- 각 서비스 페이지가 하나 이상의 실제 사례와 `/contact`를 연결한다.
- 저자명, 사업자 상호, 영문 표기, 사이트 URL이 visible content와 metadata에서 일치한다.
- 대표 콘텐츠가 원자료·방법·한계를 포함하며 재현 가능한 인용 단위를 제공한다.

### Measurement

- GSC·Bing·Naver 중 승인된 도구에서 sitemap 처리 상태와 색인 수를 기록한다.
- 28일 기준 non-brand impression, AI citation/referral, qualified contact conversion을 baseline과 비교할 수 있다.
- 목표 수치를 데이터 없이 선설정하지 않고 첫 28일 baseline 후 현실적인 개선 목표를 확정한다.

## Delivery Sequence

1. **Critical integrity:** canonical redirects, language metadata, entity/schema correction, sitemap/IndexNow consolidation.
2. **Commercial information architecture:** `/services` hub + 3 intent pages + internal linking + contact attribution.
3. **Evidence content:** case-study metrics, one reproducible benchmark, unique media.
4. **External registration:** approved webmaster tools and platform profiles.
5. **Measure and iterate:** 7/28-day checks, query-driven content updates.

## NOT in Scope

- 순위나 AI 답변 노출 보장
- 검색엔진 정책을 우회하는 대량 생성 콘텐츠·백링크 구매·키워드 스터핑
- 독립 출처 없이 Wikidata/Wikipedia를 홍보 디렉터리로 사용하는 작업
- 대면 고객 접점이 없는 상태에서 Google Business Profile 생성
- 모든 블로그 글의 전면 재작성
- 유료 광고 집행

## Primary References

- Google Search Central, AI features and AI optimization: https://developers.google.com/search/docs/appearance/ai-features
- Google Search Central, generative AI optimization guide: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- OpenAI Publisher FAQ: https://help.openai.com/en/articles/12627856-publishers-and-developers-faq
- Perplexity crawler documentation: https://docs.perplexity.ai/docs/resources/perplexity-crawlers
- IndexNow documentation: https://www.indexnow.org/documentation
- Google Organization and Article structured data: https://developers.google.com/search/docs/appearance/structured-data/organization and https://developers.google.com/search/docs/appearance/structured-data/article
- Bing AI Performance: https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview
- Wikidata notability/self-promotion: https://www.wikidata.org/wiki/Wikidata:Notable and https://www.wikidata.org/wiki/Wikidata:Self-promotion
- Google Business Profile eligibility: https://support.google.com/business/answer/13763036
