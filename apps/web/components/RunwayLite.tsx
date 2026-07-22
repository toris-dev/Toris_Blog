"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/api";

/* --- Feature 2: 돈 · Runway Lite --- */

type RunwayStatus = "healthy" | "tight" | "critical";

interface Runway {
  netBurnKrw: number;
  runwayMonths: number | null;
  status: RunwayStatus;
}

interface Snapshot {
  builderId: string;
  cashKrw: number;
  monthlyRevenueKrw: number;
  monthlyFixedCostKrw: number;
  monthlyVariableCostKrw: number;
  recordedAt: string;
}

interface FinanceResponse {
  snapshots: Snapshot[];
  runway: Runway | null;
}

const inputCls =
  "w-full rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus-visible:outline-2 focus-visible:outline-step";
const btnCls =
  "btn-ember rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-step";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

const STATUS: Record<RunwayStatus, { label: string; cls: string }> = {
  healthy: { label: "안정", cls: "text-emerald-400" },
  tight: { label: "주의", cls: "text-amber-300" },
  critical: { label: "위험", cls: "text-rose-400" },
};

function RunwayHeadline({ runway }: { runway: Runway | null }) {
  if (!runway) {
    return (
      <p className="text-sm text-ink-dim">
        아직 재무 스냅샷이 없습니다. 아래에서 현재 상태를 입력하면 생존 가능 기간을
        계산합니다.
      </p>
    );
  }
  const s = STATUS[runway.status];
  const months =
    runway.runwayMonths === null
      ? "무한 (흑자)"
      : `${runway.runwayMonths.toFixed(1)}개월`;
  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
      <div>
        <p className="text-xs text-ink-dim">남은 런웨이</p>
        <p className={`text-3xl font-extrabold ${s.cls}`}>{months}</p>
      </div>
      <div>
        <p className="text-xs text-ink-dim">상태</p>
        <p className={`text-lg font-semibold ${s.cls}`}>{s.label}</p>
      </div>
      <div>
        <p className="text-xs text-ink-dim">월 순소모</p>
        <p className="text-lg font-semibold text-ink">
          {runway.netBurnKrw <= 0 ? "소모 없음" : won(runway.netBurnKrw)}
        </p>
      </div>
    </div>
  );
}

const FIELDS: { key: keyof FormState; label: string }[] = [
  { key: "cashKrw", label: "현재 현금 (원)" },
  { key: "monthlyRevenueKrw", label: "월 매출 (원)" },
  { key: "monthlyFixedCostKrw", label: "월 고정비 (원)" },
  { key: "monthlyVariableCostKrw", label: "월 변동비 (원)" },
];

interface FormState {
  cashKrw: string;
  monthlyRevenueKrw: string;
  monthlyFixedCostKrw: string;
  monthlyVariableCostKrw: string;
}

const emptyForm: FormState = {
  cashKrw: "",
  monthlyRevenueKrw: "",
  monthlyFixedCostKrw: "",
  monthlyVariableCostKrw: "",
};

export default function RunwayLite() {
  const [data, setData] = useState<FinanceResponse | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch<FinanceResponse>("/app/finance");
      setData(res);
      const s = res.snapshots[0];
      if (s) {
        setForm({
          cashKrw: String(s.cashKrw),
          monthlyRevenueKrw: String(s.monthlyRevenueKrw),
          monthlyFixedCostKrw: String(s.monthlyFixedCostKrw),
          monthlyVariableCostKrw: String(s.monthlyVariableCostKrw),
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await authFetch("/app/finance", {
        method: "POST",
        body: JSON.stringify({
          cashKrw: Number(form.cashKrw) || 0,
          monthlyRevenueKrw: Number(form.monthlyRevenueKrw) || 0,
          monthlyFixedCostKrw: Number(form.monthlyFixedCostKrw) || 0,
          monthlyVariableCostKrw: Number(form.monthlyVariableCostKrw) || 0,
        }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="mb-1 text-lg font-bold text-ink">돈 · Runway Lite</h2>
      <p className="mb-4 text-sm text-ink-dim">
        생존 가능 기간을 판단하는 최소 재무 화면.
      </p>

      {loading ? (
        <p className="text-sm text-ink-dim">불러오는 중…</p>
      ) : (
        <RunwayHeadline runway={data?.runway ?? null} />
      )}

      <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-xs text-ink-dim">{f.label}</span>
            <input
              className={inputCls}
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="0"
              value={form[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              required
            />
          </label>
        ))}
        <div className="sm:col-span-2 flex items-center gap-3">
          <button className={btnCls} type="submit" disabled={saving}>
            {saving ? "저장 중…" : "재무 상태 갱신"}
          </button>
          {error && <span className="text-sm text-rose-400">{error}</span>}
        </div>
      </form>
    </section>
  );
}
