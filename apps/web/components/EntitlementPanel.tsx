"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { FEATURES, type Feature } from "@builderstep/shared";
import { auth, googleProvider } from "@/lib/firebase";

const API =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.builder.toris.kr";
const CHECKOUT =
  process.env.NEXT_PUBLIC_RAPID_CHECKOUT_URL ?? "";

interface Entitlement {
  status: string;
  plan: string | null;
  pro: boolean;
  currentPeriodEnd: string | null;
  features: Feature[];
}

const STATUS_LABEL: Record<string, string> = {
  none: "구독 없음",
  active: "구독 중",
  grace: "결제 확인 중(유예)",
  canceled: "해지 예약됨",
  expired: "만료됨",
  refunded: "환불됨",
};

const AUTH_ERROR: Record<string, string> = {
  "auth/popup-closed-by-user": "로그인 창이 닫혔습니다. 다시 시도해 주세요.",
  "auth/cancelled-popup-request": "로그인 창이 닫혔습니다. 다시 시도해 주세요.",
  "auth/popup-blocked": "브라우저가 팝업을 차단했습니다. 팝업을 허용해 주세요.",
  "auth/unauthorized-domain": "허용되지 않은 도메인입니다. 잠시 후 다시 시도해 주세요.",
  "auth/operation-not-allowed": "구글 로그인이 아직 활성화되지 않았습니다.",
  "auth/network-request-failed": "네트워크 오류입니다. 연결을 확인해 주세요.",
};

/** 구글 로그인(또는 이메일 직접 입력)으로 구독 상태를 조회해 기능 잠금을 해제한다 */
export default function EntitlementPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState("");
  const [ent, setEnt] = useState<Entitlement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchEntitlement = async (init: RequestInit, query = "") => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/entitlements${query}`, init);
      if (!res.ok) throw new Error(`조회 실패 (${res.status})`);
      setEnt(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
      setEnt(null);
    } finally {
      setLoading(false);
    }
  };

  // 로그인 상태 복원: 세션이 살아 있으면 자동으로 본인 구독 조회
  useEffect(() => {
    const off = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthReady(true);
      if (u) {
        const token = await u.getIdToken();
        void fetchEntitlement({ headers: { Authorization: `Bearer ${token}` } });
      }
    });
    return off;
  }, []);

  const loginWithGoogle = async () => {
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      // 조회는 onAuthStateChanged에서 이어진다
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      setError(AUTH_ERROR[code] ?? "구글 로그인에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  const logout = async () => {
    await signOut(auth);
    setEnt(null);
    setError("");
  };

  const lookupByEmail = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchEntitlement({}, `?email=${encodeURIComponent(email.trim())}`);
  };

  const unlocked = new Set(ent?.features.map((f) => f.key) ?? FEATURES.filter((f) => !f.pro).map((f) => f.key));

  return (
    <div>
      {/* ---- 구글 로그인 ---- */}
      {user ? (
        <div className="glass flex flex-wrap items-center gap-3 rounded-xl px-5 py-4">
          {user.photoURL && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt="" aria-hidden="true" referrerPolicy="no-referrer" className="size-9 rounded-full border border-line" />
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{user.displayName ?? "빌더"}</p>
            <p className="truncate font-mono text-xs text-muted">{user.email}</p>
          </div>
          <button
            onClick={logout}
            className="btn-ghost ml-auto rounded-lg px-3.5 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-step"
          >
            로그아웃
          </button>
        </div>
      ) : (
        <button
          onClick={loginWithGoogle}
          disabled={!authReady}
          className="btn-ember inline-flex h-13 w-full items-center justify-center gap-3 rounded-xl px-6 text-[15px] font-bold disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-step-bright sm:w-auto"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
            <path fill="#14100b" d="M21.35 11.1H12v2.9h5.35c-.5 2.4-2.55 3.9-5.35 3.9a5.9 5.9 0 1 1 0-11.8c1.5 0 2.85.55 3.9 1.45l2.15-2.15A8.9 8.9 0 1 0 12 20.9c5.15 0 8.8-3.6 8.8-8.7 0-.4-.02-.75-.05-1.1Z"/>
          </svg>
          구글로 로그인하고 내 구독 확인
        </button>
      )}

      {/* ---- 이메일 직접 조회 (로그인 없이) ---- */}
      {!user && (
        <form onSubmit={lookupByEmail} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="ent-email" className="sr-only">래피드 계정 이메일</label>
          <input
            id="ent-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="또는 래피드 결제에 사용한 이메일로 조회"
            className="h-12 flex-1 rounded-xl border border-line bg-card px-4 text-[15px] text-ink placeholder:text-muted focus:border-step focus:outline-none focus-visible:outline-2 focus-visible:outline-step"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-ghost h-12 rounded-xl px-6 text-[15px] font-semibold disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-step"
          >
            {loading ? "조회 중…" : "이메일로 조회"}
          </button>
        </form>
      )}
      <p aria-live="polite" className="mt-2 min-h-5 text-sm text-step-bright">{error}</p>

      {ent && (
        <div className="glass mt-2 flex flex-wrap items-center gap-3 rounded-xl px-5 py-4">
          <span
            className={`rounded-full px-3 py-1 text-[13px] font-semibold ${ent.pro ? "bg-ok/15 text-ok" : "bg-line text-ink-dim"}`}
          >
            {STATUS_LABEL[ent.status] ?? ent.status}
          </span>
          {ent.plan && <span className="text-sm text-ink-dim">{ent.plan === "yearly" ? "연간 플랜" : "월간 플랜"}</span>}
          {ent.currentPeriodEnd && (
            <span className="font-mono text-xs text-muted">다음 갱신 {ent.currentPeriodEnd.slice(0, 10)}</span>
          )}
          {!ent.pro && CHECKOUT && (
            <a href={CHECKOUT} className="ml-auto text-sm font-semibold text-step-bright underline underline-offset-4 hover:text-step">
              래피드에서 구독하기 →
            </a>
          )}
        </div>
      )}

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => {
          const open = unlocked.has(f.key);
          return (
            <li
              key={f.key}
              className={`rounded-2xl border p-5 transition-colors ${open ? "border-line bg-card" : "border-dashed border-line/80 bg-bg-2/40"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className={`font-bold ${open ? "text-ink" : "text-lock"}`}>{f.name}</h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                    f.pro
                      ? open
                        ? "bg-ok/15 text-ok"
                        : "bg-line text-lock"
                      : "bg-step/15 text-step-bright"
                  }`}
                >
                  {f.pro ? (open ? "PRO · 사용 가능" : "PRO 🔒") : "무료"}
                </span>
              </div>
              <p className={`mt-2 text-sm leading-relaxed ${open ? "text-ink-dim" : "text-lock"}`}>
                {f.description}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
