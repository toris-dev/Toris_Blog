"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

type Mode = "signin" | "signup" | "reset";

const AUTH_ERROR: Record<string, string> = {
  "auth/invalid-email": "이메일 형식이 올바르지 않습니다.",
  "auth/user-not-found": "가입되지 않은 이메일입니다.",
  "auth/wrong-password": "비밀번호가 올바르지 않습니다.",
  "auth/invalid-credential": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "auth/email-already-in-use": "이미 가입된 이메일입니다. 로그인해 주세요.",
  "auth/weak-password": "비밀번호가 너무 약합니다. 6자 이상으로 설정해 주세요.",
  "auth/too-many-requests": "시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  "auth/network-request-failed": "네트워크 오류입니다. 연결을 확인해 주세요.",
  "auth/operation-not-allowed": "이메일 로그인이 아직 활성화되지 않았습니다.",
};

const SUBMIT_LABEL: Record<Mode, string> = {
  signin: "로그인",
  signup: "회원가입",
  reset: "재설정 메일 보내기",
};

const inputCls =
  "h-11 w-full rounded-xl border border-line bg-card px-4 text-sm text-ink placeholder:text-muted focus:border-step focus:outline-none focus-visible:outline-2 focus-visible:outline-step";
const linkCls =
  "font-semibold text-step-bright underline underline-offset-4 transition-colors hover:text-step";

/** 이메일·비밀번호 로그인 / 회원가입 / 비밀번호 재설정 폼 (Firebase Auth) */
export default function EmailAuthForm({ onAuthed }: { onAuthed?: () => void }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setNotice("");
    setPassword2("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");

    if (mode === "signup") {
      if (password.length < 6) {
        setError("비밀번호는 6자 이상이어야 합니다.");
        return;
      }
      if (password !== password2) {
        setError("비밀번호가 서로 다릅니다.");
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === "reset") {
        await sendPasswordResetEmail(auth, email.trim());
        setMode("signin");
        setNotice("비밀번호 재설정 메일을 보냈어요. 메일함을 확인해 주세요.");
      } else if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        onAuthed?.();
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        onAuthed?.();
      }
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setError(AUTH_ERROR[code] ?? "요청을 처리하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 text-left">
      <label htmlFor="ea-email" className="sr-only">이메일</label>
      <input
        id="ea-email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일"
        className={inputCls}
      />

      {mode !== "reset" && (
        <>
          <label htmlFor="ea-password" className="sr-only">비밀번호</label>
          <input
            id="ea-password"
            type="password"
            required
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            className={inputCls}
          />
        </>
      )}

      {mode === "signup" && (
        <>
          <label htmlFor="ea-password2" className="sr-only">비밀번호 확인</label>
          <input
            id="ea-password2"
            type="password"
            required
            autoComplete="new-password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder="비밀번호 확인"
            className={inputCls}
          />
        </>
      )}

      <button
        type="submit"
        disabled={busy}
        className="btn-ember h-11 w-full rounded-xl px-6 text-sm font-bold disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-step-bright"
      >
        {busy ? "처리 중…" : SUBMIT_LABEL[mode]}
      </button>

      <p aria-live="polite" className="min-h-5 text-[13px]">
        {error && <span className="text-step-bright">{error}</span>}
        {notice && <span className="text-ok">{notice}</span>}
      </p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-dim">
        {mode === "signin" && (
          <>
            <button type="button" onClick={() => switchMode("signup")} className={linkCls}>
              회원가입
            </button>
            <button type="button" onClick={() => switchMode("reset")} className={linkCls}>
              비밀번호를 잊으셨나요?
            </button>
          </>
        )}
        {mode === "signup" && (
          <span>
            이미 계정이 있으신가요?{" "}
            <button type="button" onClick={() => switchMode("signin")} className={linkCls}>
              로그인
            </button>
          </span>
        )}
        {mode === "reset" && (
          <button type="button" onClick={() => switchMode("signin")} className={linkCls}>
            로그인으로 돌아가기
          </button>
        )}
      </div>
    </form>
  );
}
