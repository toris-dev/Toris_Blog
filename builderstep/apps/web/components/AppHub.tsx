"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { FREE_GOAL_LIMIT } from "@builderstep/shared";
import { auth, googleProvider } from "@/lib/firebase";
import { authFetch } from "@/lib/api";
import { DIAGNOSIS } from "@/lib/diagnosis";
import { STAGES } from "@/lib/stages";
import { CommandCenter } from "@/components/CommandCenter";
import RunwayLite from "@/components/RunwayLite";
import SignalHub from "@/components/SignalHub";
import NotNowEngine from "@/components/NotNowEngine";
import RiskCenter from "@/components/RiskCenter";
import WeeklyBriefing from "@/components/WeeklyBriefing";

const CHECKOUT = process.env.NEXT_PUBLIC_RAPID_CHECKOUT_URL ?? "";

/* ---------------------------------- 타입 ---------------------------------- */

interface Me {
  email: string;
  pro: boolean;
  status: string;
  stage: number;
  diagnosedAt: string | null;
}
interface Goal {
  id: number;
  title: string;
  stage: number | null;
  status: "todo" | "doing" | "done";
  retro: string | null;
  createdAt: string;
  updatedAt: string;
}
interface Post {
  id: number;
  author: string;
  type: "story" | "feedback" | "match";
  title: string;
  body: string;
  createdAt: string;
}
interface SessionRow {
  id: number;
  topic: "marketing" | "pricing" | "tax" | "legal";
  preferredAt: string;
  note: string | null;
  status: "requested" | "confirmed" | "done" | "canceled";
}
interface MetricRow {
  date: string;
  revenue: number;
  users: number;
}

const POST_TYPE: Record<Post["type"], string> = {
  story: "기록",
  feedback: "피드백 요청",
  match: "빌더 매칭",
};
const TOPIC_LABEL: Record<SessionRow["topic"], string> = {
  marketing: "마케팅",
  pricing: "가격",
  tax: "세무",
  legal: "법률",
};
const SESSION_STATUS: Record<SessionRow["status"], string> = {
  requested: "확정 대기",
  confirmed: "확정됨",
  done: "완료",
  canceled: "취소됨",
};
const GOAL_STATUS: Record<Goal["status"], { label: string; next: Goal["status"] }> = {
  todo: { label: "할 일", next: "doing" },
  doing: { label: "진행 중", next: "done" },
  done: { label: "완료", next: "todo" },
};

/* --------------------------------- 공용 UI --------------------------------- */

/** 대시보드 카드 — 모노 라벨(좌표계) + 본문, 행 안에서 높이를 채운다 */
function Card({
  eyebrow, title, action, children,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="glass flex h-full flex-col rounded-2xl p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-bold tracking-[0.24em] text-step-bright">{eyebrow}</p>
          <h3 className="mt-1.5 text-lg font-extrabold text-ink">{title}</h3>
        </div>
        {action}
      </div>
      <div className="mt-4 flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

function ProLock({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="glass flex h-full flex-col items-center justify-center rounded-2xl border-dashed p-6 text-center">
      <p className="font-mono text-[10px] font-bold tracking-[0.24em] text-lock">{eyebrow} · PRO 🔒</p>
      <h3 className="mt-2 text-lg font-extrabold text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-dim">{desc}</p>
      <a
        href={CHECKOUT || "/dashboard"}
        className="btn-ember mt-4 inline-flex h-10 items-center rounded-xl px-5 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-step-bright"
      >
        {CHECKOUT ? "구독하고 열기" : "구독 상태 확인"}
      </a>
    </div>
  );
}

/* ------------------------------- 요약 스트립 ------------------------------- */

function DigestStrip({ me, goals }: { me: Me; goals: Goal[] }) {
  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const weekStart = monday.toISOString();

  const doneThisWeek = goals.filter((g) => g.status === "done" && g.updatedAt >= weekStart).length;
  const doing = goals.filter((g) => g.status === "doing").length;
  const stage = STAGES[me.stage - 1];

  const tiles = [
    {
      label: "현재 단계",
      value: stage ? `${String(stage.n).padStart(2, "0")} ${stage.name}` : "미진단",
      tone: "text-ink",
    },
    { label: "이번 주 완료", value: `${doneThisWeek}개`, tone: "text-ok" },
    { label: "진행 중", value: `${doing}개`, tone: "text-step-bright" },
    { label: "등록된 목표", value: `${goals.length}개`, tone: "text-ink" },
  ];

  return (
    <section aria-label="주간 요약" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="glass rounded-2xl px-5 py-4">
          <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-muted">{t.label}</p>
          <p className={`mt-1.5 truncate text-xl font-extrabold ${t.tone}`}>{t.value}</p>
        </div>
      ))}
    </section>
  );
}

/* ---------------------------- 개요: 로드맵 진행 미리보기 ---------------------------- */

