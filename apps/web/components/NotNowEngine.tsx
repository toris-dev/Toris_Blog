"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/api";

/* --- Feature 4: 우선순위 엔진 · Not Now --- */

type FeatureRequestStatus = "not_now" | "this_week" | "done";

interface FeatureRequest {
  id: string;
  title: string;
  requestCount: number;
  customerValueKrw: number;
  revenueChurnImpactKrw: number;
  strategyFit: number;
  urgency: number;
  estimatedEffortDays: number;
  origin: "customer" | "founder";
  status: FeatureRequestStatus;
  createdAt: string;
}

interface Triage {
  thisWeek: FeatureRequest[];
  notNow: FeatureRequest[];
}

interface FRResponse {
  requests: FeatureRequest[];
  triage: Triage;
}

const inputCls =
  "w-full rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus-visible:outline-2 focus-visible:outline-step";
const btnCls =
  "btn-ember rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-step";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

interface FormState {
  title: string;
  origin: "customer" | "founder";
  requestCount: string;
  revenueChurnImpactKrw: string;
}

const emptyForm: FormState = {
  title: "",
  origin: "customer",
  requestCount: "1",
  revenueChurnImpactKrw: "",
};

function RequestRow({
  r,
  onMove,
  busy,
}: {
  r: FeatureRequest;
  onMove: (id: string, status: FeatureRequestStatus) => void;
  busy: boolean;
}) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-ink">{r.title}</p>
        <p className="text-xs text-ink-dim">
          {r.origin === "founder" ? "대표 착상" : "고객 요청"}
          {` · 요청 ${r.requestCount}건`}
          {r.revenueChurnImpactKrw > 0 && ` · 매출영향 ${won(r.revenueChurnImpactKrw)}`}
        </p>
      </div>
      {r.status !== "this_week" && (
        <button
          type="button"
          className="shrink-0 rounded-md border border-line px-2 py-1 text-xs text-ink-dim transition-colors hover:text-ink disabled:opacity-50"
          disabled={busy}
          onClick={() => onMove(r.id, "this_week")}
        >
          이번 주 →
        </button>
      )}
      {r.status !== "not_now" && (
        <button
          type="button"
          className="shrink-0 rounded-md border border-line px-2 py-1 text-xs text-ink-dim transition-colors hover:text-ink disabled:opacity-50"
          disabled={busy}
          onClick={() => onMove(r.id, "not_now")}
        >
          Not Now
        </button>
      )}
    </li>
  );
}

export default function NotNowEngine() {
  const [triage, setTriage] = useState<Triage | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch<FRResponse>("/app/feature-requests");
      setTriage(res.triage);
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
    if (!form.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await authFetch("/app/feature-requests", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          origin: form.origin,
          requestCount: Number(form.requestCount) || 0,
          revenueChurnImpactKrw: Number(form.revenueChurnImpactKrw) || 0,
        }),
      });
      setForm(emptyForm);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const move = async (id: string, status: FeatureRequestStatus) => {
    setBusyId(id);
    try {
      await authFetch(`/app/feature-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "이동 실패");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="mb-1 text-lg font-bold text-ink">우선순위 엔진 · Not Now</h2>
      <p className="mb-4 text-sm text-ink-dim">
        대표 착상은 기본 Not Now. 실제 고객 신호가 쌓일 때만 이번 주로 승격됩니다.
      </p>

      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs text-ink-dim">기능 요청</span>
          <input
            className={inputCls}
            placeholder="예: 슬랙 알림 연동"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-dim">출처</span>
          <select
            className={inputCls}
            value={form.origin}
            onChange={(e) =>
              setForm({
                ...form,
                origin: e.target.value as "customer" | "founder",
              })
            }
          >
            <option value="customer">고객 요청</option>
            <option value="founder">대표 착상</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-dim">요청 건수</span>
          <input
            className={inputCls}
            type="number"
            min="0"
            value={form.requestCount}
            onChange={(e) => setForm({ ...form, requestCount: e.target.value })}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs text-ink-dim">
            매출·이탈 영향 (원)
          </span>
          <input
            className={inputCls}
            type="number"
            min="0"
            placeholder="0"
            value={form.revenueChurnImpactKrw}
            onChange={(e) =>
              setForm({ ...form, revenueChurnImpactKrw: e.target.value })
            }
          />
        </label>
        <div className="sm:col-span-2 flex items-center gap-3">
          <button className={btnCls} type="submit" disabled={saving}>
            {saving ? "추가 중…" : "요청 추가"}
          </button>
          {error && <span className="text-sm text-rose-400">{error}</span>}
        </div>
      </form>

      {loading ? (
        <p className="mt-6 text-sm text-ink-dim">불러오는 중…</p>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-emerald-400">
              이번 주 {triage && `(${triage.thisWeek.length})`}
            </h3>
            {triage && triage.thisWeek.length > 0 ? (
              <ul className="divide-y divide-line">
                {triage.thisWeek.map((r) => (
                  <RequestRow
                    key={r.id}
                    r={r}
                    onMove={move}
                    busy={busyId === r.id}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-dim">
                승격된 요청이 없습니다. 신호가 쌓이면 자동으로 후보가 됩니다.
              </p>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink-dim">
              Not Now {triage && `(${triage.notNow.length})`}
            </h3>
            {triage && triage.notNow.length > 0 ? (
              <ul className="divide-y divide-line">
                {triage.notNow.map((r) => (
                  <RequestRow
                    key={r.id}
                    r={r}
                    onMove={move}
                    busy={busyId === r.id}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-dim">대기 중인 요청이 없습니다.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
