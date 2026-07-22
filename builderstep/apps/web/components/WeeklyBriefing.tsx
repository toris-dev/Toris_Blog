"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/api";

/* --- Feature 6: 주간 CEO 브리핑 (핵심 차별점: 방지한 손실) --- */

type RunwayStatus = "healthy" | "tight" | "critical";
type LossPreventedKind =
  | "recovered_receivable"
  | "recovered_payment"
  | "canceled_subscription"
  | "prevented_expiry"
  | "reduced_inquiry_time"
  | "recovered_churn";

interface Delta {
  current: number;
  previous: number;
  delta: number;
}

interface Briefing {
  weekStart: string;
  weekEnd: string;
  revenue: Delta;
  cash: Delta;
  customers: Delta;
  inquiries: Delta;
  runway: { netBurnKrw: number; runwayMonths: number | null; status: RunwayStatus };
  lossPrevented: {
    totalKrw: number;
    byKind: Record<LossPreventedKind, number>;
    count: number;
  };
  resolvedRisks: string[];
  remainingRisks: string[];
  toStop: string[];
  nextFocus: string[];
  approved: boolean;
}

interface BriefingResponse {
  briefing: Briefing;
}

const inputCls =
  "w-full rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus-visible:outline-2 focus-visible:outline-step";
const btnCls =
  "btn-ember rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-step";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

const LP_LABELS: Record<LossPreventedKind, string> = {
  recovered_receivable: "회수한 미수금",
  recovered_payment: "복구한 결제 실패",
  canceled_subscription: "해지한 불필요 구독",
  prevented_expiry: "방지한 도메인·인증서 만료",
  reduced_inquiry_time: "줄어든 반복 문의 시간",
  recovered_churn: "복구한 이탈 위험 매출",
};

function DeltaCard({ label, d, money }: { label: string; d: Delta; money?: boolean }) {
  const fmt = (n: number) => (money ? won(n) : n.toLocaleString("ko-KR"));
  const up = d.delta > 0;
  const down = d.delta < 0;
  const cls = up ? "text-emerald-400" : down ? "text-rose-400" : "text-ink-dim";
  const sign = up ? "▲" : down ? "▼" : "–";
  return (
    <div className="rounded-lg border border-line bg-bg-card p-3">
      <p className="text-xs text-ink-dim">{label}</p>
      <p className="text-lg font-bold text-ink">{fmt(d.current)}</p>
      <p className={`text-xs ${cls}`}>
        {sign} {fmt(Math.abs(d.delta))}
      </p>
    </div>
  );
}

