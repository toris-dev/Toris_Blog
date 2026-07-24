import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 현장완료",
  description: "현장완료 서비스의 개인정보 처리 목적, 항목, 보유기간과 이용자 권리를 안내합니다.",
  alternates: { canonical: "/privacy" },
};

const EFFECTIVE_DATE = "2026년 7월 23일";

export default function PrivacyPage() {
  return (
    <main id="main" className="legal-page">
      <header className="legal-header">
        <div className="legal-container">
          <Link href="/" className="legal-brand" aria-label="현장완료 홈">
            <span aria-hidden="true">✓</span>
            현장완료
          </Link>
          <nav aria-label="정책 메뉴">
            <Link href="/terms">이용약관</Link>
            <a href="mailto:korea@toris.kr">문의</a>
          </nav>
        </div>
      </header>

      <article className="legal-container legal-document">
        <div className="legal-intro">
          <p className="legal-eyebrow">PRIVACY POLICY</p>
          <h1>개인정보처리방침</h1>
          <p>
            토리스(이하 “회사”)는 현장완료 서비스에서 어떤 정보를 왜 처리하는지,
            산업현장 기록을 맡긴 조직과 정보주체가 어떤 권리를 갖는지 투명하게 설명합니다.
          </p>
          <dl>
            <div><dt>시행일</dt><dd>{EFFECTIVE_DATE}</dd></div>
            <div><dt>문의</dt><dd><a href="mailto:korea@toris.kr">korea@toris.kr</a></dd></div>
          </dl>
        </div>

        <aside className="legal-notice">
          <strong>먼저 확인해 주세요</strong>
          <p>
            현장완료는 조직이 업무 목적으로 입력한 고객·현장·작업자 정보를 처리합니다.
            조직은 해당 정보를 서비스에 올릴 권한을 확인하고, 필요한 고지나 동의를 직접
            마련해야 합니다. 데모 요청에는 빈 양식 또는 연락처·사진·서명을 모두 가린
            샘플만 보내 주세요.
          </p>
        </aside>

        <section>
          <h2>1. 개인정보처리자와 처리 역할</h2>
          <p>
            서비스 운영자는 <strong>토리스(Toris)</strong>, 대표 유주환, 사업자등록번호
            424-04-03521입니다. 회원 계정, 계약·문의, 서비스 보안 정보에 대해서는 회사가
            처리 목적과 방법을 정합니다.
          </p>
          <p>
            이용 조직이 고객·현장·장비·작업 기록을 업로드하는 경우에는 해당 조직이
            개인정보처리자이고 회사는 조직의 지시에 따라 서비스를 제공하는 처리자 역할을
            합니다. 계약에서 역할이나 보유기간을 달리 정한 경우 그 내용을 우선 확인합니다.
          </p>
        </section>

        <section>
          <h2>2. 처리하는 개인정보 항목</h2>
          <div className="legal-table" role="table" aria-label="개인정보 처리 항목">
            <div className="legal-table-row is-head" role="row">
              <strong role="columnheader">구분</strong>
              <strong role="columnheader">처리 항목</strong>
            </div>
            <div className="legal-table-row" role="row">
              <strong role="cell">회원·조직</strong>
              <p role="cell">
                이름, 이메일, 비밀번호 해시·솔트, 조직명, 역할·권한, 조직 담당자 연락처,
                사업자번호·주소, 초대 및 세션 토큰의 해시
              </p>
            </div>
            <div className="legal-table-row" role="row">
              <strong role="cell">고객·현장·작업</strong>
              <p role="cell">
                고객명, 담당자 이름·전화·이메일, 현장명·주소, 장비 정보, 작업 요청·일정·담당자,
                체크리스트, 사용 부품, 메모, 사진, 음성, 음성 전사문
              </p>
            </div>
            <div className="legal-table-row" role="row">
              <strong role="cell">보고·승인·청구</strong>
              <p role="cell">
                완료보고서와 PDF, 승인자 이름·직책·간편 서명 이미지, 동의 여부·버전·시각,
                수정 의견, 승인 링크 상태, 청구 금액·청구일·납기일·입금일·메모
              </p>
            </div>
            <div className="legal-table-row" role="row">
              <strong role="cell">자동 생성 정보</strong>
              <p role="cell">
                접속 IP와 로그인 실패 횟수, 로그인·권한·변경 감사기록, 오류·보안 기록,
                브라우저 로컬 저장소의 로그인 토큰과 작성 중 임시 초안
              </p>
            </div>
            <div className="legal-table-row" role="row">
              <strong role="cell">문의</strong>
              <p role="cell">보낸 사람 이메일 주소와 제목·본문, 회사가 답변을 위해 받은 첨부물</p>
            </div>
          </div>
          <p className="legal-footnote">
            결제카드 정보는 현재 서비스가 직접 수집하지 않습니다. 전사문은 사용자가 직접
            입력하며, 규칙 기반 엔진은 입력된 텍스트를 보고서 초안으로 정리합니다. 음성과
            전사문은 외부 STT·LLM에 자동 전송하지 않습니다.
          </p>
        </section>

        <section>
          <h2>3. 처리 목적</h2>
          <ul>
            <li>회원 식별, 조직별 권한 분리, 초대·로그인·세션 관리</li>
            <li>고객·현장·장비와 작업지시 관리, 현장 증빙 저장과 복구</li>
            <li>완료보고서 초안·확정본·승인본 생성, 고객 확인과 변경 이력 보존</li>
            <li>청구 가능·청구·입금 상태 관리와 업무 알림 제공</li>
            <li>장애 대응, 부정 접속 방지, 무결성 확인과 감사</li>
            <li>도입 문의 응답, 파일럿 운영과 계약 이행</li>
          </ul>
        </section>

        <section>
          <h2>4. 보유·이용기간</h2>
          <div className="legal-table" role="table" aria-label="개인정보 보유기간">
            <div className="legal-table-row is-head" role="row">
              <strong role="columnheader">정보</strong>
              <strong role="columnheader">보유기간</strong>
            </div>
            <div className="legal-table-row" role="row">
              <strong role="cell">회원·조직·업무 기록</strong>
              <p role="cell">
                서비스 이용 또는 파일럿 계약 기간. 조직의 삭제 요청이나 계약 종료 뒤
                30일 이내 운영자가 확인해 삭제합니다.
              </p>
            </div>
            <div className="legal-table-row" role="row">
              <strong role="cell">초대·승인 링크</strong>
              <p role="cell">
                링크는 기본 7일 후 사용할 수 없습니다. 토큰 원문은 저장하지 않고 해시만
                저장하며, 승인·정정 증빙과 감사기록은 해당 업무 기록의 보유기간 동안 유지합니다.
              </p>
            </div>
            <div className="legal-table-row" role="row">
              <strong role="cell">문의 기록</strong>
              <p role="cell">문의 종결 후 1년 또는 삭제 요청 시점 중 먼저 도래한 때까지</p>
            </div>
            <div className="legal-table-row" role="row">
              <strong role="cell">로그인 제한 정보</strong>
              <p role="cell">
                IP와 이메일 조합의 실패 횟수는 10분 동안 접속 제한 판단에 사용합니다.
                로그인 성공 시 해당 기록을 삭제하며, 남은 보안 상태 행은 서비스 이용기간과
                종료 후 30일 이내 운영 정리 대상에 포함합니다.
              </p>
            </div>
            <div className="legal-table-row" role="row">
              <strong role="cell">감사·보안 기록</strong>
              <p role="cell">
                변경 감사기록은 서비스 이용기간과 종료 후 30일까지 보관합니다. Cloudflare
                인프라 오류·접속 로그는 해당 서비스의 보안 설정과 계약상 보유기간에 따르며,
                목적이 끝나면 삭제 또는 비식별 처리합니다.
              </p>
            </div>
          </div>
          <p>
            법령상 보존 의무가 있거나 분쟁 처리를 위해 필요한 경우에는 해당 근거와 기간에
            한해 별도로 분리해 보관합니다. 현재 파일럿은 자동 일괄 삭제 화면을 제공하지
            않으므로 삭제·반출 요청은 이메일로 접수해 운영자가 처리합니다.
          </p>
        </section>

        <section>
          <h2>5. 제3자 제공</h2>
          <p>
            회사는 개인정보를 판매하지 않으며, 정보주체 또는 이용 조직의 동의 없이 서비스
            목적을 벗어나 제3자에게 제공하지 않습니다. 다만 법령에 특별한 근거가 있거나
            생명·신체의 급박한 보호가 필요한 경우에는 관련 법령이 허용하는 범위에서 처리할
            수 있습니다.
          </p>
        </section>

        <section>
          <h2>6. 처리위탁과 국외 처리</h2>
          <div className="legal-table" role="table" aria-label="개인정보 처리위탁">
            <div className="legal-table-row is-head" role="row">
              <strong role="columnheader">수탁자</strong>
              <strong role="columnheader">업무와 처리 위치</strong>
            </div>
            <div className="legal-table-row" role="row">
              <strong role="cell">Cloudflare, Inc.</strong>
              <p role="cell">
                <strong>업무:</strong> 웹·API 전송, D1 데이터베이스, 비공개 R2 파일 저장,
                보안·장애 대응 및 문의 메일 라우팅
                <br />
                <strong>항목:</strong> 제2조 항목 중 해당 기능 제공과 보안에 필요한 정보
                <br />
                <strong>국가·연락처:</strong> 미국 및 아시아·태평양을 포함한 Cloudflare의
                글로벌 서비스 지역 · privacyquestions@cloudflare.com
                <br />
                <strong>시기·방법:</strong> 서비스 이용 시 암호화된 네트워크로 전송
                <br />
                <strong>근거·기간:</strong> 서비스 계약 이행과 정보주체 동의 등 적용 가능한
                법적 근거에 따라 전송하며, 제4조 보유기간 또는 Cloudflare와의 계약상 더 짧은
                기간까지 처리
              </p>
            </div>
            <div className="legal-table-row" role="row">
              <strong role="cell">운영자 지정 업무용 메일함</strong>
              <p role="cell">
                Cloudflare Email Routing을 거친 문의·권리행사 메일의 최종 수신과 회신.
                최종 메일함 제공자는 운영자의 접근통제된 계약 계정이며, 제공자나 처리 국가가
                변경되면 이 방침 또는 파일럿 계약의 수탁자 목록에 반영합니다. 상세 수탁자
                정보는 문의 시 제공합니다.
              </p>
            </div>
          </div>
          <p>
            회사는 위탁계약과 서비스 설정을 통해 목적 외 처리 금지, 접근통제, 재위탁 관리와
            안전조치를 확인합니다. 국외 처리를 원하지 않는 경우 서비스 가입 전 문의하거나
            이용 중 삭제를 요청할 수 있으며, 필수 인프라 처리를 거부하면 서비스 제공이
            어려울 수 있습니다.
          </p>
          <p>
            Cloudflare의 최신 처리 지역·보안·재수탁자 정보는{" "}
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              target="_blank"
              rel="noreferrer"
            >
              Cloudflare 개인정보 보호정책
            </a>
            에서 확인할 수 있습니다.
          </p>
        </section>

        <section>
          <h2>7. 정보주체의 권리와 행사 방법</h2>
          <p>
            정보주체는 자신의 개인정보 열람, 정정·삭제, 처리정지, 동의 철회를 요청할 수
            있습니다. 조직이 업로드한 현장 기록에 관한 요청은 먼저 해당 조직 담당자에게
            전달하는 것이 가장 빠르며, 회사에 접수된 경우 조직과 협력해 처리합니다.
          </p>
          <p>
            요청은 <a href="mailto:korea@toris.kr">korea@toris.kr</a>로 접수합니다. 회사는
            요청자의 본인 또는 적법한 대리인 여부를 확인한 뒤 지체 없이 결과를 안내합니다.
          </p>
        </section>

        <section>
          <h2>8. 안전성 확보조치</h2>
          <ul>
            <li>조직 경계와 역할 기반 접근통제, 비밀번호 단방향 해시, 만료형 토큰 적용</li>
            <li>사진·음성·PDF의 비공개 저장과 권한 확인 후 스트리밍</li>
            <li>서명 후 보고서 버전 잠금, 체크섬과 변경 이력·감사기록 관리</li>
            <li>입력 크기·형식 검증, 로그인 시도 제한, 배포 전 마이그레이션·테스트 검증</li>
          </ul>
          <p>
            브라우저 로컬 저장소에는 로그인 유지와 작성 중 복구를 위해 토큰·초안이 남을 수
            있습니다. 공용 기기에서는 사용 후 로그아웃하고 브라우저 데이터를 삭제해 주세요.
          </p>
        </section>

        <section>
          <h2>9. 파기 절차와 방법</h2>
          <p>
            보유기간이 끝나거나 삭제 요청이 확인되면 복구가 어렵도록 데이터베이스 행과
            비공개 저장 객체를 삭제합니다. 법령상 보존 대상은 별도 접근통제 후 기간 종료 시
            삭제합니다. 백업·분산 저장본은 시스템의 순환 주기에 따라 안전하게 덮어씁니다.
          </p>
        </section>

        <section>
          <h2>10. 아동의 개인정보</h2>
          <p>
            현장완료는 기업·조직의 업무용 서비스이며 만 14세 미만 아동을 대상으로 제공하지
            않습니다. 아동 정보가 권한 없이 입력된 사실을 알게 되면 즉시 삭제를 요청해 주세요.
          </p>
        </section>

        <section>
          <h2>11. 개인정보 보호책임자</h2>
          <p>
            개인정보 보호책임자: 유주환(대표) · 이메일{" "}
            <a href="mailto:korea@toris.kr">korea@toris.kr</a>
          </p>
          <p>
            개인정보 침해에 관한 상담·신고는 개인정보침해 신고센터, 개인정보 분쟁조정위원회,
            경찰청 등 관계 기관의 절차도 이용할 수 있습니다.
          </p>
        </section>

        <section>
          <h2>12. 방침 변경</h2>
          <p>
            처리 항목, 수탁자 또는 보유기간이 달라지면 시행 전에 이 페이지에 변경 내용과
            시행일을 알립니다. 중요한 변경은 서비스 화면 또는 등록 이메일로 별도 안내합니다.
          </p>
        </section>

        <footer className="legal-document-footer">
          <Link href="/">현장완료 홈으로</Link>
          <span>현행 버전 · {EFFECTIVE_DATE}</span>
        </footer>
      </article>
    </main>
  );
}
