"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/api";

/* --- Feature 5: 마감 · 리스크 센터 --- */

interface Deadline {
  id: string;
  title: string;
  dueDate: string;
  estimatedImpactKrw: number;
  doneAt: string | null;
}

interface DeadlinesResponse {
  deadlines: Deadline[];
}

const inputCls =
  "w-full rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus-visible:outline-2 focus-visible:outline-step";
const btnCls =
  "btn-ember rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-step";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

const DAY = 24 * 60 * 60 * 1000;

/** 마감까지 남은 일수 → 알림 밴드(30·14·7·당일). */
function band(dueMs: number, now: number) {
  const days = Math.ceil((dueMs - now) / DAY);
  if (days < 0) return { days, label: `${-days}일 지남`, cls: "text-rose-400" };
  if (days === 0) return { days, label: "오늘 마감", cls: "text-rose-400" };
  if (days <= 7) return { days, label: `D-${days}`, cls: "text-amber-300" };
  if (days <= 14) return { days, label: `D-${days}`, cls: "text-amber-200" };
  if (days <= 30) return { days, label: `D-${days}`, cls: "text-ink-dim" };
  return { days, label: `D-${days}`, cls: "text-ink-dim" };
}

interface FormState {
  title: string;
  dueDate: string;
  estimatedImpactKrw: string;
}

const emptyForm: FormState = { title: "", dueDate: "", estimatedImpactKrw: "" };

export default function RiskCenter() {
  const [items, setItems] = useState<Deadline[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch<DeadlinesResponse>("/app/deadlines");
      setItems(res.deadlines);
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
    if (!form.title.trim() || !form.dueDate) return;
    setSaving(true);
    setError(null);
    try {
      await authFetch("/app/deadlines", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          dueDate: new Date(form.dueDate).toISOString(),
          estimatedImpactKrw: Number(form.estimatedImpactKrw) || 0,
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

  const toggle = async (d: Deadline) => {
    setBusyId(d.id);
    try {
      await authFetch(`/app/deadlines/${d.id}`, {
        method: "PATCH",
        body: JSON.stringify({ done: d.doneAt === null }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "업데이트 실패");
    } finally {
      setBusyId(null);
    }
  };

  const now = Date.now();
  const open = items.filter((d) => d.doneAt === null);
  const done = items.filter((d) => d.doneAt !== null);

  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="mb-1 text-lg font-bold text-ink">마감 · 리스크 센터</h2>
      <p className="mb-4 text-sm text-ink-dim">
        세무·지원사업·계약·도메인·SSL·인증서 갱신 마감을 놓쳤을 때의 위험과 함께 관리합니다.
      </p>

      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs text-ink-dim">마감 항목</span>
          <input
            className={inputCls}
            placeholder="예: 부가세 신고 / 도메인 갱신"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-dim">기준일</span>
          <input
            className={inputCls}
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-dim">
            놓쳤을 때 영향 (원)
          </span>
          <input
            className={inputCls}
            type="number"
            min="0"
            placeholder="0"
            value={form.estimatedImpactKrw}
            onChange={(e) =>
              setForm({ ...form, estimatedImpactKrw: e.target.value })
            }
          />
        </label>
        <div className="sm:col-span-2 flex items-center gap-3">
          <button className={btnCls} type="submit" disabled={saving}>
            {saving ? "추가 중…" : "마감 추가"}
          </button>
          {error && <span className="text-sm text-rose-400">{error}</span>}
        </div>
      </form>

      <div className="mt-6">
        <h3 className="mb-2 text-sm font-semibold text-ink-dim">
          다가오는 마감 {open.length > 0 && `(${open.length})`}
        </h3>
        {loading ? (
          <p className="text-sm text-ink-dim">불러오는 중…</p>
        ) : open.length === 0 ? (
          <p className="text-sm text-ink-dim">임박한 마감이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-line">
            {open.map((d) => {
              const b = band(new Date(d.dueDate).getTime(), now);
              return (
                <li key={d.id} className="flex items-center gap-3 py-2.5">
                  <span
                    className={`w-16 shrink-0 text-sm font-bold ${b.cls}`}
                  >
                    {b.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{d.title}</p>
                    <p className="text-xs text-ink-dim">
                      {new Date(d.dueDate).toLocaleDateString("ko-KR")}
                      {d.estimatedImpactKrw > 0 &&
                        ` · 위험 ${won(d.estimatedImpactKrw)}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-md border border-line px-2 py-1 text-xs text-ink-dim transition-colors hover:text-ink disabled:opacity-50"
                    disabled={busyId === d.id}
                    onClick={() => toggle(d)}
                  >
                    완료
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {done.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 text-sm font-semibold text-ink-dim">
            완료 ({done.length})
          </h3>
          <ul className="divide-y divide-line">
            {done.map((d) => (
              <li key={d.id} className="flex items-center gap-3 py-2">
                <span className="w-16 shrink-0 text-xs text-emerald-400">
                  완료
                </span>
                <p className="min-w-0 flex-1 truncate text-sm text-ink-dim line-through">
                  {d.title}
                </p>
                <button
                  type="button"
                  className="shrink-0 rounded-md border border-line px-2 py-1 text-xs text-ink-dim transition-colors hover:text-ink disabled:opacity-50"
                  disabled={busyId === d.id}
                  onClick={() => toggle(d)}
                >
                  되돌리기
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