function RiskList({
  title,
  items,
  cls,
  empty,
}: {
  title: string;
  items: string[];
  cls: string;
  empty: string;
}) {
  return (
    <div>
      <h4 className={`mb-1.5 text-sm font-semibold ${cls}`}>
        {title} {items.length > 0 && `(${items.length})`}
      </h4>
      {items.length === 0 ? (
        <p className="text-sm text-ink-dim">{empty}</p>
      ) : (
        <ul className="list-inside list-disc space-y-1 text-sm text-ink">
          {items.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface LpForm {
  kind: LossPreventedKind;
  amountKrw: string;
  note: string;
}

const emptyLp: LpForm = {
  kind: "recovered_receivable",
  amountKrw: "",
  note: "",
};

export default function WeeklyBriefing() {
  const [b, setB] = useState<Briefing | null>(null);
  const [lp, setLp] = useState<LpForm>(emptyLp);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch<BriefingResponse>("/app/weekly-briefing");
      setB(res.briefing);
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const recordLoss = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lp.amountKrw) return;
    setSaving(true);
    setError(null);
    try {
      await authFetch("/app/loss-prevented", {
        method: "POST",
        body: JSON.stringify({
          kind: lp.kind,
          amountKrw: Number(lp.amountKrw) || 0,
          note: lp.note.trim(),
        }),
      });
      setLp(emptyLp);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="mb-1 text-lg font-bold text-ink">주간 CEO 브리핑</h2>
      <p className="mb-4 text-sm text-ink-dim">
        매출·현금·고객·문의 변화와 이번 주 방지한 손실을 한 장으로.
      </p>

      {loading ? (
        <p className="text-sm text-ink-dim">불러오는 중…</p>
      ) : !b ? (
        <p className="text-sm text-ink-dim">브리핑을 불러올 수 없습니다.</p>
      ) : (
        <>
          <p className="mb-3 text-xs text-ink-dim">
            {new Date(b.weekStart).toLocaleDateString("ko-KR")} ~{" "}
            {new Date(b.weekEnd).toLocaleDateString("ko-KR")}
          </p>

          {/* 핵심 차별점: 방지한 손실 */}
          <div className="mb-5 rounded-xl border border-step/40 bg-step/10 p-4">
            <p className="text-xs text-step-bright">이번 주 방지한 손실</p>
            <p className="text-3xl font-extrabold text-step-bright">
              {won(b.lossPrevented.totalKrw)}
            </p>
            <p className="text-xs text-ink-dim">
              {b.lossPrevented.count}건 집계
            </p>
            {b.lossPrevented.totalKrw > 0 && (
              <ul className="mt-2 grid gap-1 text-xs text-ink sm:grid-cols-2">
                {(Object.keys(b.lossPrevented.byKind) as LossPreventedKind[])
                  .filter((k) => b.lossPrevented.byKind[k] > 0)
                  .map((k) => (
                    <li key={k} className="flex justify-between gap-2">
                      <span className="text-ink-dim">{LP_LABELS[k]}</span>
                      <span className="font-semibold">
                        {won(b.lossPrevented.byKind[k])}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {/* 변화 지표 */}
          <div className="mb-5 grid gap-3 grid-cols-2 sm:grid-cols-4">
            <DeltaCard label="월 매출" d={b.revenue} money />
            <DeltaCard label="현금" d={b.cash} money />
            <DeltaCard label="고객" d={b.customers} />
            <DeltaCard label="문의" d={b.inquiries} />
          </div>

          {/* 위험 요약 */}
          <div className="mb-5 grid gap-5 sm:grid-cols-2">
            <RiskList
              title="해결한 위험"
              items={b.resolvedRisks}
              cls="text-emerald-400"
              empty="이번 주 해결한 위험이 없습니다."
            />
            <RiskList
              title="남아 있는 위험"
              items={b.remainingRisks}
              cls="text-rose-400"
              empty="남아 있는 위험이 없습니다."
            />
            <RiskList
              title="중단 제안"
              items={b.toStop}
              cls="text-amber-300"
              empty="중단 제안이 없습니다."
            />
            <RiskList
              title="다음 주 집중 3개"
              items={b.nextFocus}
              cls="text-step-bright"
              empty="집중할 항목이 없습니다."
            />
          </div>

          {/* 대표 최종 승인 */}
          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              className={btnCls}
              disabled={approved}
              onClick={() => setApproved(true)}
            >
              {approved ? "✓ 승인됨" : "대표 최종 승인"}
            </button>
            {approved && (
              <span className="text-sm text-emerald-400">
                이번 주 브리핑을 승인했습니다.
              </span>
            )}
          </div>
        </>
      )}

      {/* 방지한 손실 기록 */}
      <form
        onSubmit={recordLoss}
        className="grid gap-3 border-t border-line pt-5 sm:grid-cols-2"
      >
        <h3 className="sm:col-span-2 text-sm font-semibold text-ink-dim">
          방지한 손실 기록
        </h3>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-dim">종류</span>
          <select
            className={inputCls}
            value={lp.kind}
            onChange={(e) =>
              setLp({ ...lp, kind: e.target.value as LossPreventedKind })
            }
          >
            {(Object.keys(LP_LABELS) as LossPreventedKind[]).map((k) => (
              <option key={k} value={k}>
                {LP_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-dim">금액 (원)</span>
          <input
            className={inputCls}
            type="number"
            min="0"
            placeholder="0"
            value={lp.amountKrw}
            onChange={(e) => setLp({ ...lp, amountKrw: e.target.value })}
            required
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs text-ink-dim">메모</span>
          <input
            className={inputCls}
            placeholder="예: A사 미수금 회수"
            value={lp.note}
            onChange={(e) => setLp({ ...lp, note: e.target.value })}
          />
        </label>
        <div className="sm:col-span-2 flex items-center gap-3">
          <button className={btnCls} type="submit" disabled={saving}>
            {saving ? "기록 중…" : "손실 방지 기록"}
          </button>
          {error && <span className="text-sm text-rose-400">{error}</span>}
        </div>
      </form>
    </section>
  );
}
