"use client";

import { useEffect, useState, type FormEvent } from "react";
import { opsApi, type OpsAuditEvent } from "@/lib/opsApi";

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

function formatDetail(detail: unknown): string {
  if (detail == null) return "-";
  if (typeof detail === "string") return detail;
  try {
    return JSON.stringify(detail);
  } catch {
    return String(detail);
  }
}

export default function OpsAuditPage() {
  const [orgId, setOrgId] = useState("");
  const [event, setEvent] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [limit, setLimit] = useState("100");

  const [events, setEvents] = useState<OpsAuditEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const parsedLimit = Number.parseInt(limit, 10);
      const res = await opsApi.audit({
        orgId: orgId.trim() || undefined,
        event: event.trim() || undefined,
        from: from || undefined,
        to: to || undefined,
        limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      });
      setEvents(res.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : "불러오기에 실패했습니다");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
    // 최초 1회만 로드. 필터는 명시적으로 조회한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">감사 로그</h1>

      <form onSubmit={load} className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1 text-sm">
          조직 ID
          <input
            className="input"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            placeholder="선택"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          이벤트
          <input
            className="input"
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            placeholder="선택"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          시작일
          <input
            type="date"
            className="input"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          종료일
          <input
            type="date"
            className="input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          개수
          <input
            type="number"
            min={1}
            className="input"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
        </label>
        <div className="sm:col-span-2 lg:col-span-5">
          <button
            type="submit"
            disabled={busy}
            className="btn-primary rounded-lg px-4 py-2 text-sm font-medium"
          >
            {busy ? "조회 중…" : "조회"}
          </button>
        </div>
      </form>

      {error && (
        <p className="card border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {events && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-3 py-3 font-medium">시각</th>
                <th className="px-3 py-3 font-medium">조직</th>
                <th className="px-3 py-3 font-medium">이벤트</th>
                <th className="px-3 py-3 font-medium">대상</th>
                <th className="px-3 py-3 font-medium">행위자</th>
                <th className="px-3 py-3 font-medium">상세</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted">
                    조회 결과가 없습니다
                  </td>
                </tr>
              ) : (
                events.map((row) => (
                  <tr key={row.id} className="border-b border-line last:border-0 align-top">
                    <td className="whitespace-nowrap px-3 py-2 text-ink-dim">
                      {formatTimestamp(row.createdAt)}
                    </td>
                    <td className="px-3 py-2">{row.orgName}</td>
                    <td className="px-3 py-2">
                      <span className="rounded bg-bg-2 px-2 py-0.5 font-mono text-xs">
                        {row.event}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-ink-dim">{row.target ?? "-"}</td>
                    <td className="px-3 py-2 text-ink-dim">{row.actorUserId ?? "-"}</td>
                    <td className="max-w-xs px-3 py-2 text-xs text-muted">
                      <span className="block break-all font-mono">
                        {formatDetail(row.detail)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
