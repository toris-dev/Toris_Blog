import Link from "next/link";
import StepRoadmap from "@/components/StepRoadmap";
import Hero3D from "@/components/Hero3D";
import { FEATURES } from "@builderstep/shared";

const CHECKOUT = process.env.NEXT_PUBLIC_RAPID_CHECKOUT_URL ?? "";

export default function HomePage() {
  const free = FEATURES.filter((f) => !f.pro);
  const pro = FEATURES.filter((f) => f.pro);

  return (
    <main id="main">
      {/* ============================ Hero — 다크 셸 ============================ */}
      <section className="relative overflow-hidden bg-shell text-shell-ink">
        {/* 분위기 레이어: Higgsfield 생성 8단계 여정 은유 (제품 화면 아님) */}
        <img
          src="/media/generated/builderstep-hero-atmosphere-v1-1280.webp"
          srcSet="/media/generated/builderstep-hero-atmosphere-v1-1280.webp 1280w, /media/generated/builderstep-hero-atmosphere-v1-2400.webp 2400w"
          sizes="100vw"
          width={2752}
          height={1536}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[70%_50%] opacity-60"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,var(--color-shell)_8%,color-mix(in_srgb,var(--color-shell)_55%,transparent)_45%,transparent_80%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-shell to-transparent"
        />
        {/* 깊이 1: 원근 격자 */}
        <div aria-hidden="true" className="hero-grid opacity-60" />
        {/* 깊이 2: 상승 나선 성좌 */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-25 lg:left-auto lg:w-[58%] lg:opacity-70 lg:[mask-image:linear-gradient(90deg,transparent,#000_22%)]"
        >
          <Hero3D />
        </div>

        <div className="relative mx-auto max-w-6xl px-5 pb-32 pt-24 sm:pt-32">
          <p className="reveal inline-flex items-center gap-2 rounded-full border border-shell-line/80 bg-shell-2/60 px-3.5 py-1.5 font-mono text-[11px] font-bold tracking-[0.28em] text-step-bright backdrop-blur">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-step shadow-[0_0_8px_1px_color-mix(in_srgb,var(--color-step)_70%,transparent)]" />
            FOR SOLO BUILDERS
          </p>
          <h1 className="reveal mt-6 max-w-3xl text-4xl font-extrabold leading-[1.15] tracking-tight text-shell-ink sm:text-6xl">
            혼자 만드는 제품,
            <br />
            다음 단계는{" "}
            <span className="text-step-bright [text-shadow:0_0_28px_color-mix(in_srgb,var(--color-step)_55%,transparent)]">
              함께
            </span>
          </h1>
          <p className="reveal mt-6 max-w-xl text-lg leading-relaxed text-shell-dim">
            빌더스텝은 지금 어느 단계인지 진단하고, 아이디어 검증부터 출시,
            첫 매출, 사업 성장까지 — 지금 가장 중요한 다음 행동 하나를
            찾아드립니다.
          </p>
          <div className="reveal mt-9 flex flex-wrap gap-3">
            <Link
              href="/app"
              className="btn-ember inline-flex h-13 items-center rounded-xl px-7 py-3.5 text-[15px] font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-step-bright"
            >
              내 단계 진단하고 시작하기
            </Link>
            <a
              href="#roadmap"
              className="btn-ghost-shell inline-flex h-13 items-center rounded-xl px-6 py-3.5 text-[15px] font-medium focus-visible:outline-2 focus-visible:outline-step"
            >
              8단계 로드맵 보기
            </a>
          </div>
          {/* 여정 상태 범례 — 분위기 이미지의 색 언어를 실제 의미로 연결 */}
          <ul className="reveal mt-14 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] tracking-[0.18em] text-shell-muted">
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-grow-bright" />
              지나온 단계
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-step" />
              지금 서 있는 곳
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-violet" />
              다가올 단계
            </li>
          </ul>
        </div>
      </section>

      {/* ========================= Roadmap — 아이보리 작업면 ========================= */}
      <section id="roadmap" className="relative border-y border-line/70 bg-bg-2/50">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <div className="reveal max-w-2xl">
            <p className="font-mono text-[11px] font-bold tracking-[0.28em] text-step-deep">
              8 STEPS
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
              지금 어느 단계에 있나요?
            </h2>
            <p className="mt-4 leading-relaxed text-ink-dim">
              단계를 눌러 각 단계의 핵심 질문과 빌더스텝이 돕는 방법을
              확인하세요. 한꺼번에 다 하지 않아도 됩니다 — 지금 단계의 다음 한
              걸음이면 충분합니다.
            </p>
          </div>
          <div className="reveal mt-10">
            <StepRoadmap />
          </div>
        </div>
      </section>

      {/* ========================= Features ========================= */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
        <div className="reveal max-w-2xl">
          <p className="font-mono text-[11px] font-bold tracking-[0.28em] text-step-deep">
            FEATURES
          </p>
          <h2 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
            무료로 시작하고, 필요할 때 넓히세요
          </h2>
          <p className="mt-4 leading-relaxed text-ink-dim">
            회원가입·로그인·결제는 래피드 계정 하나로 끝납니다. 구독하면 잠긴
            기능이 즉시 열립니다.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <div data-tilt className="reveal glass relative rounded-2xl p-7">
            <span className="glare" aria-hidden="true" />
            <h3 className="flex items-center gap-2 text-lg font-extrabold text-ink">
              무료
              <span className="rounded-full bg-grow/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-grow">FREE</span>
            </h3>
            <p className="mt-1 text-sm text-muted">지금 바로, 결제 없이 시작하는 기본기</p>
            <ul className="mt-4 space-y-3">
              {free.map((f) => (
                <li key={f.key} className="flex gap-3">
                  <span aria-hidden="true" className="mt-1 size-1.5 shrink-0 rounded-full bg-grow shadow-[0_0_8px_1px_color-mix(in_srgb,var(--color-grow)_50%,transparent)]" />
                  <div>
                    <p className="font-semibold text-ink">{f.name}</p>
                    <p className="text-sm text-ink-dim">{f.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* PRO — 궤도 테두리 시그니처 */}
          <div className="reveal border-orbit">
            <div data-tilt className="relative h-full rounded-[calc(1rem-1px)] bg-card p-7">
              <span className="glare" aria-hidden="true" />
              <h3 className="flex items-center gap-2 text-lg font-extrabold text-ink">
                구독
                <span className="rounded-full bg-step px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#14100b]">PRO</span>
              </h3>
              <p className="mt-1 text-sm text-muted">전문가와 데이터가 함께 가는 다음 단계</p>
              <ul className="mt-4 space-y-3">
                {pro.map((f) => (
                  <li key={f.key} className="flex gap-3">
                    <span aria-hidden="true" className="mt-1 size-1.5 shrink-0 rounded-full bg-step shadow-[0_0_8px_1px_color-mix(in_srgb,var(--color-step)_60%,transparent)]" />
                    <div>
                      <p className="font-semibold text-ink">{f.name}</p>
                      <p className="text-sm text-ink-dim">{f.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <a
                href={CHECKOUT || "/dashboard"}
                className="btn-ember mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl px-6 text-[15px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-step-bright"
              >
                {CHECKOUT ? "래피드에서 구독하기" : "구독 상태 확인하기"}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================== CTA — 다크 셸 =========================== */}
      <section className="relative overflow-hidden bg-shell text-shell-ink">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-step/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-5 py-20 text-center sm:py-24">
          <h2 className="reveal mx-auto max-w-2xl text-3xl font-extrabold leading-snug text-shell-ink sm:text-4xl">
            다음 단계로 가는 가장 짧은 길은
            <br />
            혼자 헤매지 않는 것입니다
          </h2>
          <p className="reveal mx-auto mt-4 max-w-md text-shell-dim">
            1분이면 지금 단계를 진단하고, 오늘 할 다음 행동 하나를 받습니다.
          </p>
          <div className="reveal mt-9">
            <Link
              href="/app"
              className="btn-ember inline-flex h-13 items-center rounded-xl px-8 py-3.5 text-base font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-step-bright"
            >
              내 다음 단계 찾고 시작하기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