function RoadmapPreview({ stageN, onJump }: { stageN: number; onJump: () => void }) {
  const current = STAGES[stageN - 1];
  const pct = Math.round((Math.max(0, Math.min(stageN, STAGES.length)) / STAGES.length) * 100);
  return (
    <section aria-label="사업화 로드맵 진행" className="glass flex h-full flex-col rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-ink">사업화 로드맵</h3>
        <button
          type="button"
          onClick={onJump}
          className="font-mono text-[11px] font-bold text-step-bright underline underline-offset-4 transition-colors hover:text-ink"
        >
          로드맵 열기 →
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-card">
          <div className="h-full rounded-full bg-step transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="font-mono text-[11px] font-bold text-muted">{pct}%</span>
      </div>

      <ol className="mt-4 grid grid-cols-4 gap-2">
        {STAGES.map((s) => {
          const done = s.n < stageN;
          const active = s.n === stageN;
          return (
            <li
              key={s.key}
              className={`rounded-xl border px-2 py-2 text-center ${
                active ? "border-step bg-step/10" : done ? "border-line/70 bg-card" : "border-line/40"
              }`}
            >
              <p
                className={`font-mono text-[10px] font-bold ${
                  active ? "text-step-bright" : done ? "text-ok" : "text-muted"
                }`}
              >
                {String(s.n).padStart(2, "0")}
              </p>
              <p className={`mt-0.5 truncate text-[11px] font-semibold ${active ? "text-ink" : "text-ink-dim"}`}>
                {s.name}
              </p>
            </li>
          );
        })}
      </ol>

      {current ? (
        <div className="mt-4 rounded-xl border border-line/60 bg-card p-4">
          <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-muted">지금 집중할 질문</p>
          <p className="mt-1 text-sm font-semibold text-ink">{current.question}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-dim">{current.description}</p>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-line/60 p-4 text-sm text-muted">
          단계 진단을 마치면 로드맵이 채워집니다.
        </div>
      )}
    </section>
  );
}

/* ---------------------------- 개요: 커뮤니티 최신글 미리보기 ---------------------------- */

