"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import { toast } from "@/components/Toast";

/* ---------------------------------- 타입 ---------------------------------- */

type IssueKind =
  | "receivable_overdue"
  | "payment_failed"
  | "repeat_inquiry"
  | "churn_risk"
  | "deadline_near"
  | "cost_spike";

interface CommandCard {
  id: string;
  kind: IssueKind;
  title: string;
  impactKrw: number;
  urgency: number;
  score: number;
  reason: string;
  source: { kind: string; id: string; label?: string };
  nextAction: string;
}
interface Runway {
  netBurnKrw: number;
  runwayMonths: number | null;
  status: "healthy" | "tight" | "critical";
}
interface CommandCenterData {
  cards: CommandCard[];
  runway: Runway | null;
  generatedAt: string;
  /** 서버가 내려주는 구독 상태. 무료는 미리보기만. */
  pro?: boolean;
  /** 무료 미리보기로 잘린 카드가 더 있는지. */
  locked?: boolean;
}

const KIND_LABEL: Record<IssueKind, string> = {
  receivable_overdue: "미수금",
  payment_failed: "결제 실패",
  repeat_inquiry: "반복 문의",
  churn_risk: "이탈 징후",
  deadline_near: "마감 임박",
  cost_spike: "비용 급증",
};
const RUNWAY_LABEL: Record<Runway["status"], string> = {
  healthy: "안정",
  tight: "주의",
  critical: "위험",
};
const RUNWAY_TONE: Record<Runway["status"], string> = {
  healthy: "text-step-bright",
  tight: "text-amber-300",
  critical: "text-rose-400",
};

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

/* -------------------------------- Runway Lite ------------------------------- */

function RunwayBanner({ runway }: { runway: Runway | null }) {
  if (!runway) {
    return (
      <div className="glass rounded-2xl p-5 text-sm text-ink-dim">
        재무 스냅샷을 입력하면 생존 가능 기간(런웨이)을 계산합니다. 아래 “돈” 탭에서 현금·매출·비용을 기록하세요.
      </div>
    );
  }
  const months =
    runway.runwayMonths === null ? "흑자 (소모 없음)" : `${runway.runwayMonths.toFixed(1)}개월`;
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-dim">
          Runway Lite
        </span>
        <span className={`text-sm font-semibold ${RUNWAY_TONE[runway.status]}`}>
          {RUNWAY_LABEL[runway.status]}
        </span>
      </div>
      <p className={`mt-2 text-3xl font-extrabold ${RUNWAY_TONE[runway.status]}`}>{months}</p>
      <p className="mt-1 text-sm text-ink-dim">
        월 순소모 {runway.netBurnKrw <= 0 ? "없음" : won(runway.netBurnKrw)}
      </p>
    </div>
  );
}

/* ------------------------------ Command Cards ------------------------------ */

function CardItem({ card }: { card: CommandCard }) {
  return (
    <li className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full border border-line bg-step/10 px-2.5 py-0.5 font-mono text-[11px] text-step-bright">
          {KIND_LABEL[card.kind]}
        </span>
        <span className="font-mono text-[11px] text-ink-dim">
          영향 {won(card.impactKrw)} · 긴급 {Math.round(card.urgency * 100)}%
        </span>
      </div>
      <h3 className="mt-2 text-base font-bold text-ink">{card.title}</h3>
      <p className="mt-1 text-sm text-ink-dim">{card.reason}</p>
      <p className="mt-2 rounded-xl border border-dashed border-line bg-bg-card px-3 py-2 text-sm text-step-bright">
        → {card.nextAction}
      </p>
    </li>
  );
}

/* ------------------------------- 입력 서브탭 ------------------------------- */

type Sub = "finance" | "receivables" | "deadlines" | "features" | "signals" | "payments";
const SUB_NAV: { key: Sub; label: string }[] = [
  { key: "finance", label: "돈" },
  { key: "receivables", label: "미수금" },
  { key: "deadlines", label: "마감" },
  { key: "features", label: "기능 요청" },
  { key: "signals", label: "고객 신호" },
  { key: "payments", label: "결제 실패" },
];

const inputCls =
  "w-full rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus-visible:outline-2 focus-visible:outline-step";
const btnCls =
  "btn-ember rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-step";

function FinanceForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ cashKrw: "", monthlyRevenueKrw: "", monthlyFixedCostKrw: "", monthlyVariableCostKrw: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await authFetch("/app/finance", {
        method: "POST",
        body: JSON.stringify({
          cashKrw: Number(f.cashKrw), monthlyRevenueKrw: Number(f.monthlyRevenueKrw),
          monthlyFixedCostKrw: Number(f.monthlyFixedCostKrw), monthlyVariableCostKrw: Number(f.monthlyVariableCostKrw),
        }),
      });
      setF({ cashKrw: "", monthlyRevenueKrw: "", monthlyFixedCostKrw: "", monthlyVariableCostKrw: "" });
      onDone();
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <input className={inputCls} type="number" min="0" placeholder="현재 현금 (원)" value={f.cashKrw} onChange={(e) => setF({ ...f, cashKrw: e.target.value })} required />
      <input className={inputCls} type="number" min="0" placeholder="월 매출 (원)" value={f.monthlyRevenueKrw} onChange={(e) => setF({ ...f, monthlyRevenueKrw: e.target.value })} required />
      <input className={inputCls} type="number" min="0" placeholder="월 고정비 (원)" value={f.monthlyFixedCostKrw} onChange={(e) => setF({ ...f, monthlyFixedCostKrw: e.target.value })} required />
      <input className={inputCls} type="number" min="0" placeholder="월 변동비 (원)" value={f.monthlyVariableCostKrw} onChange={(e) => setF({ ...f, monthlyVariableCostKrw: e.target.value })} required />
      <button className={btnCls} disabled={busy} type="submit">스냅샷 저장</button>
    </form>
  );
}

function ReceivablesForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ customer: "", amountKrw: "", dueDate: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await authFetch("/app/receivables", {
        method: "POST",
        body: JSON.stringify({ customer: f.customer, amountKrw: Number(f.amountKrw), dueDate: new Date(f.dueDate).toISOString() }),
      });
      setF({ customer: "", amountKrw: "", dueDate: "" });
      onDone();
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <input className={inputCls} placeholder="고객/거래처" value={f.customer} onChange={(e) => setF({ ...f, customer: e.target.value })} required />
      <input className={inputCls} type="number" min="1" placeholder="금액 (원)" value={f.amountKrw} onChange={(e) => setF({ ...f, amountKrw: e.target.value })} required />
      <input className={inputCls} type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} required />
      <button className={btnCls} disabled={busy} type="submit">미수금 추가</button>
    </form>
  );
}

function DeadlinesForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ title: "", dueDate: "", estimatedImpactKrw: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await authFetch("/app/deadlines", {
        method: "POST",
        body: JSON.stringify({ title: f.title, dueDate: new Date(f.dueDate).toISOString(), estimatedImpactKrw: Number(f.estimatedImpactKrw) || 0 }),
      });
      setF({ title: "", dueDate: "", estimatedImpactKrw: "" });
      onDone();
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <input className={inputCls} placeholder="마감/리스크 제목" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required />
      <input className={inputCls} type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} required />
      <input className={inputCls} type="number" min="0" placeholder="놓쳤을 때 추정 손실 (원)" value={f.estimatedImpactKrw} onChange={(e) => setF({ ...f, estimatedImpactKrw: e.target.value })} />
      <button className={btnCls} disabled={busy} type="submit">마감 추가</button>
    </form>
  );
}

function FeaturesForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ title: "", requestCount: "", revenueChurnImpactKrw: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await authFetch("/app/feature-requests", {
        method: "POST",
        body: JSON.stringify({ title: f.title, requestCount: Number(f.requestCount) || 0, revenueChurnImpactKrw: Number(f.revenueChurnImpactKrw) || 0 }),
      });
      setF({ title: "", requestCount: "", revenueChurnImpactKrw: "" });
      onDone();
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <input className={inputCls} placeholder="기능 아이디어/요청" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required />
      <input className={inputCls} type="number" min="0" placeholder="누적 고객 요청 수" value={f.requestCount} onChange={(e) => setF({ ...f, requestCount: e.target.value })} />
      <input className={inputCls} type="number" min="0" placeholder="매출·이탈 영향 (원)" value={f.revenueChurnImpactKrw} onChange={(e) => setF({ ...f, revenueChurnImpactKrw: e.target.value })} />
      <button className={btnCls} disabled={busy} type="submit">Not Now 로 추가</button>
    </form>
  );
}

function SignalsForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ channel: "email", kind: "inquiry", text: "", count: "1", estimatedImpactKrw: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await authFetch("/app/signals", {
        method: "POST",
        body: JSON.stringify({ channel: f.channel, kind: f.kind, text: f.text, count: Number(f.count) || 1, estimatedImpactKrw: Number(f.estimatedImpactKrw) || 0 }),
      });
      setF({ channel: "email", kind: "inquiry", text: "", count: "1", estimatedImpactKrw: "" });
      onDone();
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <select className={inputCls} value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value })}>
        <option value="email">이메일</option><option value="webform">웹폼</option><option value="chat">채팅</option><option value="survey">설문</option><option value="manual">수동</option>
      </select>
      <select className={inputCls} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
        <option value="inquiry">문의</option><option value="feedback">피드백</option><option value="churn">이탈</option><option value="bug">버그</option>
      </select>
      <input className={`${inputCls} sm:col-span-2`} placeholder="내용 (같은 주제면 횟수만 올리세요)" value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} />
      <input className={inputCls} type="number" min="1" placeholder="반복 횟수" value={f.count} onChange={(e) => setF({ ...f, count: e.target.value })} />
      <input className={inputCls} type="number" min="0" placeholder="이탈 시 위협 매출 (원)" value={f.estimatedImpactKrw} onChange={(e) => setF({ ...f, estimatedImpactKrw: e.target.value })} />
      <button className={btnCls} disabled={busy} type="submit">신호 기록</button>
    </form>
  );
}

function PaymentsForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ subscriptionId: "", mrrKrw: "", retryCount: "0" });
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await authFetch("/app/payment-failures", {
        method: "POST",
        body: JSON.stringify({ subscriptionId: f.subscriptionId, mrrKrw: Number(f.mrrKrw) || 0, retryCount: Number(f.retryCount) || 0 }),
      });
      setF({ subscriptionId: "", mrrKrw: "", retryCount: "0" });
      onDone();
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <input className={inputCls} placeholder="구독/고객 식별자" value={f.subscriptionId} onChange={(e) => setF({ ...f, subscriptionId: e.target.value })} required />
      <input className={inputCls} type="number" min="0" placeholder="위협 MRR (원)" value={f.mrrKrw} onChange={(e) => setF({ ...f, mrrKrw: e.target.value })} />
      <input className={inputCls} type="number" min="0" placeholder="재시도 횟수" value={f.retryCount} onChange={(e) => setF({ ...f, retryCount: e.target.value })} />
      <button className={btnCls} disabled={busy} type="submit">결제 실패 기록</button>
    </form>
  );
}

/* -------------------------------- 메인 컴포넌트 ------------------------------- */

export function CommandCenter({ pro }: { pro?: boolean }) {
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [sub, setSub] = useState<Sub>("finance");
  const [error, setError] = useState("");
  // 즉시 정확한 게이팅: 상위(me.pro) 우선, 없으면 서버 응답 pro 폴백
  const isPro = pro ?? data?.pro ?? false;

  const load = useCallback(async () => {
    try {
      setError("");
      const d = await authFetch<CommandCenterData>("/app/command-center");
      setData(d);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "불러오기 실패";
      setError(msg);
      toast.error(msg);
    }
  }, []);

  // 폼 저장 성공 시: 토스트로 피드백 + 데이터 새로고침
  const loadOk = useCallback(() => {
    toast.success("저장했어요");
    void load();
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <RunwayBanner runway={data?.runway ?? null} />

      <section aria-label="오늘의 핵심 3">
        <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-dim">
          Today Command Center
        </h2>
        {error && <p className="text-sm text-step-bright">{error}</p>}
        {data && data.cards.length === 0 && (
          <p className="glass rounded-2xl p-5 text-sm text-ink-dim">
            지금 처리할 긴급 항목이 없습니다. 아래에서 데이터를 기록하면 사업 영향도·긴급도 순으로 오늘의 3가지를 골라줍니다.
          </p>
        )}
        <ul className="grid gap-3">
          {data?.cards.map((card) => (
            <CardItem key={card.id} card={card} />
          ))}
        </ul>
        {data?.locked && (
          <a
            href="/dashboard?tab=account"
            className="mt-3 block glass rounded-2xl p-4 text-sm text-ink-dim transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-step"
          >
            나머지 핵심 항목과 <span className="text-step-bright">생존 가능 기간(런웨이)</span>은 PRO에서 전부 열립니다 →
          </a>
        )}
      </section>

      {isPro ? (
        <section aria-label="데이터 입력" className="glass rounded-2xl p-5">
          <nav className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="입력 항목">
            {SUB_NAV.map((n) => (
              <button
                key={n.key}
                type="button"
                role="tab"
                aria-selected={sub === n.key}
                onClick={() => setSub(n.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-step ${
                  sub === n.key ? "bg-step/15 text-step-bright" : "text-ink-dim hover:text-ink"
                }`}
              >
                {n.label}
              </button>
            ))}
          </nav>
          {sub === "finance" && <FinanceForm onDone={loadOk} />}
          {sub === "receivables" && <ReceivablesForm onDone={loadOk} />}
          {sub === "deadlines" && <DeadlinesForm onDone={loadOk} />}
          {sub === "features" && <FeaturesForm onDone={loadOk} />}
          {sub === "signals" && <SignalsForm onDone={loadOk} />}
          {sub === "payments" && <PaymentsForm onDone={loadOk} />}
          <p className="mt-3 text-xs text-ink-dim">
            기록하면 상단 “오늘의 핵심 3”과 런웨이가 즉시 갱신됩니다.
          </p>
        </section>
      ) : (
        <a
          href="/dashboard?tab=account"
          className="glass block rounded-2xl p-5 text-sm text-ink-dim transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-step"
        >
          <span className="text-step-bright">PRO로 업그레이드</span>하면 재무·미수금·결제 실패·마감·고객 시그널·기능 요청을 직접 기록하고,
          사업 영향도·긴급도로 자동 정렬된 “오늘의 핵심 3”과 생존 가능 기간을 매일 받아볼 수 있습니다 →
        </a>
      )}
    </div>
  );
}
