import Link from "next/link";

const PAIRS = [
  {
    problem: "수기 보고서 작성에 하루 끝 시간을 다 씁니다.",
    result: "현장 사진·메모만 남기면 초안이 자동으로 완성됩니다.",
  },
  {
    problem: "고객마다 다른 양식 때문에 매번 새로 만듭니다.",
    result: "귀사 양식 그대로, 항목만 채워 넣으면 됩니다.",
  },
  {
    problem: "승인 여부를 전화로 확인하느라 시간을 뺏깁니다.",
    result: "링크 하나로 고객이 직접 확인하고 서명·승인합니다.",
  },
  {
    problem: "승인과 청구가 따로 놀아 매출이 샙니다.",
    result: "승인되는 순간 청구 목록에 자동으로 올라갑니다.",
  },
];

const PLANS = [
  { name: "Starter", price: "59,000", desc: "소규모 팀, 월 작업 50건 이하" },
  { name: "Team", price: "149,000", desc: "다수 현장 인력, 승인·청구 자동화" },
  { name: "Pro", price: "299,000", desc: "대형 조직, 무제한 작업·전담 지원" },
];

export default function LandingPage() {
  return (
    <main id="main" className="min-h-dvh bg-bg text-ink">
      <header className="border-b border-shell-line bg-shell text-shell-ink">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold">현장완료</span>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-shell-dim hover:text-shell-ink">
              로그인
            </Link>
            <Link href="/signup" className="btn-primary rounded-lg px-4 py-2 font-medium">
              무료로 시작
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-shell text-shell-ink">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="text-3xl font-bold leading-snug sm:text-4xl">
            현장 사진과 음성만으로,
            <br />
            귀사 양식의 작업완료보고서를 만드세요.
          </h1>
          <p className="mt-5 text-shell-dim">
            배정부터 현장 기록, 초안 생성, 고객 승인, 청구까지 — 현장완료 하나로 끝냅니다.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/signup" className="btn-primary tap-target rounded-lg px-6 py-3 font-medium">
              무료로 시작하기
            </Link>
            <Link
              href="/login"
              className="btn-ghost-shell tap-target rounded-lg border border-shell-line px-6 py-3 font-medium text-shell-dim hover:text-shell-ink"
            >
              로그인
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2">
          {PAIRS.map((p) => (
            <div key={p.problem} className="card p-6">
              <p className="text-sm text-muted">문제</p>
              <p className="mt-1 font-medium text-ink-dim">{p.problem}</p>
              <div className="my-4 h-px bg-line" />
              <p className="text-sm text-primary">현장완료</p>
              <p className="mt-1 font-semibold">{p.result}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-bg-2 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-bold">요금제</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <div key={plan.name} className="card flex flex-col p-6">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-2 text-sm text-muted">{plan.desc}</p>
                <p className="mt-6 text-2xl font-bold">
                  ₩{plan.price}
                  <span className="text-sm font-normal text-muted"> / 월</span>
                </p>
                <Link
                  href="/login"
                  className="btn-primary tap-target mt-6 rounded-lg px-4 py-3 text-center font-medium"
                >
                  시작하기
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center text-sm text-muted">
        © 현장완료 (field.toris.kr)
      </footer>
    </main>
  );
}
