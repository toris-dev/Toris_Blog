# Designer B — 툴·Web3 계열 4종 디자인 스펙

## tracedesk
톤: 인디고 신뢰 · "내 데이터는 내 컴퓨터에". accent #6366F1 → #8B5CF6.
배경: bg-slate-50 dark:bg-[#050810], 카드 bg-white dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-white/10.

### 히어로
- 헤드라인: "오늘 하루," / "어디에 쓰였을까" (두 줄, 둘째 줄 indigo→violet 그라디언트)
- 서브카피: "앱 사용·복사·캡처·유휴 시간을 서버 없이 로컬에만 기록하는 개인 활동 일지."
- CTA: 1차 "무료 다운로드" (indigo 필, hover glow, whileTap 0.97) / 2차 "작동 방식 보기" (앵커)
- 신뢰 뱃지: "macOS · Windows · Linux" "100% 로컬 저장" "외부 전송 0건"
- 목업(OS 윈도우): 사이드바(타임라인/분석/모니터/설정) + 타임라인 피드:
  09:12 · VS Code — toris-blog · 47분 집중 (indigo dot) / 10:03 · 클립보드 복사 — "framer-motion stagger" (violet) / 10:41 · 스크린샷 캡처 — Figma (sky) / 11:00 · 유휴 12분 (slate, dashed). 우상단 "오늘 생산성 87점" 링 게이지.

### 섹션 (7)
1. 히어로 — word-stagger 0.06 y:24→0, 목업 opacity 0/y:60/rotateX:8 → 0.8s spring
2. 문제 — "기억은 흐릿하고, 타임 트래커는 번거롭다" 3카드(수동 기록/클라우드 불안/회고 없음) stagger 0.12, hover y:-6
3. 타임라인 채워짐(시그니처 A) — 좌 카피 sticky, 우 타임라인 스크롤 채움
4. 생산성 점수 — 링 게이지 0→87 카운트업+strokeDashoffset 1.2s. 시간별 집중도 바 24개 stagger 0.03 아래서 자람, 집중 구간만 indigo
5. 프라이버시 아키텍처 — "데이터는 이 다이어그램 밖으로 나가지 않습니다" [Rust Agent]→[SQLite]→[React UI] pathLength 순차, 외부 점선 화살표에 빨간 X 뱃지 scale pop
6. 내보내기&모니터 — 2열: JSON/CSV 파일 카드 hover 기울임 + CPU 34%/메모리 58% 미니 링
7. 최종 CTA — "오늘부터 하루를 기록하세요" + 무료 다운로드. GitHub은 푸터 소형 링크

### 시그니처
- A. 타임라인 채우기: useScroll offset ["start 0.8","end 0.4"]. 축선 scaleY progress(origin-top). 항목 5개 각각 [i*0.18, i*0.18+0.15]→opacity/x(-16→0). 도트 scale 0→1.2→1. 좌 카피 progress 0.5에 문장 교체(AnimatePresence).
- B. 게이지: useMotionValue(0)+animate(87, 1.2s), Math.round 바인딩, once 0.5.
- reduced: 완성 상태 즉시.

### 컬러: CTA·활성 도트/축선·게이지·연결선·overline만 accent. glow는 히어로+최종 CTA 2곳.

## devpulse
톤: 그린 해커 · 터미널 미학 · "비용 0원". accent #22C55E → #4ADE80.
터미널은 라이트에서도 다크(bg-[#0B1120]). 헤드라인 font-mono 혼용.

### 히어로
- 헤드라인: "$ devpulse run --daily" (모노, 타이핑) + "뉴스 수집부터 비디오까지, 로컬 LLM 하나로."
- 서브카피: "API 비용 없이 크롤링 → 요약 → 카드뉴스 → 숏폼 렌더링을 완전 자동화하는 파이프라인."
- CTA: 1차 "GitHub에서 시작하기" (green 필+GitHub SVG, devpulse만 예외) / 2차 "파이프라인 보기"
- 목업(터미널): 로그 순차 출력:
  $ devpulse run --daily
  ✔ crawl    12 sources · 47 articles        (3.2s)
  ✔ dedupe   47 → 18 unique                  (0.4s)
  ⠋ summarize  qwen2.5:14b · 18/18 done      (41s)
  ✔ cards    18 cards rendered → ./out/cards (6.1s)
  ✔ video    1080x1920 · 58s · h264          (22s)
  ✨ done — total cost: $0.00
  $0.00은 green bold + glow pulse 1회.

### 섹션 (7)
1. 히어로 — 타이핑(A), CTA는 로그 후 0.2s fade-up
2. 문제 — "매일 뉴스 정리에 쓰는 시간, 그리고 API 청구서" 수작업 카드 4개 + "GPT-4o 월 $84" 붉은 카드
3. 파이프라인 점등(B) — Crawl→Dedupe→Summarize→Design→Render 5노드
4. 비용 제로 — 바 차트: "OpenAI API $84/mo"(slate 김) vs "devPulse $0/mo"(green 짧음+"전기세 조금"). scaleX 0→1 origin-left, 카운트업. 뱃지 "Ollama · qwen2.5 · 프라이버시 유출 0"
5. 결과물 갤러리 — 카드뉴스 3장(9:16 CSS 목업) 부채꼴, hover 펼침(rotate ±6→±14). 비디오 프레임(재생 버튼+58s 바)
6. cron — "0 7 * * * devpulse run --daily && devpulse publish" 코드블록, 커서 blink. "자는 동안 파이프라인이 돈다."
7. 최종 CTA — "$ git clone github.com/toris-dev/devPulse" 복사 버튼(클릭 시 체크 morph) + GitHub CTA

### 시그니처
- A. 터미널 타이핑: 명령줄 글자 stagger 0.045. 로그 줄 delay 0.5/0.9/1.3/2.1/2.6/3.2s. 스피너 0.8s 후 ✔ 치환(AnimatePresence popLayout). reduced: 즉시 전체.
- B. 파이프라인: sticky 300vh. progress 5구간→노드 slate→green 트윈, 연결선 pathLength [i/5,(i+1)/5]. 캡션 교체("47개 기사 수집"→"중복 제거"→"로컬 요약 중"→"카드 디자인"→"mp4 렌더"). 모바일 세로 스택.

### 컬러: ✔·$0.00·활성 노드·승자 바·1차 CTA만 green. 라이트 본문 green은 #16A34A 보정.

## pepebear
톤: 네온 그린 에너지 · 밈+프로덕트급. accent #10B981 → #84CC16.
배경: bg-slate-50 dark:bg-[#03070a]. 라이트는 민트 틴트 카드.

### 히어로 (풀블리드 대시보드형)
- 헤드라인: "HODL. LAUGH. MOON." (초대형 단어별, MOON에 green→lime+glow)
- 서브카피: "포인트 얻고, 업적 깨고, 레벨업하는 게임화된 Solana 밈코인 커뮤니티."
- CTA: 1차 "지갑 연결하고 시작" (네온 필+glow 링 확산) / 2차 "$PEPEBEAR 차트 보기"
- 라이브 카운터 3개: "홀더 12,847" "24h 볼륨 $1.2M" "업적 해금 38,412" — 카운트업 후 8~15s 간격 +1~12 틱 롤링. LIVE 뱃지 pulse. 배경 캔들 차트 실루엣 5% opacity y-패럴랙스.

### 섹션 (7)
1. 히어로
2. 문제(밈 톤) — "차트만 보는 홀딩은 지루하다" 회색 포트폴리오 vs 컬러풀 PEPEBear 화면, 스크롤 시 grayscale 카드 뒤로/컬러 앞으로
3. 홀더 리더보드(A) — 순위 셔플
4. 게임화 루프 — "참여→포인트→업적/레벨업" 3카드: +250 토스트, "Diamond Paws" 해금 flash, Lv.7→8 바. 뱃지 rotateY 180→0 flip
5. 페이즈 타임라인(B)
6. 지갑 연동 — Phantom/Solflare SVG 카드+"원클릭 연결", 성공 토스트 "✓ 7xKp…3Fgh connected"
7. 최종 CTA — "달까지 같이 갈 사람?" lime glow+파티클 도트 6개

### 시그니처
- A. 순위 셔플: 5행 layout+AnimatePresence, 6s 인터벌 스왑. 상승 행 green ▲+bg flash 1s. 데이터: whale.sol 2.41M / bearmaxi 1.87M / moonboy_ 942K / hodlqueen 618K / anon4821 337K. 뷰포트 밖 인터벌 정지, reduced 비활성.
- B. 페이즈: sticky 250vh. 진행바 scaleX. 노드 0.15/0.5/0.85 활성(scale 1.25, 캡션: 공정 런칭·LP 소각 / 홀더 10K·CEX 논의 / 생태계 확장). Moon 시 로켓 y:20→-40 rotate -12 발사+dash 궤적.

### 컬러: 헤드라인 키워드·CTA·LIVE·진행바·상승만 green-lime. tabular-nums. 라이트 #059669 보정.

## yeti
톤: 아이스 블루 레트로 · 2004 플래시 노스탤지어. accent #0EA5E9 → #7DD3FC.
배경: bg-slate-50 dark:bg-[#04101c]. 헤드라인 픽셀 느낌(letter-spacing+하드 섀도 4px 4px 0), 본문 산세리프.

### 히어로
- 헤드라인: "PENGUIN GO FLY." (단어별 scale 1.4→1 하드 스냅 ease [0.83,0,0.17,1])
- 서브카피: "펭귄을 날려버리던 2004년 그 게임, Solana 밈코인으로 부활했다."
- CTA: 1차 "Pump.fun에서 $YETI 받기" (sky 필, box-shadow 4px 4px 0 픽셀 보더, whileTap 오프셋 0 눌림) / 2차 "로드맵 보기"
- 목업 = 게임 스코어보드 HUD: "SCORE 322.5m · BEST 1,337m · ×3" + 펭귄 포물선 씬(A). 눈 언덕 SVG 2겹 시차, 픽셀 눈송이 8개 하강 루프.

### 섹션 (7)
1. 히어로 — 로드 시 1회 자동 발사, "다시 날리기" 버튼
2. 그 시절 — "쉬는 시간마다 펭귄을 날렸다" 2004 게임 오마주(4:3, 픽셀 예티+배트, 스캔라인 repeating-linear-gradient). whileInView CRT 켜짐(scaleY 0.005→1+brightness flash)
3. 부활 선언 — "이번엔 블록체인 위에서" 픽셀 펭귄→화살표→코인 SVG 크로스페이드+rotateY 1회전. 뱃지: Solana / Pump.fun 런칭 / 커뮤니티 드리븐
4. 토크노믹스 스코어보드 — HUD 스탯 4개: TOTAL SUPPLY 1B · LP BURNED 100% · TAX 0/0 · HOLDERS 4,209. 아케이드 자릿수 롤링. hover 하드섀도 4→8px
5. 로드맵 스테이지 해금(B) — LEVEL 1~4
6. 커뮤니티 — "같이 날릴 사람 구함" X/Telegram 픽셀 버튼, 밈 갤러리 3칸 hover rotate ±2
7. 최종 CTA — 게임오버 패러디 "CONTINUE? 9… 8…" (9→0 후 YES 고정, 루프 아님) + CTA

### 시그니처
- A. 펭귄 포물선: SVG path M60,300 Q400,-40 740,280, offset-path+offsetDistance 0→100% (1.4s ease [0.3,0.9,0.6,1]) + rotate 0→720. dashed 궤적 pathLength 추격. 착지: 눈 파편 6개 방사+스코어 322.5m 카운트업+프레임 셰이크 x:[0,-4,4,-2,0]. reduced: 착지 상태+스코어 고정.
- B. 로드맵 해금: 세로 타임라인, LEVEL 1 토큰 런칭(CLEAR)→LEVEL 2 커뮤니티(CLEAR)→LEVEL 3 상장(NOW PLAYING)→LEVEL 4 게임 리메이크·NFT(LOCKED). 축선 scaleY. 잠금(자물쇠+grayscale+blur 2px)→해금(자물쇠 rotate -20 fade, CLEAR 스탬프 scale 2→1 rotate -8 spring 400). LEVEL 4는 "COMING SOON" 점멸 2s.

### 컬러: 하드 섀도·CTA·궤적·CLEAR 스탬프·LEVEL 라벨에 sky. 보조 얼음 화이트 #E0F2FE. 라이트 픽셀 섀도 #0284C7.

## 공통 노트
- whileInView viewport once:true amount:0.3 기본. 라이브 카운터·셔플만 반복.
- 기본 등장 opacity 0/y:24 → duration 0.5~0.7 stagger 0.08~0.15.
- useReducedMotion 분기: 이동/셰이크/타이핑/셔플 제거, 수치 최종값 즉시.
- 아이콘 인라인 SVG 24px stroke-current. 밈 표현(고래·로켓·펭귄)도 SVG.
- 히어로 CTA 첫 뷰포트 노출 — 목업 max-h-[52vh] 제한.
