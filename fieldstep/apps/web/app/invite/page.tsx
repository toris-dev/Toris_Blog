"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { api, setToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function InviteForm() {
  const router = useRouter();
  const { refresh } = useAuth();
  const token = useSearchParams().get("token") ?? "";
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("유효하지 않은 초대 링크입니다");
      return;
    }
    setBusy(true);
    try {
      const res = await api.acceptInvite({ token, name, password });
      setToken(res.token);
      await refresh();
      router.push(res.role === "field" ? "/field" : "/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "초대 수락에 실패했습니다");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <form onSubmit={onSubmit} className="card w-full max-w-sm p-8">
        <h1 className="text-xl font-bold">초대 수락</h1>
        <p className="mt-1 text-sm text-muted">이름과 비밀번호를 설정하고 조직에 합류하세요.</p>
        {!token && <p className="mt-4 text-sm text-red-600">초대 토큰이 없습니다. 링크를 다시 확인해주세요.</p>}
        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            이름
            <input required className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            비밀번호 (8자 이상)
            <input
              type="password"
              required
              minLength={8}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy || !token}
            className="btn-primary tap-target rounded-lg py-3 font-medium"
          >
            {busy ? "처리 중…" : "가입 완료"}
          </button>
        </div>
      </form>
    </main>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">불러오는 중…</div>}>
      <InviteForm />
    </Suspense>
  );
}
