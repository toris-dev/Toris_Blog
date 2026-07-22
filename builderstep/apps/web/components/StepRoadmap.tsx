"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { STAGES } from "@/lib/stages";

/**
 * 8단계 인터랙티브 로드맵 — 사이트의 비주얼 시그니처.
 * 선택한 단계를 기준으로 지나온 단계(에메랄드) · 현재(잉걸) · 다가올 단계(잿빛)를
 * 색으로 구분한다. 데스크톱: 연결된 수평 탭리스트, 모바일: 수직 스테퍼 아코디언.
 */
export default function StepRoadmap() {
  const [idx, setIdx] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const stage = STAGES[idx] ?? STAGES[0]!;

  const move = (next: number) => {
    const i = (next + STAGES.length) % STAGES.length;
    setIdx(i);
    tabRefs.current[i]?.focus();
  };
  const onTablistKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") { e.preventDefault(); move(idx + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); move(idx - 1); }
    else if (e.key === "Home") { e.preventDefault(); move(0); }
    else if (e.key === "End") { e.preventDefault(); move(STAGES.length - 1); }
  };

  const stateOf = (i: number) => (i < idx ? "done" : i === idx ? "now" : "next");

  const panelBody = (
    <>
      <p className="font-mono text-[11px] tracking-[0.24em] text-step-deep">
        STEP {String(stage.n).padStart(2, "0")} — {stage.en}
      </p>
      <h3 className="mt-3 text-2xl font-extrabold text-ink">{stage.question}</h3>
      <p className="mt-3 leading-relaxed text-ink-dim">{stage.description}</p>
      <ul className="mt-5 flex flex-wrap gap-2" aria-label="이 단계에서 빌더스텝이 돕는 것">
        {stage.help.map((h) => (
          <li key={h} className="rounded-full border border-line bg-bg-2/70 px-3.5 py-1.5 text-[13px] text-ink-dim">
            {h}
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <div>
      {/* ---------- 데스크톱: 연결된 수평 여정 ---------- */}
      <div className="hidden sm:block">
        {/* 게이지 — 지나온 길(에메랄드)이 현재(잉걸)까지 이어진다 */}
        <div className="relative h-1 rounded-full bg-line" aria-hidden="true">
          <div
            className="gauge-fill absolute left-0 top-0 h-1 rounded-full bg-gradient-to-r from-grow via-grow to-step"
            style={{ width: `${((idx + 1) / STAGES.length) * 100}%` }}
          />
        </div>

        <div
          role="tablist"
          aria-label="사업화 8단계 로드맵"
          className="mt-6 grid grid-cols-8 gap-2"
          onKeyDown={onTablistKeyDown}
        >
          {STAGES.map((s, i) => (
            <button
              key={s.key}
              ref={(el) => { tabRefs.current[i] = el; }}
              role="tab"
              id={`stage-tab-${i}`}
              aria-selected={i === idx}
              aria-controls="stage-panel"
              aria-label={`${s.n}단계 ${s.name}`}
              tabIndex={i === idx ? 0 : -1}
              data-state={stateOf(i)}
              onClick={() => setIdx(i)}
              className="step-node glass flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-ink-dim hover:border-step/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-step"
            >
              <span className="font-mono text-[11px] font-bold" aria-hidden="true">
                {String(s.n).padStart(2, "0")}
              </span>
              <span className="text-xs font-semibold break-keep">{s.name}</span>
            </button>
          ))}
        </div>

        <div
          id="stage-panel"
          role="tabpanel"
          aria-labelledby={`stage-tab-${idx}`}
          className="glass mt-6 rounded-2xl p-7 sm:p-9"
        >
          {panelBody}
        </div>
      </div>

      {/* ---------- 모바일: 수직 스테퍼 아코디언 ---------- */}
      <ol className="space-y-2 sm:hidden" aria-label="사업화 8단계 로드맵">
        {STAGES.map((s, i) => {
          const open = i === idx;
          const state = stateOf(i);
          return (
            <li key={s.key} className="relative">
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`stage-acc-${i}`}
                onClick={() => setIdx(i)}
                data-state={state}
                className="step-row glass flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-step"
              >
                <span
                  aria-hidden="true"
                  data-state={state}
                  className="step-dot flex size-7 shrink-0 items-center justify-center rounded-full border border-line font-mono text-[11px] font-bold text-ink-dim"
                >
                  {state === "done" ? "✓" : s.n}
                </span>
                <span className="grow">
                  <span className="block text-[15px] font-bold text-ink">{s.name}</span>
                  <span className="block text-xs text-muted">{s.en}</span>
                </span>
                <svg
                  viewBox="0 0 24 24"
                  className={`size-4 text-muted transition-transform ${open ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <div
                id={`stage-acc-${i}`}
                hidden={!open}
                className="glass mt-2 rounded-xl p-5"
              >
                {open && panelBody}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
