import Link from "next/link";
import { ContactEmailFallback } from "@/components/ContactEmailFallback";
import { RoiCalculator } from "@/components/RoiCalculator";

const WORKFLOW = [
  {
    step: "01",
    title: "작업지시",
    body: "고객·현장·장비와 요청사항을 등록하고 담당자를 배정합니다.",
    tag: "사무실",
  },
  {
    step: "02",
    title: "현장 증빙",
    body: "모바일에서 전·후 사진, 사용 부품, 특이사항과 짧은 메모를 남깁니다.",
    tag: "현장",
  },
  {
    step: "03",
    title: "자동 초안",
    body: "한 작업에 모인 기록을 완료보고서 항목에 맞춰 정리합니다.",
    tag: "시스템",
  },
  {
    step: "04",
    title: "사무실 검토",
    body: "현장 기록과 초안을 대조하고 표준 완료보고서를 확정합니다.",
    tag: "사무실",
  },
  {
    step: "05",
    title: "고객 확인",
    body: "승인 링크를 기존 연락 채널로 전달하면 고객이 의견 또는 서명을 남깁니다.",
    tag: "고객",
  },
  {
    step: "06",
    title: "청구 가능",
    body: "승인된 작업만 청구 가능 목록으로 전환해 다음 업무를 놓치지 않습니다.",
    tag: "매출",
  },
];

const ROLE_RESULTS = [
  {
    role: "대표 · 관리자",
    title: "끝난 작업이 어디서 멈췄는지 바로 봅니다.",
    body: "미검토·승인 대기·청구 가능·미수 상태를 직원에게 묻지 않고 확인합니다.",
  },
  {
    role: "공무 · 사무실",
    title: "처음부터 쓰지 않고, 확인하고 확정합니다.",
    body: "사진을 내려받고 메모를 해석해 보고서를 다시 만드는 시간을 줄입니다.",
  },
  {
    role: "현장소장 · 작업자",
    title: "긴 문서 대신 수행 사실만 남깁니다.",
    body: "모바일에서 사진·선택·짧은 메모로 작업 결과를 한 번만 기록합니다.",
  },
  {
    role: "고객 담당자",
    title: "가입이나 파일 편집 없이 확인합니다.",
    body: "만료형 링크에서 보고서를 보고 수정 요청 또는 간편 서명을 남깁니다.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "59,000",
    users: "3명",
    work: "월 100건",
    availability: "현재 MVP",
    detail: "표준 보고서 1종 · 규칙 기반 초안 · PDF 저장/인쇄 · 승인 링크",
  },
  {
    name: "Team",
    price: "149,000",
    users: "10명",
    work: "월 500건",
    availability: "파일럿 검증 후",
    detail: "사용자·작업량 확대 기준안 · 템플릿 2종과 정기점검은 출시 전 검증",
    featured: true,
  },
  {
    name: "Pro",
    price: "299,000",
    users: "30명",
    work: "월 2,000건",
    availability: "제품 로드맵",
    detail: "다팀 운영·권한 고도화·통계는 정식 판매 전 검증 예정",
  },
];