function CommunityPreview({ posts, onJump }: { posts: Post[]; onJump: () => void }) {
  const latest = posts.slice(0, 4);
  return (
    <section aria-label="커뮤니티 최신 글" className="glass flex h-full flex-col rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-ink">커뮤니티 최신</h3>
        <button
          type="button"
          onClick={onJump}
          className="font-mono text-[11px] font-bold text-step-bright underline underline-offset-4 transition-colors hover:text-ink"
        >
          커뮤니티 열기 →
        </button>
      </div>

      {latest.length === 0 ? (
        <div className="mt-4 flex flex-1 items-center justify-center rounded-xl border border-dashed border-line/60 p-6 text-center text-sm text-muted">
          아직 글이 없습니다. 첫 기록을 남겨보세요.
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-line/60">
          {latest.map((p) => (
            <li key={p.id} className="py-3">
              <div className="flex items-center gap-2">
                <span className="shrink-0 rounded-full bg-step/10 px-2 py-0.5 font-mono text-[10px] font-bold text-step-bright">
                  {POST_TYPE[p.type]}
                </span>
                <span className="truncate text-sm font-semibold text-ink">{p.title}</span>
              </div>
              <p className="mt-1 truncate text-xs text-ink-dim">{p.body}</p>
              <p className="mt-1 font-mono text-[10px] text-muted">
                {p.author} · {new Date(p.createdAt).toLocaleDateString("ko-KR")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* -------------------------------- 단계 진단 -------------------------------- */

function DiagnosisSection({ me, onSaved }: { me: Me; onSaved: () => void }) {
  const [running, setRunning] = useState(me.stage === 0);
  const [qIdx, setQIdx] = useState(0);
  const [floor, setFloor] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (me.stage === 0) setRunning(true);
  }, [me.stage]);

  const finish = async (finalFloor: number) => {
    setSaving(true);
    setError("");
    try {
      await authFetch("/app/me", { method: "PUT", body: JSON.stringify({ stage: finalFloor }) });
      setRunning(false);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const answer = (optFloor: number, stop?: boolean) => {
    const nf = Math.max(floor, optFloor);
    setFloor(nf);
    if (stop || qIdx + 1 >= DIAGNOSIS.length) void finish(nf);
    else setQIdx(qIdx + 1);
  };

  const stage = STAGES[me.stage - 1];

  if (!running && stage) {
    return (
      <Card
        eyebrow={`DIAGNOSIS · STEP ${String(stage.n).padStart(2, "0")}`}
        title={`${stage.name} — ${stage.question}`}
        action={
          <button
            onClick={() => { setRunning(true); setQIdx(0); setFloor(1); }}
            className="btn-ghost shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-step"
          >
            다시 진단
          </button>
        }
      >
        <p className="text-sm leading-relaxed text-ink-dim">{stage.description}</p>
        <p className="mt-4 text-[13px] font-semibold text-ink">이번 주 추천 액션</p>
        <ul className="mt-2 space-y-2">
          {stage.help.map((h, i) => (
            <li key={h} className="flex items-center gap-2.5 text-sm text-ink-dim">
              <span className="font-mono text-[10px] font-bold text-step-bright">{String(i + 1).padStart(2, "0")}</span>
              {h}
            </li>
          ))}
        </ul>
      </Card>
    );
  }

  const q = DIAGNOSIS[qIdx]!;
  return (
    <Card
      eyebrow={`DIAGNOSIS · ${qIdx + 1}/${DIAGNOSIS.length}`}
      title={q.question}
      action={
        <div className="mt-1 h-1 w-20 shrink-0 rounded-full bg-line" aria-hidden="true">
          <div
            className="gauge-fill h-1 rounded-full bg-step"
            style={{ width: `${((qIdx + 1) / DIAGNOSIS.length) * 100}%` }}
          />
        </div>
      }
    >
      <div className="grid gap-2">
        {q.options.map((o) => (
          <button
            key={o.label}
            disabled={saving}
            onClick={() => answer(o.floor, o.stop)}
            className="glass rounded-xl px-4 py-3 text-left text-sm font-medium text-ink-dim transition-colors hover:border-step/60 hover:text-ink disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-step"
          >
            {o.label}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="mt-2 min-h-5 text-sm text-step-bright">
        {saving ? "저장 중…" : error}
      </p>
    </Card>
  );
}

/* -------------------------------- 목표 트래킹 ------------------------------- */

function GoalsSection({
  goals, limit, pro, stage, reload,
}: {
  goals: Goal[]; limit: number | null; pro: boolean; stage: number; reload: () => void;
}) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [retroFor, setRetroFor] = useState<number | null>(null);
  const [retroText, setRetroText] = useState("");

  const atLimit = limit !== null && goals.length >= limit;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await authFetch("/app/goals", {
        method: "POST",
        body: JSON.stringify({ title, stage: stage || undefined }),
      });
      setTitle("");
      reload();
    } catch (err) {
      const up = (err as { upgrade?: boolean }).upgrade;
      setError(up ? `무료 플랜은 ${FREE_GOAL_LIMIT}개까지 — 구독하면 무제한입니다.` : (err as Error).message);
    }
  };

  const cycle = async (g: Goal) => {
    await authFetch(`/app/goals/${g.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: GOAL_STATUS[g.status].next }),
    });
    reload();
  };

  const remove = async (g: Goal) => {
    await authFetch(`/app/goals/${g.id}`, { method: "DELETE" });
    reload();
  };

  const saveRetro = async (id: number) => {
    setError("");
    try {
      await authFetch(`/app/goals/${id}`, { method: "PATCH", body: JSON.stringify({ retro: retroText }) });
      setRetroFor(null);
      setRetroText("");
      reload();
    } catch (err) {
      setError((err as { upgrade?: boolean }).upgrade ? "회고 아카이브는 PRO 기능입니다." : (err as Error).message);
    }
  };

  return (
    <Card
      eyebrow={pro ? "GOALS · 무제한" : `GOALS · 무료 ${FREE_GOAL_LIMIT}개`}
      title="실행 목표"
      action={
        <p className="shrink-0 font-mono text-xs text-muted">
          {goals.length}{limit !== null ? `/${limit}` : ""}
        </p>
      }
    >
      <form onSubmit={add} className="flex gap-2">
        <label htmlFor="goal-title" className="sr-only">새 목표</label>
        <input
          id="goal-title"
          required
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="이번 주에 실행할 과제"
          className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-card px-4 text-sm text-ink placeholder:text-muted focus:border-step focus:outline-none focus-visible:outline-2 focus-visible:outline-step"
        />
        <button
          type="submit"
          disabled={atLimit && !pro}
          className="btn-ember h-11 shrink-0 rounded-xl px-5 text-sm font-bold disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-step-bright"
        >
          추가
        </button>
      </form>
      {atLimit && !pro && (
        <p className="mt-2 text-[13px] text-ink-dim">
          상한 도달 —{" "}
          <a href={CHECKOUT || "/dashboard"} className="font-semibold text-step-bright underline underline-offset-4">
            구독하면 무제한
          </a>
        </p>
      )}
      <p aria-live="polite" className="mt-1.5 min-h-5 text-[13px] text-step-bright">{error}</p>

      <ul className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1" style={{ maxHeight: "300px" }}>
        {goals.length === 0 && (
          <li className="rounded-xl border border-dashed border-line/80 bg-bg-2/40 px-4 py-5 text-center text-sm text-muted">
            진단 결과의 추천 액션을 첫 목표로 등록해 보세요.
          </li>
        )}
        {goals.map((g) => (
          <li key={g.id} className="rounded-xl border border-line bg-card px-4 py-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => void cycle(g)}
                title="상태 바꾸기"
                className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-step ${
                  g.status === "done"
                    ? "bg-ok/15 text-ok"
                    : g.status === "doing"
                      ? "bg-step/15 text-step-bright"
                      : "bg-line text-ink-dim"
                }`}
              >
                {GOAL_STATUS[g.status].label}
              </button>
              <p className={`min-w-0 flex-1 text-sm font-semibold ${g.status === "done" ? "text-muted line-through" : "text-ink"}`}>
                {g.title}
              </p>
              {pro && g.status === "done" && (
                <button
                  onClick={() => { setRetroFor(retroFor === g.id ? null : g.id); setRetroText(g.retro ?? ""); }}
                  className="text-xs font-semibold text-step-bright underline underline-offset-4"
                >
                  회고
                </button>
              )}
              <button
                onClick={() => void remove(g)}
                aria-label={`${g.title} 삭제`}
                className="text-xs text-muted transition-colors hover:text-step-bright"
              >
                삭제
              </button>
            </div>
            {retroFor === g.id && (
              <div className="mt-2.5">
                <label htmlFor={`retro-${g.id}`} className="sr-only">회고</label>
                <textarea
                  id={`retro-${g.id}`}
                  rows={2}
                  value={retroText}
                  onChange={(e) => setRetroText(e.target.value)}
                  placeholder="무엇이 잘 됐고, 다음에 다르게 할 것은?"
                  className="w-full rounded-xl border border-line bg-bg-2/60 px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-step focus:outline-none"
                />
                <button onClick={() => void saveRetro(g.id)} className="btn-ghost mt-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold">
                  저장
                </button>
              </div>
            )}
            {pro && g.retro && retroFor !== g.id && g.status === "done" && (
              <p className="mt-2 border-l-2 border-step/40 pl-3 text-[13px] leading-relaxed text-ink-dim">{g.retro}</p>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* -------------------------------- 커뮤니티 --------------------------------- */

function CommunitySection({
  posts, canWrite, reload,
}: { posts: Post[]; canWrite: boolean; reload: () => void }) {
  const [writing, setWriting] = useState(false);
  const [type, setType] = useState<Post["type"]>("story");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await authFetch("/app/posts", { method: "POST", body: JSON.stringify({ type, title, body }) });
      setTitle(""); setBody(""); setWriting(false);
      reload();
    } catch (err) {
      setError((err as { upgrade?: boolean }).upgrade ? "글 작성은 PRO 기능입니다." : (err as Error).message);
    }
  };

  return (
    <Card
      eyebrow="COMMUNITY · 열람 무료"
      title="빌더 커뮤니티"
      action={
        canWrite ? (
          <button
            onClick={() => setWriting(!writing)}
            className="btn-ghost shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-step"
          >
            {writing ? "닫기" : "글 쓰기"}
          </button>
        ) : (
          <span className="shrink-0 font-mono text-[10px] text-lock">작성 PRO 🔒</span>
        )
      }
    >
      {writing && (
        <form onSubmit={submit} className="mb-3 space-y-2.5 rounded-xl border border-line bg-card p-4">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="글 유형">
            {(Object.keys(POST_TYPE) as Post["type"][]).map((t) => (
              <button
                key={t} type="button" role="radio" aria-checked={type === t}
                onClick={() => setType(t)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-step ${
                  type === t ? "bg-step text-[#14100b]" : "bg-line text-ink-dim hover:text-ink"
                }`}
              >
                {POST_TYPE[t]}
              </button>
            ))}
          </div>
          <label htmlFor="post-title" className="sr-only">제목</label>
          <input
            id="post-title" required maxLength={120} value={title}
            onChange={(e) => setTitle(e.target.value)} placeholder="제목"
            className="h-10 w-full rounded-xl border border-line bg-bg-2/60 px-3.5 text-sm text-ink placeholder:text-muted focus:border-step focus:outline-none"
          />
          <label htmlFor="post-body" className="sr-only">내용</label>
          <textarea
            id="post-body" required rows={3} maxLength={4000} value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="경험·실패·성과를 기록하거나 피드백을 요청하세요"
            className="w-full rounded-xl border border-line bg-bg-2/60 px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-step focus:outline-none"
          />
          <button type="submit" className="btn-ember h-10 rounded-xl px-5 text-sm font-bold">게시</button>
        </form>
      )}
      <p aria-live="polite" className="min-h-5 text-[13px] text-step-bright">{error}</p>

      <ul className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1" style={{ maxHeight: "360px" }}>
        {posts.map((p) => (
          <li key={p.id} className="rounded-xl border border-line bg-card px-4 py-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                p.type === "story" ? "bg-step/15 text-step-bright" : p.type === "feedback" ? "bg-ok/15 text-ok" : "bg-line text-ink-dim"
              }`}>
                {POST_TYPE[p.type]}
              </span>
              <span className="text-[13px] font-semibold text-ink">{p.author}</span>
              <span className="font-mono text-[10px] text-muted">{p.createdAt.slice(0, 10)}</span>
            </div>
            <h4 className="mt-1.5 text-sm font-bold text-ink">{p.title}</h4>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-dim">{p.body}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ------------------------------ 전문가 상담 (PRO) ---------------------------- */

function SessionsSection({ pro }: { pro: boolean }) {
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [topic, setTopic] = useState<SessionRow["topic"]>("marketing");
  const [preferredAt, setPreferredAt] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const d = await authFetch<{ sessions: SessionRow[] }>("/app/sessions");
    setRows(d.sessions);
  }, []);

  useEffect(() => {
    if (pro) void load().catch(() => {});
  }, [pro, load]);

  if (!pro)
    return (
      <ProLock
        eyebrow="EXPERT SESSIONS"
        title="전문가 상담 예약"
        desc="마케팅·가격·세무·법률 전문가와 1:1 상담을 예약합니다."
      />
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await authFetch("/app/sessions", { method: "POST", body: JSON.stringify({ topic, preferredAt, note }) });
      setPreferredAt(""); setNote("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Card eyebrow="EXPERT SESSIONS · PRO" title="전문가 상담 예약">
      <form onSubmit={submit} className="grid grid-cols-2 gap-2.5">
        <div>
          <label htmlFor="ses-topic" className="mb-1 block text-[11px] font-semibold text-muted">분야</label>
          <select
            id="ses-topic" value={topic}
            onChange={(e) => setTopic(e.target.value as SessionRow["topic"])}
            className="h-10 w-full rounded-xl border border-line bg-card px-2.5 text-sm text-ink focus:border-step focus:outline-none"
          >
            {(Object.keys(TOPIC_LABEL) as SessionRow["topic"][]).map((t) => (
              <option key={t} value={t}>{TOPIC_LABEL[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ses-time" className="mb-1 block text-[11px] font-semibold text-muted">희망 시간</label>
          <input
            id="ses-time" type="datetime-local" required value={preferredAt}
            onChange={(e) => setPreferredAt(e.target.value)}
            className="h-10 w-full rounded-xl border border-line bg-card px-2.5 text-sm text-ink focus:border-step focus:outline-none"
          />
        </div>
        <div className="col-span-2">
          <label htmlFor="ses-note" className="sr-only">상담 내용(선택)</label>
          <input
            id="ses-note" maxLength={1000} value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="상담 내용(선택)"
            className="h-10 w-full rounded-xl border border-line bg-card px-3.5 text-sm text-ink placeholder:text-muted focus:border-step focus:outline-none"
          />
        </div>
        <button type="submit" className="btn-ember col-span-2 h-10 rounded-xl text-sm font-bold">
          상담 요청
        </button>
      </form>
      <p aria-live="polite" className="mt-1.5 min-h-5 text-[13px] text-step-bright">{error}</p>
      <p className="text-[12px] leading-relaxed text-muted">요청 후 korea@toris.kr에서 일정 확정 메일을 드립니다.</p>

      {rows.length > 0 && (
        <ul className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1" style={{ maxHeight: "160px" }}>
          {rows.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-card px-3.5 py-2.5 text-[13px]">
              <span className="rounded-full bg-step/15 px-2 py-0.5 font-mono text-[10px] font-bold text-step-bright">
                {TOPIC_LABEL[s.topic]}
              </span>
              <span className="font-mono text-[11px] text-ink-dim">{s.preferredAt.replace("T", " ")}</span>
              <span className={`ml-auto font-semibold ${s.status === "confirmed" ? "text-ok" : "text-muted"}`}>
                {SESSION_STATUS[s.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ------------------------------ 맞춤 로드맵 (PRO) ---------------------------- */

function RoadmapSection({
  me, pro, onAddGoal,
}: { me: Me; pro: boolean; onAddGoal: (title: string, stage: number) => Promise<void> }) {
  const [notice, setNotice] = useState("");

  if (!pro)
    return (
      <ProLock
        eyebrow="CUSTOM ROADMAP"
        title="맞춤 로드맵"
        desc="진단 결과 기반으로 현재 단계부터 사업 성장까지 실행 로드맵을 생성합니다."
      />
    );

  if (me.stage === 0)
    return (
      <Card eyebrow="CUSTOM ROADMAP · PRO" title="맞춤 로드맵">
        <p className="text-sm text-ink-dim">단계 진단을 마치면 로드맵이 생성됩니다.</p>
      </Card>
    );

  const remaining = STAGES.slice(me.stage - 1);

  const add = async (title: string, stage: number) => {
    try {
      await onAddGoal(title, stage);
      setNotice(`"${title}" 목표에 추가됨`);
    } catch (err) {
      setNotice((err as { upgrade?: boolean }).upgrade ? "목표 상한에 도달했어요." : (err as Error).message);
    }
  };

  return (
    <Card eyebrow="CUSTOM ROADMAP · PRO" title="맞춤 로드맵" action={
      <span className="shrink-0 font-mono text-xs text-muted">{remaining.length}단계 남음</span>
    }>
      <p aria-live="polite" className="min-h-5 text-[13px] text-ok">{notice}</p>
      <ol className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: "360px" }}>
        {remaining.map((s, i) => (
          <li key={s.key} className={`rounded-xl border px-4 py-4 ${i === 0 ? "border-step/50 bg-card" : "border-line bg-card"}`}>
            <div className="flex items-center gap-2.5">
              <span className={`font-mono text-[10px] font-bold ${i === 0 ? "text-step-bright" : "text-muted"}`}>
                {String(s.n).padStart(2, "0")}{i === 0 ? " · 지금" : ""}
              </span>
              <h4 className="text-sm font-bold text-ink">{s.name}</h4>
            </div>
            <ul className="mt-2 space-y-1.5">
              {s.help.map((h) => (
                <li key={h} className="flex flex-wrap items-center gap-2 text-[13px] text-ink-dim">
                  <span aria-hidden="true" className="size-1 shrink-0 rounded-full bg-step" />
                  <span className="min-w-0 flex-1">{h}</span>
                  <button
                    onClick={() => void add(h, s.n)}
                    className="text-[11px] font-semibold text-step-bright underline underline-offset-4 hover:text-step"
                  >
                    목표로
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/* ------------------------------ 지표 대시보드 (PRO) --------------------------- */

function MetricsSection({ pro, stageN }: { pro: boolean; stageN: number }) {
  const [rows, setRows] = useState<MetricRow[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [revenue, setRevenue] = useState("");
  const [users, setUsers] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const d = await authFetch<{ metrics: MetricRow[] }>("/app/metrics");
    setRows(d.metrics);
  }, []);

  useEffect(() => {
    if (pro) void load().catch(() => {});
  }, [pro, load]);

  if (!pro)
    return (
      <ProLock
        eyebrow="METRICS"
        title="지표 대시보드"
        desc="매출·사용자 지표를 기록하고 단계 목표와 연결해 추적합니다."
      />
    );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await authFetch(`/app/metrics/${date}`, {
        method: "PUT",
        body: JSON.stringify({ revenue: Number(revenue) || 0, users: Number(users) || 0 }),
      });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const recent = rows.slice(-14);
  const maxR = Math.max(1, ...recent.map((r) => r.revenue));
  const maxU = Math.max(1, ...recent.map((r) => r.users));
  const cx = (i: number, n: number) => (n < 2 ? 280 : (i / (n - 1)) * 544 + 8);
  const cy = (v: number, max: number) => 132 - (v / max) * 116;
  const line = (key: "revenue" | "users", max: number) =>
    recent.map((r, i) => `${cx(i, recent.length)},${cy(r[key], max)}`).join(" ");
  const stage = STAGES[stageN - 1];

  return (
    <Card
      eyebrow="METRICS · PRO"
      title="지표 대시보드"
      action={stage && (
        <span className="hidden shrink-0 font-mono text-[10px] text-muted sm:block">
          {String(stage.n).padStart(2, "0")} {stage.name} 단계
        </span>
      )}
    >
      <form onSubmit={save} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div>
          <label htmlFor="m-date" className="mb-1 block text-[11px] font-semibold text-muted">날짜</label>
          <input id="m-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)}
            className="h-10 w-full rounded-xl border border-line bg-card px-2.5 text-[13px] text-ink focus:border-step focus:outline-none" />
        </div>
        <div>
          <label htmlFor="m-rev" className="mb-1 block text-[11px] font-semibold text-muted">매출(원)</label>
          <input id="m-rev" type="number" min={0} value={revenue} onChange={(e) => setRevenue(e.target.value)} placeholder="0"
            className="h-10 w-full rounded-xl border border-line bg-card px-2.5 text-[13px] text-ink placeholder:text-muted focus:border-step focus:outline-none" />
        </div>
        <div>
          <label htmlFor="m-usr" className="mb-1 block text-[11px] font-semibold text-muted">사용자(명)</label>
          <input id="m-usr" type="number" min={0} value={users} onChange={(e) => setUsers(e.target.value)} placeholder="0"
            className="h-10 w-full rounded-xl border border-line bg-card px-2.5 text-[13px] text-ink placeholder:text-muted focus:border-step focus:outline-none" />
        </div>
        <button type="submit" className="btn-ember h-10 self-end rounded-xl text-sm font-bold">기록</button>
      </form>
      <p aria-live="polite" className="mt-1.5 min-h-5 text-[13px] text-step-bright">{error}</p>

      {recent.length > 0 ? (
        <div className="min-h-0 flex-1">
          <svg viewBox="0 0 560 148" role="img" aria-label="최근 지표 추이" className="w-full">
            {[16, 45, 74, 103, 132].map((y) => (
              <line
                key={y}
                x1="8"
                y1={y}
                x2="552"
                y2={y}
                stroke="var(--color-line)"
                strokeWidth={y === 132 ? 1.25 : 0.75}
                strokeDasharray={y === 132 ? undefined : "2 4"}
              />
            ))}
            <polygon
              points={`8,132 ${line("revenue", maxR)} ${cx(recent.length - 1, recent.length)},132`}
              fill="color-mix(in srgb, var(--color-step) 12%, transparent)"
            />
            <polyline
              points={line("revenue", maxR)}
              fill="none" stroke="var(--color-step)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
            />
            <polyline
              points={line("users", maxU)}
              fill="none" stroke="var(--color-violet)" strokeWidth="2" strokeDasharray="5 4" strokeLinejoin="round" strokeLinecap="round"
            />
            {recent.map((r, i) => (
              <g key={i}>
                <circle cx={cx(i, recent.length)} cy={cy(r.revenue, maxR)} r="3.2" fill="var(--color-step)" stroke="var(--color-card)" strokeWidth="1.5" />
                <circle cx={cx(i, recent.length)} cy={cy(r.users, maxU)} r="2.6" fill="var(--color-violet)" stroke="var(--color-card)" strokeWidth="1.5" />
              </g>
            ))}
          </svg>
          <div className="mt-1 flex items-center gap-4 font-mono text-[10px] text-muted">
            <span><span className="mr-1.5 inline-block h-0.5 w-4 bg-step align-middle" />매출</span>
            <span><span className="mr-1.5 inline-block h-0.5 w-4 bg-violet align-middle" />사용자</span>
            {recent.length > 0 && (
              <span className="ml-auto">
                최근 ₩{recent[recent.length - 1]!.revenue.toLocaleString()} · {recent[recent.length - 1]!.users.toLocaleString()}명
              </span>
            )}
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-line/80 bg-bg-2/40 px-4 py-5 text-center text-sm text-muted">
          첫 지표를 기록하면 추이 차트가 나타납니다.
        </p>
      )}
    </Card>
  );
}

/* ---------------------------------- 허브 ---------------------------------- */

type Tab =
  | "command"
  | "money"
  | "signals"
  | "priority"
  | "deadlines"
  | "briefing"
  | "overview"
  | "goals"
  | "roadmap"
  | "metrics"
  | "sessions"
  | "community";

const NAV: { key: Tab; label: string; icon: string }[] = [
  { key: "command", label: "대표자 홈", icon: "◆" },
  { key: "money", label: "돈 · Runway", icon: "₩" },
  { key: "signals", label: "성장 신호", icon: "☌" },
  { key: "priority", label: "우선순위", icon: "⚑" },
  { key: "deadlines", label: "마감·리스크", icon: "⏿" },
  { key: "briefing", label: "주간 브리핑", icon: "▦" },
  { key: "overview", label: "개요", icon: "◎" },
  { key: "goals", label: "목표 트래킹", icon: "◇" },
  { key: "roadmap", label: "맞춤 로드맵", icon: "▤" },
  { key: "metrics", label: "지표", icon: "∿" },
  { key: "sessions", label: "전문가 상담", icon: "☏" },
  { key: "community", label: "커뮤니티", icon: "✎" },
];

const TAB_TITLE: Record<Tab, { title: string; desc: string }> = {
  command: { title: "대표자 홈", desc: "오늘 처리할 핵심 3가지와 생존 가능 기간" },
  money: { title: "돈 · Runway Lite", desc: "생존 가능 기간을 판단하는 최소 재무 화면" },
  signals: { title: "고객 · 성장 신호 허브", desc: "문의·피드백을 한곳에 모아 다음 행동으로" },
  priority: { title: "우선순위 엔진 · Not Now", desc: "고객 신호가 쌓일 때만 이번 주로 승격" },
  deadlines: { title: "마감 · 리스크 센터", desc: "세무·계약·갱신 마감과 놓쳤을 때의 위험" },
  briefing: { title: "주간 CEO 브리핑", desc: "이번 주 방지한 손실과 변화 요약 한 장" },
  overview: { title: "개요", desc: "단계 진단과 이번 주 현황을 한눈에" },
  goals: { title: "목표 트래킹", desc: "단계별 목표를 만들고 완료까지 관리" },
  roadmap: { title: "맞춤 로드맵", desc: "현재 단계에 맞는 다음 행동 제안" },
  metrics: { title: "지표", desc: "매출·사용자 추이 기록과 차트" },
  sessions: { title: "전문가 상담", desc: "마케팅·가격·세무·법률 세션 예약" },
  community: { title: "커뮤니티", desc: "빌더들의 기록·피드백·매칭" },
};

export default function AppHub() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [goalsData, setGoalsData] = useState<{ goals: Goal[]; limit: number | null }>({ goals: [], limit: FREE_GOAL_LIMIT });
  const [postsData, setPostsData] = useState<{ posts: Post[]; canWrite: boolean }>({ posts: [], canWrite: false });
  const [error, setError] = useState("");

  const loadAll = useCallback(async () => {
    try {
      const [m, g, p] = await Promise.all([
        authFetch<Me>("/app/me"),
        authFetch<{ goals: Goal[]; limit: number | null }>("/app/goals"),
        authFetch<{ posts: Post[]; canWrite: boolean }>("/app/posts"),
      ]);
      setMe(m); setGoalsData(g); setPostsData(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    }
  }, []);

  const reloadGoals = useCallback(async () => {
    setGoalsData(await authFetch("/app/goals"));
  }, []);

  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
      if (u) void loadAll();
    });
    return off;
  }, [loadAll]);

  /* 구독 게이트: 구독(PRO)이 아니면 구독 관리 대시보드로 이동 */
  useEffect(() => {
    if (me && !me.pro) router.replace("/dashboard");
  }, [me, router]);

  if (!ready)
    return (
      <div className="grid min-h-dvh place-items-center px-5">
        <div className="glass w-full max-w-md rounded-2xl p-8 text-center text-sm text-muted">불러오는 중…</div>
      </div>
    );

  if (!user)
    return (
      <div className="grid min-h-dvh place-items-center px-5">
        <div className="glass w-full max-w-md rounded-2xl p-8 text-center">
          <p className="font-mono text-[10px] font-bold tracking-[0.28em] text-step-bright">MY BUILDERSTEP</p>
          <h2 className="mt-2 text-xl font-extrabold text-ink">구글로 로그인하고 시작하세요</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-dim">
            내 빌더스텝은 구독 회원 전용 공간입니다. 로그인 후 구독 상태를 확인합니다.
          </p>
          <button
            onClick={() => void signInWithPopup(auth, googleProvider).catch(() => setError("구글 로그인에 실패했습니다."))}
            className="btn-ember mt-5 inline-flex h-12 items-center justify-center gap-2.5 rounded-xl px-6 text-[15px] font-bold"
          >
            구글로 로그인
          </button>
          <p aria-live="polite" className="mt-2 min-h-5 text-sm text-step-bright">{error}</p>
          <Link href="/" className="mt-1 inline-block text-sm text-muted underline underline-offset-4 hover:text-ink">
            ← 홈으로
          </Link>
        </div>
      </div>
    );

  if (me && !me.pro)
    return (
      <div className="grid min-h-dvh place-items-center px-5">
        <div className="glass w-full max-w-md rounded-2xl p-8 text-center">
          <h2 className="text-xl font-extrabold text-ink">구독 회원 전용 공간입니다</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-dim">
            구독 관리 페이지로 이동합니다…
          </p>
          <Link href="/dashboard" className="btn-ember mt-5 inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-bold">
            구독 확인하기
          </Link>
        </div>
      </div>
    );

  const signout = () => void signOut(auth).then(() => setMe(null));

  return (
    <div className="flex min-h-dvh w-full">
      {/* ── 사이드바 (데스크톱) ── */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line/70 bg-bg-2/40 px-4 py-6 lg:flex">
        <Link href="/" className="flex items-center gap-2.5 px-2">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full bg-step shadow-[0_0_12px_2px_color-mix(in_srgb,var(--color-step)_60%,transparent)]"
          />
          <span className="text-lg font-extrabold tracking-tight text-ink">빌더스텝</span>
        </Link>
        <p className="mt-1 px-2 font-mono text-[9px] font-bold tracking-[0.28em] text-muted">WORKSPACE</p>

        <nav className="mt-6 flex flex-col gap-1" aria-label="워크스페이스 메뉴">
          {NAV.map((n) => (
            <button
              key={n.key}
              onClick={() => setTab(n.key)}
              aria-current={tab === n.key ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                tab === n.key
                  ? "bg-step/12 text-step-bright shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-step)_35%,transparent)]"
                  : "text-ink-dim hover:bg-line/40 hover:text-ink"
              }`}
            >
              <span aria-hidden="true" className="w-4 text-center font-mono text-xs">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <Link
            href="/dashboard"
            className="block rounded-xl border border-line/70 bg-bg/50 px-3 py-2.5 text-sm text-ink-dim transition-colors hover:text-ink"
          >
            구독 관리 →
          </Link>
          <div className="rounded-xl border border-line/70 bg-bg/50 p-3">
            <p className="truncate text-sm font-semibold text-ink">{user.displayName ?? user.email}</p>
            <p className="mt-0.5 flex items-center gap-2">
              <span className="truncate font-mono text-[10px] text-muted">{user.email}</span>
              <span className="shrink-0 rounded-full bg-ok/15 px-2 py-0.5 font-mono text-[9px] font-bold text-ok">PRO</span>
            </p>
            <button onClick={signout} className="mt-2 text-xs text-muted underline underline-offset-4 hover:text-ink">
              로그아웃
            </button>
          </div>
        </div>
      </aside>

      {/* ── 본문 ── */}
      <div className="min-w-0 flex-1">
        {/* 모바일 상단바 */}
        <div className="sticky top-0 z-30 border-b border-line/70 bg-bg/80 backdrop-blur-md lg:hidden">
          <div className="flex h-14 items-center justify-between px-5">
            <Link href="/" className="flex items-center gap-2">
              <span aria-hidden="true" className="size-2 rounded-full bg-step" />
              <span className="font-extrabold text-ink">빌더스텝</span>
            </Link>
            <button onClick={signout} className="text-sm text-muted underline underline-offset-4 hover:text-ink">
              로그아웃
            </button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2" aria-label="워크스페이스 메뉴">
            {NAV.map((n) => (
              <button
                key={n.key}
                onClick={() => setTab(n.key)}
                aria-current={tab === n.key ? "page" : undefined}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                  tab === n.key ? "bg-step/15 text-step-bright" : "text-ink-dim hover:text-ink"
                }`}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="w-full max-w-[1400px] px-5 pb-24 pt-6 sm:px-8 lg:pt-10">
          {/* 페이지 헤더 */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-bold tracking-[0.28em] text-step-bright">
                MY BUILDERSTEP · {tab.toUpperCase()}
              </p>
              <h1 className="mt-1.5 text-2xl font-extrabold text-ink sm:text-3xl">{TAB_TITLE[tab].title}</h1>
              <p className="mt-1 text-sm text-ink-dim">{TAB_TITLE[tab].desc}</p>
            </div>
            {me && (
              <p className="hidden text-sm text-ink-dim lg:block">
                현재 단계 <span className="font-mono font-bold text-step-bright">{me.stage}</span> / 8
              </p>
            )}
          </div>
          <p aria-live="polite" className="mt-1.5 min-h-5 text-sm text-step-bright">{error}</p>

          {me && (
            <div className="mt-4 space-y-4">
              {tab === "command" && <CommandCenter pro={me.pro} />}
              {tab === "money" && <RunwayLite />}
              {tab === "signals" && <SignalHub />}
              {tab === "priority" && <NotNowEngine />}
              {tab === "deadlines" && <RiskCenter />}
              {tab === "briefing" && <WeeklyBriefing />}

              {tab === "overview" && (
                <>
                  <DigestStrip me={me} goals={goalsData.goals} />
                  <div className="grid gap-4 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                      <DiagnosisSection me={me} onSaved={() => void loadAll()} />
                    </div>
                    <div className="lg:col-span-7">
                      <GoalsSection
                        goals={goalsData.goals} limit={goalsData.limit} pro={me.pro}
                        stage={me.stage} reload={() => void reloadGoals()}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                      <RoadmapPreview stageN={me.stage} onJump={() => setTab("roadmap")} />
                    </div>
                    <div className="lg:col-span-5">
                      <CommunityPreview posts={postsData.posts} onJump={() => setTab("community")} />
                    </div>
                  </div>
                </>
              )}

              {tab === "goals" && (
                <div className="mx-auto max-w-3xl">
                  <GoalsSection
                    goals={goalsData.goals} limit={goalsData.limit} pro={me.pro}
                    stage={me.stage} reload={() => void reloadGoals()}
                  />
                </div>
              )}

              {tab === "roadmap" && (
                <div className="mx-auto max-w-3xl">
                  <RoadmapSection
                    me={me} pro={me.pro}
                    onAddGoal={async (title, stage) => {
                      await authFetch("/app/goals", { method: "POST", body: JSON.stringify({ title, stage }) });
                      await reloadGoals();
                    }}
                  />
                </div>
              )}

              {tab === "metrics" && (
                <div className="mx-auto max-w-3xl">
                  <MetricsSection pro={me.pro} stageN={me.stage} />
                </div>
              )}

              {tab === "sessions" && (
                <div className="mx-auto max-w-3xl">
                  <SessionsSection pro={me.pro} />
                </div>
              )}

              {tab === "community" && (
                <div className="mx-auto max-w-3xl">
                  <CommunitySection
                    posts={postsData.posts} canWrite={postsData.canWrite}
                    reload={() => { void authFetch<{ posts: Post[]; canWrite: boolean }>("/app/posts").then(setPostsData); }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
