"use client";

import type { Member, Role } from "@fieldstep/shared";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Invite = { id: string; email: string; role: Role; expiresAt: string; accepted: boolean };

const ROLE_LABEL: Record<Role, string> = { admin: "관리자", office: "사무실", field: "현장" };

export default function SettingsPage() {
  const { role, org } = useAuth();
  const isAdmin = role === "admin";
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("field");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.users().then((r) => setMembers(r.members));
    if (isAdmin) api.invites.list().then((r) => setInvites(r.invites));
  }, [isAdmin]);

  async function sendInvite() {
    setBusy(true);
    setError(null);
    try {
      const { invite } = await api.invites.create({ email, role: inviteRole });
      const url = `${typeof location !== "undefined" ? location.origin : ""}/invite?token=${invite.token}`;
      setLastLink(url);
      setCopied(false);
      setEmail("");
      const r = await api.invites.list();
      setInvites(r.invites);
    } catch (err) {
      setError(err instanceof Error ? err.message : "초대 생성에 실패했습니다");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">설정</h1>
      <div className="card p-4 text-sm">
        <p className="text-muted">조직</p>
        <p className="mt-1 font-medium">{org?.name}</p>
      </div>

      <div className="card p-4">
        <p className="font-medium">구성원</p>
        <table className="mt-2 w-full text-sm">
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-line last:border-0">
                <td className="py-2">{m.name}</td>
                <td className="py-2 text-muted">{m.email}</td>
                <td className="py-2">{ROLE_LABEL[m.role]}</td>
                <td className="py-2 text-muted">{m.active ? "활성" : "비활성"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdmin && (
        <div className="card space-y-3 p-4">
          <p className="font-medium">초대</p>
          <div className="flex flex-wrap gap-2">
            <input
              type="email"
              placeholder="이메일"
              className="input flex-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <select className="input" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as Role)}>
              <option value="field">현장</option>
              <option value="office">사무실</option>
              <option value="admin">관리자</option>
            </select>
            <button onClick={sendInvite} disabled={busy || !email} className="btn-primary rounded-lg px-4 py-2 text-sm font-medium">
              초대 생성
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {lastLink && (
            <div className="flex items-center gap-2 rounded-lg bg-bg-2 p-2 text-xs">
              <code className="flex-1 truncate">{lastLink}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(lastLink);
                  setCopied(true);
                }}
                className="btn-ghost rounded px-2 py-1"
              >
                {copied ? "복사됨" : "복사"}
              </button>
            </div>
          )}
          <table className="mt-2 w-full text-sm">
            <tbody>
              {invites.map((inv) => (
                <tr key={inv.id} className="border-b border-line last:border-0">
                  <td className="py-2">{inv.email}</td>
                  <td className="py-2">{ROLE_LABEL[inv.role]}</td>
                  <td className="py-2 text-muted">만료 {inv.expiresAt}</td>
                </tr>
              ))}
              {invites.length === 0 && (
                <tr>
                  <td className="py-4 text-center text-muted">대기 중인 초대가 없습니다</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
