"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/api";

/* --- Feature 3: 고객 · 성장 신호 허브 --- */

type SignalChannel = "email" | "webform" | "chat" | "survey" | "manual";
type SignalKind = "inquiry" | "feedback" | "churn" | "bug";

interface Signal {
  id: string;
  channel: SignalChannel;
  kind: SignalKind;
  text: string;
  count: number;
  estimatedImpactKrw: number;
  receivedAt: string;
}

interface SignalsResponse {
  signals: Signal[];
}

const inputCls =
  "w-full rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus-visible:outline-2 focus-visible:outline-step";
const btnCls =
  "btn-ember rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-step";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

const CHANNELS: Record<SignalChannel, string> = {
  email: "이메일",
  webform: "웹폼",
  chat: "채팅",
  survey: "설문",
  manual: "수동",
};

const KINDS: Record<SignalKind, { label: string; cls: string }> = {
  inquiry: { label: "문의", cls: "text-sky-400" },
  feedback: { label: "피드백", cls: "text-emerald-400" },
  churn: { label: "이탈", cls: "text-rose-400" },
  bug: { label: "버그", cls: "text-amber-300" },
};

interface FormState {
  channel: SignalChannel;
  kind: SignalKind;
  text: string;
  count: string;
  estimatedImpactKrw: string;
}

const emptyForm: FormState = {
  channel: "manual",
  kind: "inquiry",
  text: "",
  count: "1",
  estimatedImpactKrw: "",
};

export default function SignalHub() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch<SignalsResponse>("/app/signals");
      setSignals(res.signals);
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
    if (!form.text.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await authFetch("/app/signals", {
        method: "POST",
        body: JSON.stringify({
          channel: form.channel,
          kind: form.kind,
          text: form.text.trim(),
          count: Number(form.count) || 1,
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

  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="mb-1 text-lg font-bold text-ink">고객 · 성장 신호 허브</h2>
      <p className="mb-4 text-sm text-ink-dim">
        이메일·웹폼·채팅·설문·수동 입력을 한곳에 모아 다음 행동으로 전환합니다.
      </p>

      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs text-ink-dim">채널</span>
          <select
            className={inputCls}
            value={form.channel}
            onChange={(e) =>
              setForm({ ...form, channel: e.target.value as SignalChannel })
            }
          >
            {(Object.keys(CHANNELS) as SignalChannel[]).map((k) => (
              <option key={k} value={k}>
                {CHANNELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-dim">종류</span>
          <select
            className={inputCls}
            value={form.kind}
            onChange={(e) =>
              setForm({ ...form, kind: e.target.value as SignalKind })
            }
          >
            {(Object.keys(KINDS) as SignalKind[]).map((k) => (
              <option key={k} value={k}>
                {KINDS[k].label}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs text-ink-dim">내용</span>
          <input
            className={inputCls}
            placeholder="예: 인보이스 자동 발송 기능 문의"
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-dim">동일 건수</span>
          <input
            className={inputCls}
            type="number"
            min="1"
            value={form.count}
            onChange={(e) => setForm({ ...form, count: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-dim">추정 영향 (원)</span>
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
            {saving ? "기록 중…" : "신호 기록"}
          </button>
          {error && <span className="text-sm text-rose-400">{error}</span>}
        </div>
      </form>

      <div className="mt-6">
        <h3 className="mb-2 text-sm font-semibold text-ink-dim">
          최근 신호 {signals.length > 0 && `(${signals.length})`}
        </h3>
        {loading ? (
          <p className="text-sm text-ink-dim">불러오는 중…</p>
        ) : signals.length === 0 ? (
          <p className="text-sm text-ink-dim">아직 기록된 신호가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-line">
            {signals.map((s) => {
              const k = KINDS[s.kind];
              return (
                <li key={s.id} className="flex items-start gap-3 py-2.5">
                  <span className={`shrink-0 text-xs font-semibold ${k.cls}`}>
                    {k.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{s.text}</p>
                    <p className="text-xs text-ink-dim">
                      {CHANNELS[s.channel]}
                      {s.count > 1 && ` · ${s.count}건`}
                      {s.estimatedImpactKrw > 0 &&
                        ` · 영향 ${won(s.estimatedImpactKrw)}`}
                      {" · "}
                      {new Date(s.receivedAt).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