const FAQ = [
  {
    q: "기존 한글·엑셀·PDF 양식을 그대로 쓸 수 있나요?",
    a: "현재 데모는 표준 보고서 1종을 제공합니다. 유료 파일럿에서는 기존 양식의 항목, 사진 배치, 부품표와 서명 위치를 확인해 적용 범위를 먼저 합의합니다. 원본 파일을 브라우저에서 자유 편집하는 방식은 아닙니다.",
  },
  {
    q: "현장 직원이 앱을 설치해야 하나요?",
    a: "모바일 브라우저에서 바로 사용하고 홈 화면에 추가할 수 있습니다. 별도 네이티브 앱 설치는 필요하지 않습니다.",
  },
  {
    q: "자동 초안이 틀리면 어떻게 하나요?",
    a: "초안은 자동 확정되지 않습니다. 현장 입력과 사진을 보면서 사무실 담당자가 수정하고 확정합니다. 현재 MVP는 예측 가능한 규칙 기반 초안을 사용합니다.",
  },
  {
    q: "고객도 회원가입해야 하나요?",
    a: "아닙니다. 기본 7일 동안 유효한 링크에서 보고서를 확인하고 수정 요청 또는 간편 서명을 남깁니다.",
  },
  {
    q: "이메일·문자·카카오톡이 자동 발송되나요?",
    a: "현재 MVP에서는 사무실이 생성된 승인 링크를 복사해 기존 연락 채널로 직접 전달합니다. 자동 발송은 외부 발송 서비스 연동 후 제공할 예정입니다.",
  },
  {
    q: "간편 서명이 법률상 공인전자서명인가요?",
    a: "아닙니다. 작업 결과에 대한 고객 확인용 간편 서명이며, 법률상 공인전자서명이나 계약 체결을 보증하지 않습니다.",
  },
  {
    q: "세금계산서도 발행하나요?",
    a: "직접 발행하지 않습니다. 승인된 작업을 청구 가능 상태로 모으고 청구일·금액·납기일·입금 상태를 관리합니다.",
  },
];

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}

function BrandMark() {
  return (
    <span className="landing-brand-mark" aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M7 7h18v18H7z" stroke="currentColor" strokeWidth="2" />
        <path d="m10.5 16 3.5 3.5L22 11.5" stroke="currentColor" strokeWidth="2.4" />
      </svg>
    </span>
  );
}

