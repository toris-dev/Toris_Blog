"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { opsApi, setOpsToken } from "@/lib/opsApi";

export default function OpsLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await opsApi.login({ email, password });
      setOpsToken(res.token);
      router.replace("/ops");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <form onSubmit={onSubmit} className="card w-full max-w-sm p-8">
        <h1 className="text-xl font-bold">통합관리자 로그인</h1>
        <p className="mt-1 text-sm text-muted">서비스 운영자 전용 콘솔입니다.</p>
        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            이메일
            <input
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            비밀번호
            <input
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="btn-primary tap-target rounded-lg py-3 font-medium"
          >
            {busy ? "로그인 중…" : "로그인"}
          </button>
        </div>
      </form>
    </main>
  );
}
