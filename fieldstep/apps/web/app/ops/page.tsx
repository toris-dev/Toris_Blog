"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { opsApi, type OpsOrgListItem } from "@/lib/opsApi";

function formatTimestamp(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("ko-KR", { dateStyle: "medium" });
}

export default function OpsOrgsPage() {
  const [orgs, setOrgs] = useState<OpsOrgListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    opsApi
      .orgs()
      .then((res) => setOrgs(res.orgs))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "불러오기에 실패했습니다"),
      );
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">조직 목록</h1>
        {orgs && (
          <span className="text-sm text-muted">{orgs.length.toLocaleString("ko-KR")}개 조직</span>
        )}
      </div>

      {error && (
        <p className="card border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {!orgs && !error && (
        <p className="text-sm text-muted">불러오는 중…</p>
      )}

      {orgs && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-4 py-3 font-medium">조직명</th>
                <th className="px-4 py-3 font-medium tabular-nums">멤버</th>
                <th className="px-4 py-3 font-medium tabular-nums">작업 수</th>
                <th className="px-4 py-3 font-medium">마지막 활동</th>
                <th className="px-4 py-3 font-medium">생성일</th>
              </tr>
            </thead>
            <tbody>
              {orgs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    조직이 없습니다
                  </td>
                </tr>
              ) : (
                orgs.map((org) => (
                  <tr
                    key={org.id}
                    className="border-b border-line last:border-0 hover:bg-bg-2"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/ops/org?id=${encodeURIComponent(org.id)}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {org.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {org.members.toLocaleString("ko-KR")}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {org.work_orders.toLocaleString("ko-KR")}
                    </td>
                    <td className="px-4 py-3 text-ink-dim">
                      {formatTimestamp(org.last_activity)}
                    </td>
                    <td className="px-4 py-3 text-ink-dim">
                      {formatDate(org.created_at)}
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