export default function LandingPage() {
  const demoMailto =
    "mailto:korea@toris.kr?subject=%ED%98%84%EC%9E%A5%EC%99%84%EB%A3%8C%2010%EB%B6%84%20%EB%8D%B0%EB%AA%A8%20%EC%9A%94%EC%B2%AD";
  const pilotMailto =
    "mailto:korea@toris.kr?subject=%ED%98%84%EC%9E%A5%EC%99%84%EB%A3%8C%204%EC%A3%BC%20%ED%8C%8C%EC%9D%BC%EB%9F%BF%20%EB%AC%B8%EC%9D%98";

  return (
    <main id="main" className="landing-page">
      <header className="landing-header">
        <div className="landing-container flex h-20 items-center justify-between">
          <Link href="/" className="landing-brand" aria-label="현장완료 홈">
            <BrandMark />
            <span>현장완료</span>
          </Link>
          <nav aria-label="주요 메뉴" className="hidden items-center gap-8 lg:flex">
            <a href="#workflow" className="landing-nav-link">
              작동 방식
            </a>
            <a href="#trust" className="landing-nav-link">
              도입 기준
            </a>
            <a href="#pricing" className="landing-nav-link">
              요금
            </a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="landing-login">
              로그인
            </Link>
            <a href={demoMailto} className="landing-button landing-button-small">
              <span className="hidden sm:inline">우리 양식으로 </span>데모 요청
            </a>
          </div>
        </div>
        <nav aria-label="모바일 주요 메뉴" className="landing-mobile-nav">
          <a href="#workflow">작동 방식</a>
          <a href="#trust">도입 기준</a>
          <a href="#pricing">요금</a>
          <a href="#faq">FAQ</a>
        </nav>
      </header>

      <section className="landing-hero" aria-labelledby="hero-title">
        {/* imagegen으로 만든 데모 연출 이미지. 실제 고객 사례로 오인되지 않게 캡션을 함께 노출한다. */}
        <img
          src="/images/field-hero.webp"
          width="1536"
          height="1024"
          fetchPriority="high"
          alt="데모용 연출 이미지: 기계실에서 태블릿으로 작업 결과를 기록하며 설비를 점검하는 현장 작업자"
          className="landing-hero-image"
        />
        <div className="landing-hero-shade" />
        <div className="landing-container landing-hero-grid">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">
              <span className="landing-eyebrow-line" />
              산업설비·공조 유지보수팀을 위한 완료보고 자동화
            </p>
            <h1 id="hero-title" className="landing-display landing-hero-title">
              현장이 끝나면,
              <br />
              보고와 청구 준비도
              <br />
              <span>끝나야 합니다.</span>
            </h1>
            <p className="landing-hero-lead">
              현장 직원은 사진과 짧은 메모를 남기고, 사무실은 완료보고서 자동 초안을
              확인합니다. 고객 확인이 끝난 작업만 <strong>청구 가능</strong>으로 모아봅니다.
            </p>
            <div className="landing-hero-actions">
              <a href={demoMailto} className="landing-button landing-button-hero">
                우리 보고서로 10분 데모 요청
                <ArrowIcon className="size-5" />
              </a>
              <a href="#workflow" className="landing-button-secondary">
                한 건의 흐름 보기
              </a>
            </div>
            <p className="landing-hero-note">
              빈 양식 또는 고객명·연락처·사진·서명을 모두 가린 샘플이면 됩니다.
            </p>
            <ContactEmailFallback compact />
          </div>

          <div className="landing-proof-card" aria-label="샘플 작업 진행 상태">
            <div className="landing-proof-head">
              <div>
                <p className="landing-proof-label">WORK ORDER</p>
                <p className="landing-proof-number">FS-2026-071</p>
              </div>
              <span className="landing-live-badge">샘플 데이터</span>
            </div>
            <div className="landing-proof-meta">
              <span>냉각수 순환펌프 점검</span>
              <span>성수 제2공장</span>
            </div>
            <ol className="landing-status-list">
              {[
                ["현장 기록", "사진 6장 · 메모 저장"],
                ["보고서 검토", "v1 확정"],
                ["고객 확인", "김현장 · 승인 완료"],
                ["청구 상태", "청구 가능"],
              ].map(([label, value], index) => (
                <li key={label} className={index === 3 ? "is-current" : ""}>
                  <span className="landing-status-dot">
                    <CheckIcon className="size-3.5" />
                  </span>
                  <span>
                    <small>{label}</small>
                    <strong>{value}</strong>
                  </span>
                </li>
              ))}
            </ol>
            <div className="landing-proof-footer">
              <span>작업 완료 → 승인</span>
              <strong>1개의 흐름</strong>
            </div>
          </div>
        </div>
        <p className="landing-image-caption">데모용 연출 이미지 · 실제 고객 사례가 아닙니다</p>
      </section>

      <section className="landing-boundary" aria-label="제품 범위">
        <div className="landing-container landing-boundary-grid">
          <p className="landing-boundary-title">현장관리 ERP를 더 만드는 것이 아닙니다.</p>
          <ul>
            <li>근태·GPS 제외</li>
            <li>재고·구매 ERP 제외</li>
            <li>세금계산서 직접 발행 제외</li>
            <li className="is-focus">완료보고·승인·청구 준비에 집중</li>
          </ul>
        </div>
      </section>

      <section className="landing-section landing-problem">
        <div className="landing-container">
          <div className="landing-section-heading landing-section-heading-split">
            <div>
              <p className="landing-kicker">작업 뒤에 생기는 두 번째 일</p>
              <h2 className="landing-display">작업은 한 번인데,<br />정리는 여러 번입니다.</h2>
            </div>
            <p>
              사진은 메신저에, 요청사항은 전화에, 보고서는 한글 파일에, 승인 여부는 담당자
              기억에 남습니다. 정보를 다시 옮길 때 누락과 청구 지연이 생깁니다.
            </p>
          </div>

          <div className="landing-problem-grid">
            <article className="landing-problem-card">
              <span className="landing-problem-role">현장</span>
              <p>사진 촬영</p>
              <p>작업 메모</p>
              <p>부품 기록</p>
              <div className="landing-problem-tail">메신저로 전달</div>
            </article>
            <div className="landing-transfer" aria-hidden="true">
              <ArrowIcon className="size-7" />
              <span>다시 정리</span>
            </div>
            <article className="landing-problem-card is-office">
              <span className="landing-problem-role">사무실</span>
              <p>사진 내려받기</p>
              <p>메모 해석</p>
              <p>보고서 재작성</p>
              <div className="landing-problem-tail">승인 여부 재확인</div>
            </article>
            <article className="landing-problem-result">
              <p className="landing-proof-label">현장완료가 없애는 구간</p>
              <strong>한 번 기록한 내용을<br />다시 입력하는 시간</strong>
              <ul>
                <li><CheckIcon className="size-4" /> 사진과 작업의 연결</li>
                <li><CheckIcon className="size-4" /> 완료보고서 항목별 정리</li>
                <li><CheckIcon className="size-4" /> 승인과 청구 상태 연결</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section id="workflow" className="landing-section landing-workflow">
        <div className="landing-container">
          <div className="landing-section-heading">
            <p className="landing-kicker">한 건의 수직 흐름</p>
            <h2 className="landing-display">수행 사실이 보고서가 되고,<br />승인 사실이 청구 준비가 됩니다.</h2>
            <p>
              넓은 현장관리 기능보다, 한 작업이 고객 확인과 청구 가능 상태까지 끝나는 경험에
              집중했습니다.
            </p>
          </div>
          <ol className="landing-workflow-grid">
            {WORKFLOW.map((item) => (
              <li key={item.step} className="landing-workflow-card">
                <div className="landing-workflow-top">
                  <span>{item.step}</span>
                  <small>{item.tag}</small>
                </div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="landing-section landing-product">
        <div className="landing-container landing-product-grid">
          <div className="landing-product-copy">
            <p className="landing-kicker is-light">현장에서 사무실까지</p>
            <h2 className="landing-display">긴 보고서를 쓰게 하지 않고,<br />검토할 근거를 남깁니다.</h2>
            <p>
              작업자는 모바일에서 수행 사실을 남기고, 사무실은 원문과 자동 초안을 함께 봅니다.
              초안이 틀릴 수 있다는 전제로 사람이 최종 확정합니다.
            </p>
            <ul className="landing-check-list">
              <li><CheckIcon /> 사진을 작업 전·후·기타로 구분</li>
              <li><CheckIcon /> 사용 부품·수량·특이사항을 직접 수정</li>
              <li><CheckIcon /> 제출 전 서버 자동저장과 재접속 복구</li>
              <li><CheckIcon /> 확정본·승인본을 버전으로 보존</li>
            </ul>
          </div>

          <div
            className="landing-ui-stage"
            role="img"
            aria-label="현장 작업자가 사진과 메모를 제출하면 사무실의 작업완료보고서로 정리되는 화면 예시"
          >
            <div className="landing-phone">
              <div className="landing-phone-bar">
                <span>09:41</span>
                <span className="landing-phone-pill" />
                <span>5G</span>
              </div>
              <div className="landing-phone-body">
                <small>오늘의 작업</small>
                <h3>냉각수 펌프 점검</h3>
                <p>성수 제2공장 · 기계실 B1</p>
                <div className="landing-photo-grid">
                  <span className="is-before">작업 전</span>
                  <span className="is-after">작업 후</span>
                </div>
                <div className="landing-phone-field">
                  <small>작업 메모</small>
                  <p>베어링 교체 후 시운전 정상</p>
                </div>
                <div className="landing-phone-button">현장 제출</div>
              </div>
            </div>

            <div className="landing-report-sheet">
              <div className="landing-report-head">
                <BrandMark />
                <div>
                  <small>FIELD SERVICE REPORT</small>
                  <strong>작업완료보고서</strong>
                </div>
                <span>v1</span>
              </div>
              <div className="landing-report-meta">
                <span><small>고객사</small>대한산업</span>
                <span><small>현장</small>성수 제2공장</span>
                <span><small>작업일</small>2026.07.23</span>
              </div>
              <div className="landing-report-block">
                <small>작업 요약</small>
                <p>냉각수 순환펌프 이상 소음을 점검하고 베어링 교체 및 시운전을 완료했습니다.</p>
              </div>
              <div className="landing-report-table">
                <span>사용 부품</span><span>모델</span><span>수량</span>
                <strong>베어링</strong><strong>6204</strong><strong>2 EA</strong>
              </div>
              <div className="landing-report-approval">
                <span>고객 확인</span>
                <strong>승인 완료</strong>
                <small>2026.07.23 16:42</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-template">
        <div className="landing-container landing-template-grid">
          <div className="landing-template-stack" aria-hidden="true">
            <div className="landing-paper is-back">기존 한글 · 엑셀 · PDF</div>
            <div className="landing-paper is-middle">표준 항목 매핑</div>
            <div className="landing-paper is-front">
              <div className="landing-paper-head">
                <span>귀사 로고</span>
                <strong>작업완료보고서</strong>
              </div>
              <div className="landing-paper-lines">
                <span /><span /><span /><span />
              </div>
              <div className="landing-paper-photos"><span /><span /></div>
              <div className="landing-paper-stamp">확정</div>
            </div>
          </div>
          <div>
            <p className="landing-kicker">양식을 바꾸는 도입이 아닙니다</p>
            <h2 className="landing-display">지금 쓰는 보고서를 기준으로<br />파일럿 범위를 정합니다.</h2>
            <p>
              현재 표준 보고서로 흐름을 먼저 검증하고, 파일럿에서는 회사 로고, 보고서 번호,
              작업 정보, 부품표, 전·후 사진과 고객 서명 위치의 적용 범위를 함께 정합니다.
            </p>
            <div className="landing-callout">
              <strong>정직한 범위</strong>
              <p>
                자유 배치형 양식 편집기는 지원하지 않습니다. 기존 양식 적용은 샘플 확인 후
                파일럿 산출물과 일정에 명시합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-roles">
        <div className="landing-container">
          <div className="landing-section-heading">
            <p className="landing-kicker">역할마다 다른 결과</p>
            <h2 className="landing-display">누구에게도 일을 더 얹지 않는 흐름</h2>
          </div>
          <div className="landing-role-grid">
            {ROLE_RESULTS.map((item) => (
              <article key={item.role} className="landing-role-card">
                <span>{item.role}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="trust" className="landing-section landing-trust">
        <div className="landing-container landing-trust-grid">
          <div>
            <p className="landing-kicker is-light">자동화보다 중요한 통제</p>
            <h2 className="landing-display">초안은 자동으로 만들되,<br />확정은 사람이 합니다.</h2>
            <p>
              현장 기록에 없는 수량·부품·원인을 만들어내지 않도록 구조를 제한하고, 보고서를
              보내기 전 사무실 담당자가 직접 확인합니다.
            </p>
          </div>
          <div className="landing-trust-list">
            {[
              ["조직별 데이터 분리", "모든 업무 데이터는 요청 조직 경계를 확인합니다."],
              ["만료형 승인 링크", "기본 7일 유효기간과 재발급 흐름을 제공합니다."],
              ["승인본 잠금", "서명 후 내용 변경은 새 버전과 재승인이 필요합니다."],
              ["업무용 간편 서명", "공인전자서명으로 과장하지 않고 범위를 명확히 합니다."],
            ].map(([title, body]) => (
              <article key={title}>
                <CheckIcon />
                <div><h3>{title}</h3><p>{body}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-roi">
        <div className="landing-container">
          <div className="landing-section-heading landing-section-heading-split">
            <div>
              <p className="landing-kicker">AI보다 먼저 볼 숫자</p>
              <h2 className="landing-display">지금 보고서에 쓰는 시간부터<br />계산해 보세요.</h2>
            </div>
            <p>
              실제 월 작업 건수와 재작성 시간을 넣으면 직접 시간비용만 계산합니다. 승인 지연과
              청구 누락 효과는 과장하지 않고 별도로 확인합니다.
            </p>
          </div>
          <RoiCalculator />
        </div>
      </section>

      <section id="pricing" className="landing-section landing-pricing">
        <div className="landing-container">
          <div className="landing-pilot">
            <div>
              <p className="landing-kicker is-light">첫 도입 제안</p>
              <h2 className="landing-display">실제 양식으로 4주 파일럿부터</h2>
              <p>보고서 양식 1종 설정부터 첫 고객 승인 흐름까지 함께 검증합니다.</p>
            </div>
            <div className="landing-pilot-price">
              <small>4주 파일럿</small>
              <strong>10만~30만원</strong>
              <span>양식 복잡도와 초기 설정 범위에 따라 확정</span>
            </div>
            <ul>
              <li><CheckIcon /> 기존 보고서 양식 1종 설정</li>
              <li><CheckIcon /> 샘플 작업 1건 등록</li>
              <li><CheckIcon /> 관리자·현장 사용자 초기 안내</li>
              <li><CheckIcon /> 첫 고객 승인 흐름 검증</li>
              <li><CheckIcon /> 사용 후 개선 인터뷰</li>
            </ul>
            <a href={pilotMailto} className="landing-button landing-button-hero">
              파일럿 가능 여부 확인 <ArrowIcon className="size-5" />
            </a>
          </div>

          <div className="landing-plan-heading">
            <p>파일럿 이후 월 구독 기준안</p>
            <span>초기 양식 설정비 20만~50만원 별도</span>
          </div>
          <div className="landing-plan-grid">
            {PLANS.map((plan) => (
              <article key={plan.name} className={`landing-plan ${plan.featured ? "is-featured" : ""}`}>
                {plan.featured && <span className="landing-plan-badge">성장 팀 추천</span>}
                <h3>{plan.name}</h3>
                <span className="landing-plan-availability">{plan.availability}</span>
                <p className="landing-plan-price"><span>₩</span>{plan.price}<small>/월</small></p>
                <div className="landing-plan-limits"><span>{plan.users}</span><span>{plan.work}</span></div>
                <p>{plan.detail}</p>
              </article>
            ))}
          </div>
          <p className="landing-pricing-note">
            정식 판매 전 기준안입니다. 요금제별 기능과 한도는 파일럿의 실제 저장·운영 원가를
            확인한 뒤 계약 시 확정합니다.
          </p>
        </div>
      </section>

      <section id="faq" className="landing-section landing-faq">
        <div className="landing-container landing-faq-grid">
          <div>
            <p className="landing-kicker">도입 전 확인</p>
            <h2 className="landing-display">기능보다 먼저<br />범위를 분명히 합니다.</h2>
            <p>지원하지 않는 기능까지 되는 것처럼 제안하지 않습니다.</p>
          </div>
          <div className="landing-faq-list">
            {FAQ.map((item) => (
              <details key={item.q}>
                <summary>{item.q}<span aria-hidden="true">+</span></summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-final">
        <div className="landing-container landing-final-inner">
          <p className="landing-kicker is-light">10분이면 적합성을 판단할 수 있습니다</p>
          <h2 className="landing-display">최근 보고서 한 장으로<br />어디까지 줄일 수 있는지 보여드립니다.</h2>
          <p>빈 양식 또는 연락처·사진·서명을 모두 가린 샘플을 기준으로 이야기하겠습니다.</p>
          <div className="landing-final-actions">
            <a href={demoMailto} className="landing-button landing-button-hero">
              우리 양식으로 데모 요청 <ArrowIcon className="size-5" />
            </a>
            <Link href="/signup" className="landing-button-secondary is-light">
              직접 조직 만들어 보기
            </Link>
          </div>
          <a href="mailto:korea@toris.kr" className="landing-email">korea@toris.kr</a>
          <ContactEmailFallback />
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div className="landing-brand"><BrandMark /><span>현장완료</span></div>
          <p>작업완료보고서 자동화와 청구 누락 방지 도구</p>
          <div>
            <Link href="/privacy">개인정보처리방침</Link>
            <Link href="/terms">이용약관</Link>
            <a href="mailto:korea@toris.kr">문의</a>
            <a href="https://www.instagram.com/toris.kr" target="_blank" rel="me noopener">
              Instagram
            </a>
            <a href="https://github.com/torisKR" target="_blank" rel="me noopener">
              GitHub
            </a>
            <a href="https://www.linkedin.com/in/toriskorea/" target="_blank" rel="me noopener">
              LinkedIn
            </a>
            <a href="https://www.threads.com/@toris.kr" target="_blank" rel="me noopener">
              Threads
            </a>
            <a
              href="https://play.google.com/store/apps/dev?id=6912640494861955983"
              target="_blank"
              rel="me noopener"
            >
              Google Play
            </a>
          </div>
          <small>© 2026 TORIS. field.toris.kr</small>
        </div>
      </footer>
    </main>
  );
}
