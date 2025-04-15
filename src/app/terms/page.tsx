export const metadata = {
  title: '이용약관 - Toris Dev Blog',
  description: 'Toris Dev Blog의 콘텐츠 이용 및 저작권에 관한 약관입니다.',
  alternates: {
    canonical: 'https://toris-dev.vercel.app/terms'
  }
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-content dark:text-content-dark">
            이용약관
          </h1>
          <p className="mt-4 text-content/70 dark:text-content-dark/70">
            최종 업데이트: 2025년 4월 15일
          </p>
        </div>

        <div className="space-y-8">
          {/* 서문 */}
          <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-bkg-dark">
            <h2 className="mb-4 text-xl font-semibold text-content dark:text-content-dark">
              1. 서문
            </h2>
            <div className="space-y-3 text-content/80 dark:text-content-dark/90">
              <p>
                Toris Dev Blog(이하 &quot;블로그&quot;)는 개발 지식과 경험을
                공유하기 위한 목적으로 운영되고 있습니다. 본 블로그를 방문하거나
                콘텐츠를 이용하는 모든 사용자는 이 약관에 동의하는 것으로
                간주됩니다. 이용하는 모든 사용자는 이 약관에 동의하는 것으로
                간주됩니다.
              </p>
              <p>
                이 약관은 블로그의 콘텐츠, 코드, 디자인 및 기타 자산의 이용에
                관한 조건을 정의합니다. 블로그 운영자는 이 약관을 언제든지
                수정할 권리가 있으며, 중요한 변경 사항이 있을 경우 적절한
                방법으로 사용자에게 알릴 것입니다.
              </p>
            </div>
          </section>

          {/* 저작권 */}
          <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-bkg-dark">
            <h2 className="mb-4 text-xl font-semibold text-content dark:text-content-dark">
              2. 저작권 및 소유권
            </h2>
            <div className="space-y-3 text-content/80 dark:text-content-dark/90">
              <p>
                본 블로그에 게시된 모든 콘텐츠(텍스트, 이미지, 코드, 디자인 요소
                등)는 Toris Dev Blog와 그 제작자의 지적 재산이며 저작권법에 의해
                보호됩니다.
              </p>
              <p>
                블로그의 콘텐츠는 개인적, 비상업적 용도로 읽고 학습하는 것은
                자유롭게 허용됩니다. 그러나 복제, 배포, 수정, 상업적 이용 등은
                명시적인 허가 없이 금지됩니다.
              </p>
              <p>
                블로그 소스 코드의 일부 또는 전체를 포크하거나 재사용하려면
                사전에 블로그 운영자의 명시적인 서면 동의가 필요합니다.
              </p>
            </div>
          </section>

          {/* 콘텐츠 이용 */}
          <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-bkg-dark">
            <h2 className="mb-4 text-xl font-semibold text-content dark:text-content-dark">
              3. 콘텐츠 이용 조건
            </h2>
            <div className="space-y-3 text-content/80 dark:text-content-dark/90">
              <p>
                <strong>개인적인 학습 및 참고:</strong> 블로그 콘텐츠를 개인적인
                학습이나 참고 목적으로 읽고 활용하는 것은 자유롭게 허용됩니다.
              </p>
              <p>
                <strong>인용:</strong> 학술적, 교육적, 비상업적 목적으로 블로그
                콘텐츠를 인용할 경우, 반드시 출처(Toris Dev Blog 및 해당 글의
                URL)를 명시해야 합니다.
              </p>
              <p>
                <strong>코드 스니펫:</strong> 블로그에 게시된 코드 스니펫(작은
                코드 조각)은 개인 프로젝트나 비상업적 목적으로 사용할 수 있으나,
                출처를 명시하는 것이 좋습니다.
              </p>
              <p>
                <strong>금지된 이용:</strong> 다음과 같은 이용은 명시적으로
                금지됩니다:
              </p>
              <ul className="ml-5 list-disc space-y-1">
                <li>블로그 콘텐츠의 대규모 복제 또는 자동화된 수집</li>
                <li>
                  블로그 콘텐츠를 수정하여 마치 자신의 창작물인 것처럼 게시
                </li>
                <li>블로그 콘텐츠를 상업적 목적으로 재판매하거나 배포</li>
                <li>출처를 명시하지 않고 블로그 콘텐츠를 다른 매체에 게시</li>
              </ul>
            </div>
          </section>

          {/* 블로그 포크 및 재사용 */}
          <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-bkg-dark">
            <h2 className="mb-4 text-xl font-semibold text-content dark:text-content-dark">
              4. 블로그 포크 및 재사용 조건
            </h2>
            <div className="space-y-3 text-content/80 dark:text-content-dark/90">
              <p>
                본 블로그의 소스 코드, 디자인, 구조 또는 그 일부를 포크하거나
                재사용하고자 하는 경우, 다음 절차를 따라야 합니다:
              </p>
              <ol className="ml-5 list-decimal space-y-2">
                <li>
                  <strong>사전 허가 요청:</strong> 블로그 운영자에게 이메일
                  (ironjustlikethat@gmail.com)로 사용 목적과 범위를 상세히
                  기술한 허가 요청을 보내야 합니다.
                </li>
                <li>
                  <strong>서면 동의:</strong> 블로그 운영자로부터 서면 동의를
                  받은 후에만 포크 또는 재사용이 가능합니다.
                </li>
                <li>
                  <strong>출처 표시:</strong> 허가를 받은 경우에도 반드시
                  &quot;원본: Toris Dev Blog
                  (https://toris-dev.vercel.app)&quot;와 같은 형태로 눈에 잘
                  띄는 곳에 출처를 표시해야 합니다.
                </li>
                <li>
                  <strong>비상업적 사용:</strong> 특별한 허가가 없는 한,
                  재사용은 비상업적 목적으로 제한됩니다.
                </li>
              </ol>
              <p>
                허가 없이 블로그를 포크하거나, 디자인이나 코드를 복제하는 행위는
                저작권 침해로 간주될 수 있으며, 법적 조치의 대상이 될 수
                있습니다.
              </p>
            </div>
          </section>

          {/* 면책 조항 */}
          <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-bkg-dark">
            <h2 className="mb-4 text-xl font-semibold text-content dark:text-content-dark">
              5. 면책 조항
            </h2>
            <div className="space-y-3 text-content/80 dark:text-content-dark/90">
              <p>
                블로그에 게시된 정보와 코드는 정확성과 유용성을 위해 최선을
                다하고 있으나, 어떠한 보증도 제공하지 않습니다. 모든 콘텐츠는
                &quot;있는 그대로&quot; 제공되며, 블로그 운영자는 콘텐츠의
                사용으로 인한 어떠한 손해에 대해서도 책임을 지지 않습니다.
              </p>
              <p>
                블로그에 게시된 코드와 기술 정보를 사용할 때는 자신의 환경에서
                충분히 테스트하고 검증한 후 사용하기를 권장합니다.
              </p>
            </div>
          </section>

          {/* 연락처 */}
          <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-bkg-dark">
            <h2 className="mb-4 text-xl font-semibold text-content dark:text-content-dark">
              6. 연락처
            </h2>
            <div className="space-y-3 text-content/80 dark:text-content-dark/90">
              <p>
                본 이용약관에 관한 질문이나 콘텐츠 사용 허가 요청, 저작권 관련
                문의는 아래 연락처로 보내주시기 바랍니다:
              </p>
              <p className="rounded-md bg-primary/5 p-4 dark:bg-primary/10">
                <strong>이메일:</strong>{' '}
                <a
                  href="mailto:ironjustlikethat@gmail.com"
                  className="text-primary underline"
                >
                  ironjustlikethat@gmail.com
                </a>
              </p>
              <p>
                문의 시 구체적인 요청 사항과 사용 목적을 상세히 기술해 주시면
                보다 신속한 답변이 가능합니다.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 text-center text-sm text-content/60 dark:text-content-dark/60">
          이 이용약관은 2025년 4월 15일부터 유효합니다. Toris Dev Blog는 이
          약관을 언제든지 변경할 권리가 있으며, 변경 사항은 블로그에
          게시됨으로써 효력이 발생합니다.
        </div>
      </div>
    </div>
  );
}
