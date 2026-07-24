import { useCallback, useEffect, useState } from 'react';
import { assign, drawPool, interpret } from '../lib/engine';
import { DECK_VERSION } from '../lib/deck';
import { classify, isSensitive, maskPreview, safetyNotice } from '../lib/safety';
import * as store from '../lib/storage';
import {
  CATEGORIES,
  CATEGORY_ORDER,
  SPREADS,
  cardImage,
  categoryFromKey,
  domainColor,
  domainLabel,
  flowLabel,
  spreadFromKey,
  type CategoryKey,
  type DrawnCard,
  type FateCard,
  type Reading,
  type Spread,
} from '../lib/types';

// ------------------------------------------------------------------ 뷰 상태
type View =
  | { name: 'intro' }
  | { name: 'home' }
  | { name: 'setup'; spread: Spread }
  | { name: 'ritual' }
  | { name: 'select' }
  | { name: 'reveal' }
  | { name: 'result'; id: string }
  | { name: 'journal' }
  | { name: 'settings' };

interface Session {
  spread: Spread;
  category: CategoryKey;
  question: string;
  saveQuestion: boolean;
  pool: FateCard[];
  selected: number[];
  drawn: DrawnCard[];
}

const newId = (): string =>
  `rd_${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

const QUESTION_GUIDE: Record<CategoryKey, [string, string]> = {
  general: ['내 미래는 어떻게 되나요?', '지금 내가 가장 정리하고 싶은 마음은 무엇인가요?'],
  relationship: ['우리는 결국 어떻게 되나요?', '이 관계에서 내가 바라는 것은 무엇인가요?'],
  work: ['이직에 성공하나요?', '지금 일에서 내가 확인하고 싶은 것은 무엇인가요?'],
  money: ['돈을 많이 벌 수 있나요?', '이 결정에서 내가 감당할 수 있는 범위는 어디까지인가요?'],
  choice: ['어느 쪽이 정답인가요?', '두 선택지에서 내가 진짜 중요하게 여기는 기준은 무엇인가요?'],
};

const HINTS: Record<CategoryKey, string> = {
  general: '오늘의 나에게 필요한 흐름이 궁금할 때',
  relationship: '사람 사이의 거리를 정리하고 싶을 때',
  work: '진로나 성장의 방향을 확인하고 싶을 때',
  money: '지출·기회를 판단하는 기준을 세우고 싶을 때',
  choice: '두 갈래 사이에서 마음을 정리하고 싶을 때',
};

// ------------------------------------------------------------------ 앱 루트
export default function App() {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>({ name: 'home' });
  const [session, setSession] = useState<Session | null>(null);
  const [rev, setRev] = useState(0); // 저장소 변경 후 강제 새로고침
  const [reduceMotion, setReduceMotion] = useState(false);

  const bump = useCallback(() => setRev((n) => n + 1), []);

  useEffect(() => {
    setReduceMotion(store.getReduceMotion());
    setView(store.hasOnboarded() ? { name: 'home' } : { name: 'intro' });
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
  }, [reduceMotion]);

  // 세션 시작: 후보 카드를 뽑고 리추얼로 이동.
  const beginReading = useCallback((s: Omit<Session, 'pool' | 'selected' | 'drawn'>) => {
    const poolSize = s.spread.key === 'daily' ? 12 : 15;
    setSession({ ...s, pool: drawPool(poolSize), selected: [], drawn: [] });
    setView({ name: 'ritual' });
  }, []);

  if (!ready) return <div className="app" aria-hidden />;

  return (
    <div className="app">
      {view.name === 'intro' && (
        <Intro
          onStart={(spreadKey) => {
            store.setOnboarded();
            beginReading({
              spread: SPREADS[spreadKey],
              category: 'general',
              question: '',
              saveQuestion: store.getSaveQuestionDefault(),
            });
          }}
          onSkip={() => {
            store.setOnboarded();
            setView({ name: 'home' });
          }}
        />
      )}

      {view.name === 'home' && (
        <Home
          key={rev}
          onSpread={(spread) => setView({ name: 'setup', spread })}
          onOpen={(id) => setView({ name: 'result', id })}
          go={setView}
        />
      )}

      {view.name === 'setup' && (
        <Setup
          spread={view.spread}
          onBack={() => setView({ name: 'home' })}
          onStart={(category, question, saveQuestion) =>
            beginReading({ spread: view.spread, category, question, saveQuestion })
          }
        />
      )}

      {view.name === 'ritual' && session && (
        <Ritual reduceMotion={reduceMotion} onDone={() => setView({ name: 'select' })} />
      )}

      {view.name === 'select' && session && (
        <Select
          session={session}
          onBack={() => setView({ name: 'home' })}
          onToggle={(i) =>
            setSession((prev) => {
              if (!prev) return prev;
              // 이미 고른 카드 → 선택 해제
              if (prev.selected.includes(i)) {
                return { ...prev, selected: prev.selected.filter((x) => x !== i) };
              }
              // 아직 여유가 있으면 추가
              if (prev.selected.length < prev.spread.cardCount) {
                return { ...prev, selected: [...prev.selected, i] };
              }
              // 정원이 찼는데 새 카드를 누르면 가장 먼저 고른 카드를 빼고 교체한다.
              // (한 장 스프레드면 방금 누른 카드로 곧바로 바뀐다)
              return { ...prev, selected: [...prev.selected.slice(1), i] };
            })
          }
          onReveal={() => {
            setSession((prev) => {
              if (!prev) return prev;
              const picked = prev.selected.map((i) => prev.pool[i]);
              return { ...prev, drawn: assign(prev.spread, picked, prev.category) };
            });
            setView({ name: 'reveal' });
          }}
        />
      )}

      {view.name === 'reveal' && session && (
        <Reveal
          session={session}
          reduceMotion={reduceMotion}
          onResult={() => {
            const topic = classify(session.question);
            const interpretation = interpret(
              session.spread,
              session.category,
              session.drawn,
              topic,
            );
            const reading: Reading = {
              id: newId(),
              spread: session.spread.key,
              category: session.category,
              questionPreview: maskPreview(session.question),
              savedQuestion:
                session.saveQuestion && session.question.trim() ? session.question.trim() : null,
              interpretation,
              createdAt: new Date().toISOString(),
              contentVersion: DECK_VERSION,
              actionCommitted: false,
              actionCompletedAt: null,
              note: null,
              outcomeRating: null,
            };
            store.saveReading(reading);
            bump();
            setView({ name: 'result', id: reading.id });
          }}
        />
      )}

      {view.name === 'result' && (
        <Result
          key={view.id + ':' + rev}
          id={view.id}
          onHome={() => {
            setSession(null);
            setView({ name: 'home' });
          }}
          onChange={bump}
        />
      )}

      {view.name === 'journal' && (
        <Journal
          key={rev}
          onBack={() => setView({ name: 'home' })}
          onOpen={(id) => setView({ name: 'result', id })}
        />
      )}

      {view.name === 'settings' && (
        <Settings
          onBack={() => setView({ name: 'home' })}
          reduceMotion={reduceMotion}
          onReduceMotion={(v) => {
            store.setReduceMotion(v);
            setReduceMotion(v);
          }}
          onCleared={() => {
            bump();
            setView({ name: 'home' });
          }}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------------ 프리미티브
function TopBar({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <div className="topbar">
      {onBack && (
        <button className="iconbtn" onClick={onBack} aria-label="뒤로">
          ‹
        </button>
      )}
      <h2>{title}</h2>
      <div className="spacer" />
      {right}
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="section-header">
      <div className="title">{title}</div>
      {subtitle && <div className="subtitle">{subtitle}</div>}
    </div>
  );
}

function DomainDot({ domain }: { domain: string }) {
  return <span className="domain-dot" style={{ background: domainColor(domain) }} aria-hidden />;
}

function CardBack() {
  return (
    <div className="card-face card-back">
      <div className="mark">運</div>
    </div>
  );
}

// ------------------------------------------------------------------ 인트로
function Intro({
  onStart,
  onSkip,
}: {
  onStart: (spread: 'daily' | 'fate-three') => void;
  onSkip: () => void;
}) {
  return (
    <div className="shell">
      <div className="content hero center">
        <div className="stack">
          <div className="tertiary small">운명의 카드</div>
          <h1>
            운명은 카드가 아니라
            <br />
            선택에서 시작됩니다.
          </h1>
          <p className="lead">
            미래는 정해진 답이 아니라, 지금의 선택이 만들어 가는 흐름입니다.
            <br />
            답을 맞히기보다, 지금의 마음을 읽어 보세요.
          </p>
        </div>
        <div className="stack">
          <button className="btn btn-primary" onClick={() => onStart('daily')}>
            오늘의 카드 뽑기
          </button>
          <button className="btn btn-ghost" onClick={() => onStart('fate-three')}>
            고민을 질문하기
          </button>
          <button className="btn btn-sm btn-ghost" style={{ border: 'none' }} onClick={onSkip}>
            먼저 둘러보기
          </button>
        </div>
        <p className="tertiary small">
          운명의 카드는 엔터테인먼트와 자기성찰을 위한 서비스이며, 미래의 사건을 보장하거나 의료·법률·재정적
          판단을 대신하지 않습니다.
        </p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ 홈
function Home({
  onSpread,
  onOpen,
  go,
}: {
  onSpread: (s: Spread) => void;
  onOpen: (id: string) => void;
  go: (v: View) => void;
}) {
  const readings = store.getReadings();
  const nickname = store.getNickname();
  const today = store.todaysDaily(readings);
  const recent = readings.slice(0, 3);

  return (
    <div className="shell">
      <TopBar
        title="운명의 카드"
        right={
          <>
            <button className="iconbtn" onClick={() => go({ name: 'journal' })} aria-label="기록">
              ✦
            </button>
            <button
              className="iconbtn"
              onClick={() => go({ name: 'settings' })}
              aria-label="설정"
              style={{ marginLeft: 8 }}
            >
              ⚙
            </button>
          </>
        }
      />
      <div className="content stack-lg">
        <div className="stack-sm">
          <h1 style={{ fontSize: 26 }}>
            {nickname ? `${nickname}님,` : '오늘의'} 어떤 흐름을 읽어 볼까요?
          </h1>
          <p className="muted small">
            {today
              ? '오늘의 한 장을 이미 확인했어요. 다시 뽑거나 세 장 리딩을 시작할 수 있어요.'
              : '질문을 정리하고 카드를 고르면 지금의 흐름과 오늘의 작은 행동을 제안합니다.'}
          </p>
        </div>

        <div className="stack">
          <button className="spread-card" onClick={() => onSpread(SPREADS.daily)}>
            <span className="go" aria-hidden>
              →
            </span>
            <div className="k">오늘의 한 장</div>
            <div className="d">질문 없이 오늘의 흐름을 한 장으로 확인합니다.</div>
          </button>
          <button className="spread-card" onClick={() => onSpread(SPREADS['fate-three'])}>
            <span className="go" aria-hidden>
              →
            </span>
            <div className="k">운명의 세 장</div>
            <div className="d">씨앗 · 흐름 · 문 — 배경과 가능성을 함께 읽습니다.</div>
          </button>
        </div>

        {recent.length > 0 && (
          <div>
            <SectionHeader title="최근 기록" />
            <div className="stack-sm">
              {recent.map((r) => (
                <ReadingTile key={r.id} reading={r} onOpen={onOpen} />
              ))}
            </div>
          </div>
        )}

        <div className="footer-links">
          <a href="/terms">이용약관</a>
          <a href="/privacy">개인정보 처리방침</a>
          <a href="https://www.instagram.com/toris.kr" target="_blank" rel="me noopener">
            Instagram
          </a>
          <a href="https://github.com/torisKR" target="_blank" rel="me noopener">
            GitHub
          </a>
          <a href="https://www.linkedin.com/in/toriskorea/" target="_blank" rel="me noopener">
            LinkedIn
          </a>
          <a href="https://www.threads.com/@toris.kr" target="_blank" rel="me noopener">
            Threads
          </a>
          <a
            href="https://play.google.com/store/apps/dev?id=6912640494861955983"
            target="_blank"
            rel="me noopener"
          >
            Google Play
          </a>
        </div>
      </div>
    </div>
  );
}

function ReadingTile({ reading, onOpen }: { reading: Reading; onOpen: (id: string) => void }) {
  const first = reading.interpretation.cardSections[0];
  const date = new Date(reading.createdAt);
  const dateStr = `${date.getMonth() + 1}월 ${date.getDate()}일`;
  return (
    <button className="list-tile" onClick={() => onOpen(reading.id)}>
      <img
        src={cardImage({ id: first.cardId } as FateCard)}
        alt=""
        width={44}
        height={66}
        style={{ borderRadius: 8, objectFit: 'cover', flex: 'none' }}
        loading="lazy"
      />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600 }}>{reading.interpretation.headline}</div>
        <div className="tertiary small" style={{ marginTop: 2 }}>
          {dateStr} · {spreadFromKey(reading.spread).label} · {reading.questionPreview}
        </div>
      </div>
    </button>
  );
}

// ------------------------------------------------------------------ 설정(질문)
function Setup({
  spread,
  onBack,
  onStart,
}: {
  spread: Spread;
  onBack: () => void;
  onStart: (category: CategoryKey, question: string, saveQuestion: boolean) => void;
}) {
  const [category, setCategory] = useState<CategoryKey>('general');
  const [question, setQuestion] = useState('');
  const [saveQuestion, setSaveQuestion] = useState(store.getSaveQuestionDefault());
  const isDaily = spread.key === 'daily';
  const topic = classify(question);
  const [guideBefore, guideAfter] = QUESTION_GUIDE[category];

  return (
    <div className="shell">
      <TopBar title={spread.label} onBack={onBack} />
      <div className="content stack-lg">
        <p className="muted">
          {isDaily
            ? '질문 없이 오늘의 흐름을 한 장으로 확인합니다. 카테고리를 고르면 해석의 관점이 달라집니다.'
            : '씨앗 · 흐름 · 문 세 장으로 지금의 배경과 가능성을 함께 읽습니다.'}
        </p>

        <div>
          <SectionHeader title="무엇에 대한 흐름인가요?" subtitle="카테고리에 따라 해석의 관점이 달라집니다" />
          <div className="chip-row">
            {CATEGORY_ORDER.map((k) => (
              <button
                key={k}
                className="chip"
                aria-pressed={category === k}
                onClick={() => setCategory(k)}
              >
                {category === k && '✓'} {CATEGORIES[k].label}
              </button>
            ))}
          </div>
          <p className="tertiary small" style={{ marginTop: 8 }}>
            {HINTS[category]}
          </p>
        </div>

        <div>
          <SectionHeader
            title="질문 (선택)"
            subtitle="비워 두어도 됩니다. 마음속으로만 떠올려도 괜찮습니다"
          />
          <textarea
            className="field"
            rows={3}
            maxLength={120}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="지금 마음에 걸리는 것을 한 문장으로 적어 보세요"
          />
          <div className="counter">{120 - Array.from(question).length}자 남음</div>

          <div className="surface stack-sm" style={{ marginTop: 12 }}>
            <div className="small tertiary">질문을 이렇게 바꿔 보세요</div>
            <div className="small" style={{ display: 'flex', gap: 8 }}>
              <span className="tertiary" style={{ flex: 'none' }}>
                예언형
              </span>
              <span style={{ textDecoration: 'line-through', color: 'var(--text-tertiary)' }}>
                {guideBefore}
              </span>
            </div>
            <div className="small" style={{ display: 'flex', gap: 8 }}>
              <span style={{ color: 'var(--gold)', flex: 'none' }}>성찰형</span>
              <span>{guideAfter}</span>
            </div>
          </div>
        </div>

        {isSensitive(topic) && (
          <div className="notice notice-violet" role="status">
            {safetyNotice(topic)}
          </div>
        )}

        <div className="surface toggle-row">
          <div className="grow">
            <div style={{ fontWeight: 500 }}>질문 원문 저장</div>
            <div className="tertiary small" style={{ marginTop: 2 }}>
              끄면 기록에는 앞부분만 남습니다. 공유 문구에는 어느 경우에도 포함되지 않습니다.
            </div>
          </div>
          <button
            className="switch"
            role="switch"
            aria-checked={saveQuestion}
            aria-label="질문 원문 저장"
            onClick={() => setSaveQuestion((v) => !v)}
          />
        </div>
      </div>
      <div className="bottombar">
        <button className="btn btn-primary" onClick={() => onStart(category, question, saveQuestion)}>
          카드 뽑으러 가기
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ 리추얼
function Ritual({ reduceMotion, onDone }: { reduceMotion: boolean; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, reduceMotion ? 250 : 1100);
    return () => clearTimeout(t);
  }, [onDone, reduceMotion]);
  return (
    <div className="shell">
      <div className="content ritual">
        <div className="ritual-stack" aria-hidden>
          <div className="rc" />
          <div className="rc" />
          <div className="rc" />
        </div>
        <div className="stack-sm">
          <h1 style={{ fontSize: 22 }}>카드를 섞고 있습니다</h1>
          <p className="muted small">마음속 질문을 한 번 더 떠올려 보세요.</p>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ 선택
function Select({
  session,
  onBack,
  onToggle,
  onReveal,
}: {
  session: Session;
  onBack: () => void;
  onToggle: (i: number) => void;
  onReveal: () => void;
}) {
  const need = session.spread.cardCount;
  const done = session.selected.length === need;
  return (
    <div className="shell">
      <TopBar title="카드 선택" onBack={onBack} />
      <div className="content stack-lg">
        <p className="center muted">
          직감이 이끄는 카드를 <b style={{ color: 'var(--text-primary)' }}>{need}장</b> 골라 주세요.
          <br />
          <span className="tertiary small">
            {session.selected.length} / {need} 선택됨 · 다시 눌러 취소할 수 있어요
          </span>
        </p>
        <div className="card-grid">
          {session.pool.map((_, i) => {
            const order = session.selected.indexOf(i);
            const sel = order >= 0;
            return (
              <button
                key={i}
                className={`card${sel ? ' selected' : ''}`}
                onClick={() => onToggle(i)}
                aria-pressed={sel}
                aria-label={sel ? `${order + 1}번째로 선택한 카드` : '뒤집힌 카드'}
              >
                {sel && <span className="badge">{order + 1}</span>}
                <div className="card-inner">
                  <CardBack />
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="bottombar">
        <button
          className={`btn btn-primary${done ? ' ready' : ''}`}
          disabled={!done}
          onClick={onReveal}
        >
          {done ? '카드 펼치기' : `${need - session.selected.length}장 더 선택`}
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ 공개
function Reveal({
  session,
  reduceMotion,
  onResult,
}: {
  session: Session;
  reduceMotion: boolean;
  onResult: () => void;
}) {
  const [flipped, setFlipped] = useState<boolean[]>(() => session.drawn.map(() => false));
  const allFlipped = flipped.every(Boolean);

  useEffect(() => {
    const timers = session.drawn.map((_, i) =>
      setTimeout(
        () => setFlipped((prev) => prev.map((v, j) => (j === i ? true : v))),
        reduceMotion ? 0 : 300 + i * 420,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [session.drawn, reduceMotion]);

  return (
    <div className="shell">
      <TopBar title="카드 공개" />
      <div className="content stack-lg">
        <p className="center muted">고른 카드가 지금의 흐름으로 모습을 드러냅니다.</p>
        <div
          className="card-grid reveal"
          style={{ ['--cols' as string]: String(session.drawn.length) }}
        >
          {session.drawn.map((d, i) => (
            <div key={i} className="stack-sm">
              <div className={`card${flipped[i] ? ' flipped' : ''}`} aria-hidden={!flipped[i]}>
                <div className="card-inner">
                  <CardBack />
                  <div className="card-face card-front">
                    <img src={cardImage(d.card)} alt={d.card.imageAlt} loading="eager" />
                  </div>
                </div>
              </div>
              <div className="center small">
                <div className="tertiary" style={{ fontSize: 12 }}>
                  {d.position.title}
                </div>
                <div style={{ fontWeight: 600 }}>{flipped[i] ? d.card.name : '…'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bottombar">
        <button className="btn btn-primary" disabled={!allFlipped} onClick={onResult}>
          결과 보기
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ 결과
function Result({
  id,
  onHome,
  onChange,
}: {
  id: string;
  onHome: () => void;
  onChange: () => void;
}) {
  const [reading, setReading] = useState<Reading | undefined>(() => store.readingById(id));
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState(reading?.note ?? '');

  const patch = useCallback(
    (p: Partial<Reading>) => {
      setReading((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...p };
        store.updateReading(next);
        onChange();
        return next;
      });
    },
    [onChange],
  );

  if (!reading) {
    return (
      <div className="shell">
        <TopBar title="결과" onBack={onHome} />
        <div className="content center muted" style={{ paddingTop: 40 }}>
          기록을 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const it = reading.interpretation;
  const spread = spreadFromKey(reading.spread);
  const category = categoryFromKey(reading.category);

  const share = async () => {
    const lines = [
      it.headline,
      '',
      ...it.cardSections.map((s) => `${s.positionTitle} · ${s.cardName} (${flowLabel(s.flow)})`),
      '',
      `오늘의 행동: ${it.action}`,
      '',
      '— 운명의 카드 fate.toris.kr',
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* 클립보드 미지원 무시 */
    }
  };

  return (
    <div className="shell">
      <TopBar title={spread.label} onBack={onHome} />
      <div className="content stack-lg">
        <div className="stack-sm">
          <div className="tertiary small">{category.label} · 오늘의 해석</div>
          <h1 style={{ fontSize: 25 }}>{it.headline}</h1>
        </div>

        <div className="stack">
          {it.cardSections.map((s, i) => (
            <div key={i} className="result-card">
              <div className="thumb">
                <img src={cardImage({ id: s.cardId } as FateCard)} alt={s.imageAlt} loading="lazy" />
              </div>
              <div className="body stack-sm">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="tertiary small">{s.positionTitle}</span>
                  <span style={{ fontWeight: 700 }}>{s.cardName}</span>
                  <span className="flow-tag">
                    <DomainDot domain={s.domain} /> {domainLabel(s.domain)} · {flowLabel(s.flow)}
                  </span>
                </div>
                <p className="muted small" style={{ margin: 0 }}>
                  {s.meaning}
                </p>
                {category.key !== 'general' && (
                  <p className="small" style={{ margin: 0, color: 'var(--gold)' }}>
                    {s.categoryMeaning}
                  </p>
                )}
                <div className="tertiary small">{s.keywords.join(' · ')}</div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <SectionHeader title="전체 흐름" />
          <p className="muted" style={{ margin: 0 }}>
            {it.overview}
          </p>
        </div>

        <div className="surface stack-sm">
          <div className="small tertiary">살펴볼 점</div>
          <p style={{ margin: 0 }}>{it.caution}</p>
        </div>

        <div className="surface stack-sm" style={{ borderColor: 'rgba(215,180,106,0.35)' }}>
          <div className="small" style={{ color: 'var(--gold)' }}>
            오늘의 작은 행동
          </div>
          <p style={{ margin: 0, fontWeight: 500 }}>{it.action}</p>
          <button
            className="btn btn-ghost btn-sm"
            style={{ width: 'auto', marginTop: 4 }}
            aria-pressed={reading.actionCompletedAt !== null}
            onClick={() =>
              patch({
                actionCommitted: reading.actionCompletedAt === null,
                actionCompletedAt:
                  reading.actionCompletedAt === null ? new Date().toISOString() : null,
              })
            }
          >
            {reading.actionCompletedAt !== null ? '✓ 완료함' : '완료로 표시'}
          </button>
        </div>

        <div className="surface stack-sm">
          <div className="small tertiary">돌아보는 질문</div>
          <p style={{ margin: 0 }}>{it.reflectionQuestion}</p>
        </div>

        <div>
          <SectionHeader title="회고" subtitle="며칠 뒤 다시 열어 이 흐름이 맞았는지 남겨 보세요" />
          <div className="stack-sm">
            <div className="stars" role="group" aria-label="이 리딩이 도움이 되었나요">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={`star${(reading.outcomeRating ?? 0) >= n ? ' on' : ''}`}
                  aria-label={`${n}점`}
                  onClick={() => patch({ outcomeRating: n })}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              className="field"
              rows={2}
              value={note}
              maxLength={200}
              placeholder="짧은 회고 메모 (선택)"
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => patch({ note: note.trim() || null })}
            />
          </div>
        </div>

        <p className="tertiary small">{it.disclaimer}</p>
      </div>
      <div className="bottombar stack-sm">
        <button className="btn btn-ghost" onClick={share}>
          {copied ? '문구가 복사되었습니다' : '결과 문구 복사'}
        </button>
        <button className="btn btn-primary" onClick={onHome}>
          홈으로
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ 기록
function Journal({ onBack, onOpen }: { onBack: () => void; onOpen: (id: string) => void }) {
  const [filter, setFilter] = useState<CategoryKey | null>(null);
  const readings = store.getReadings();
  const filtered = filter ? readings.filter((r) => r.category === filter) : readings;
  const keywords = store.topKeywords(6, readings);

  return (
    <div className="shell">
      <TopBar title="기록" onBack={onBack} />
      <div className="content stack-lg">
        {readings.length === 0 ? (
          <div className="surface center muted">
            아직 기록이 없습니다.
            <br />
            첫 리딩을 시작해 보세요.
          </div>
        ) : (
          <>
            <div className="stats">
              <div className="stat">
                <div className="num tabular">{readings.length}</div>
                <div className="lbl">전체 리딩</div>
              </div>
              <div className="stat">
                <div className="num tabular">{store.streakDays(readings)}일</div>
                <div className="lbl">연속 기록</div>
              </div>
              <div className="stat">
                <div className="num tabular">{store.completedActionCount(readings)}</div>
                <div className="lbl">완료한 행동</div>
              </div>
            </div>

            {keywords.length > 0 && (
              <div>
                <SectionHeader title="자주 나타난 키워드" subtitle="반복해서 떠오른 주제일 수 있습니다" />
                <div className="chip-row">
                  {keywords.map(([k, n]) => (
                    <span key={k} className="chip" style={{ cursor: 'default' }}>
                      {k} · <span className="tabular">{n}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <SectionHeader title="날짜별 기록" />
              <div className="chip-row" style={{ marginBottom: 12 }}>
                <button className="chip" aria-pressed={filter === null} onClick={() => setFilter(null)}>
                  전체
                </button>
                {CATEGORY_ORDER.filter((k) => k !== 'general').map((k) => (
                  <button
                    key={k}
                    className="chip"
                    aria-pressed={filter === k}
                    onClick={() => setFilter(k)}
                  >
                    {CATEGORIES[k].label}
                  </button>
                ))}
              </div>
              {filtered.length === 0 ? (
                <div className="surface muted">이 카테고리의 기록이 아직 없습니다.</div>
              ) : (
                <div className="stack-sm">
                  {filtered.map((r) => (
                    <ReadingTile key={r.id} reading={r} onOpen={onOpen} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ 설정
function Settings({
  onBack,
  reduceMotion,
  onReduceMotion,
  onCleared,
}: {
  onBack: () => void;
  reduceMotion: boolean;
  onReduceMotion: (v: boolean) => void;
  onCleared: () => void;
}) {
  const [nickname, setNick] = useState(store.getNickname());
  const [saveDefault, setSaveDefault] = useState(store.getSaveQuestionDefault());
  const [toast, setToast] = useState('');

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 1800);
  };

  return (
    <div className="shell">
      <TopBar title="설정" onBack={onBack} />
      <div className="content stack-lg">
        <div>
          <SectionHeader title="닉네임" subtitle="홈 인사에만 쓰입니다. 기기 안에만 저장됩니다" />
          <input
            className="field"
            maxLength={12}
            value={nickname}
            placeholder="예: 여행자"
            onChange={(e) => setNick(e.target.value)}
            onBlur={() => {
              store.setNickname(nickname);
            }}
          />
        </div>

        <div>
          <SectionHeader title="접근성" />
          <div className="stack-sm">
            <div className="surface toggle-row">
              <div className="grow">
                <div style={{ fontWeight: 500 }}>동작 줄이기</div>
                <div className="tertiary small" style={{ marginTop: 2 }}>
                  카드 섞기·뒤집기 애니메이션을 최소화합니다.
                </div>
              </div>
              <button
                className="switch"
                role="switch"
                aria-checked={reduceMotion}
                aria-label="동작 줄이기"
                onClick={() => onReduceMotion(!reduceMotion)}
              />
            </div>
            <div className="surface toggle-row">
              <div className="grow">
                <div style={{ fontWeight: 500 }}>질문 원문 저장 기본값</div>
                <div className="tertiary small" style={{ marginTop: 2 }}>
                  새 리딩에서 질문 저장을 기본으로 켭니다.
                </div>
              </div>
              <button
                className="switch"
                role="switch"
                aria-checked={saveDefault}
                aria-label="질문 원문 저장 기본값"
                onClick={() => {
                  const v = !saveDefault;
                  setSaveDefault(v);
                  store.setSaveQuestionDefault(v);
                }}
              />
            </div>
          </div>
        </div>

        <div>
          <SectionHeader title="데이터" subtitle="모든 기록은 이 기기에만 저장됩니다" />
          <div className="surface stack-sm">
            <p className="small muted" style={{ margin: 0 }}>
              회원가입 없이 이용하며, 기록은 브라우저에만 남습니다. 언제든 아래에서 지울 수 있습니다.
            </p>
            <button
              className="btn btn-ghost danger btn-sm"
              style={{ width: '100%' }}
              onClick={() => {
                if (confirm('모든 리딩 기록을 삭제할까요? 되돌릴 수 없습니다.')) {
                  store.deleteAllReadings();
                  flash('리딩 기록을 삭제했습니다.');
                  onCleared();
                }
              }}
            >
              리딩 기록 전체 삭제
            </button>
            <button
              className="btn btn-ghost danger btn-sm"
              style={{ width: '100%' }}
              onClick={() => {
                if (confirm('기록과 설정을 포함한 모든 데이터를 삭제할까요?')) {
                  store.deleteEverything();
                  flash('모든 데이터를 삭제했습니다.');
                  onCleared();
                }
              }}
            >
              모든 데이터 삭제
            </button>
          </div>
        </div>

        <div>
          <SectionHeader title="안내" />
          <div className="surface small muted">
            운명의 카드는 엔터테인먼트와 자기성찰을 위한 서비스이며, 미래의 사건을 보장하거나 의료·법률·재정적
            판단을 대신하지 않습니다.
          </div>
        </div>

        <div className="footer-links">
          <a href="/terms">이용약관</a>
          <a href="/privacy">개인정보 처리방침</a>
          <a href="https://www.instagram.com/toris.kr" target="_blank" rel="me noopener">
            Instagram
          </a>
          <a href="https://github.com/torisKR" target="_blank" rel="me noopener">
            GitHub
          </a>
          <a href="https://www.linkedin.com/in/toriskorea/" target="_blank" rel="me noopener">
            LinkedIn
          </a>
          <a href="https://www.threads.com/@toris.kr" target="_blank" rel="me noopener">
            Threads
          </a>
          <a
            href="https://play.google.com/store/apps/dev?id=6912640494861955983"
            target="_blank"
            rel="me noopener"
          >
            Google Play
          </a>
        </div>
        <p className="tertiary small center">운명의 카드 · 무료 · v0.1.0 · 카드 36장</p>
        {toast && (
          <div className="center small" style={{ color: 'var(--success)' }}>
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
