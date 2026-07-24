"use client";

import { BILLING_STATUS_LABELS, type BillingStatus } from "@fieldstep/shared";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { BillingStatusBadge, WorkStatusBadge } from "@/components/StatusBadge";

type Row = Awaited<ReturnType<typeof api.billing.list>>["rows"][number];

function BillingContent() {
  const router = useRouter();
  const status = (useSearchParams().get("status") as BillingStatus | null) ?? undefined;
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalRow, setModalRow] = useState<Row | null>(null);

  function load() {
    api.billing
      .list(status)
      .then((r) => setRows(r.rows))
      .catch((err) => setError(err instanceof Error ? err.message : "불러오기에 실패했습니다"));
  }
  useEffect(load, [status]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">청구</h1>
        <select
          className="input"
          value={status ?? ""}
          onChange={(e) => router.push(e.target.value ? `/app/billing?status=${e.target.value}` : "/app/billing")}
        >
          <option value="">전체</option>
          {Object.entries(BILLING_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-muted">
            <tr>
              <th className="px-4 py-3">작업</th>
              <th className="px-4 py-3">고객</th>
              <th className="px-4 py-3">작업 상태</th>
              <th className="px-4 py-3">청구 상태</th>
              <th className="px-4 py-3">금액</th>
              <th className="px-4 py-3">청구일</th>
              <th className="px-4 py-3">납기일</th>
              <th className="px-4 py-3">입금일</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.workOrder.id} className="border-b border-line last:border-0 hover:bg-bg-2">
                <td className="px-4 py-3">
                  {r.workOrder.scheduledDate} {r.workOrder.workType}
                </td>
                <td className="px-4 py-3">{r.customerName}</td>
                <td className="px-4 py-3">
                  <WorkStatusBadge status={r.workOrder.workStatus} />
                </td>
                <td className="px-4 py-3">
                  <BillingStatusBadge status={r.billing.status} />
                </td>
                <td className="px-4 py-3">{r.billing.amount != null ? `₩${r.billing.amount.toLocaleString()}` : "-"}</td>
                <td className="px-4 py-3">{r.billing.billedAt ?? "-"}</td>
                <td className="px-4 py-3">{r.billing.dueAt ?? "-"}</td>
                <td className="px-4 py-3">{r.billing.paidAt ?? "-"}</td>
                <td className="px-4 py-3">
                  <button onClick={() => setModalRow(r)} className="text-primary hover:underline">
                    입력
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted">
                  청구 항목이 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalRow && (
        <BillingModal
          row={modalRow}
          onClose={() => setModalRow(null)}
          onSaved={() => {
            setModalRow(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function BillingModal({ row, onClose, onSaved }: { row: Row; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount] = useState(row.billing.amount != null ? String(row.billing.amount) : "");
  const [billedAt, setBilledAt] = useState(row.billing.billedAt ?? "");
  const [dueAt, setDueAt] = useState(row.billing.dueAt ?? "");
  const [paidAt, setPaidAt] = useState(row.billing.paidAt ?? "");
  const [memo, setMemo] = useState(row.billing.memo ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    const numericAmount = amount ? Number(amount) : null;
    if (numericAmount !== null && (!Number.isFinite(numericAmount) || numericAmount < 0)) {
      setError("금액은 0 이상으로 입력해 주세요");
      return;
    }
    if (!billedAt && (dueAt || paidAt)) {
      setError("납기일과 입금일을 입력하려면 청구일이 필요합니다");
      return;
    }
    if (billedAt && dueAt && dueAt < billedAt) {
      setError("납기일은 청구일보다 빠를 수 없습니다");
      return;
    }
    if (billedAt && paidAt && paidAt < billedAt) {
      setError("입금일은 청구일보다 빠를 수 없습니다");
      return;
    }

    setBusy(true);
    try {
      await api.workOrders.putBilling(row.workOrder.id, {
        amount: numericAmount,
        billedAt: billedAt || null,
        dueAt: dueAt || null,
        paidAt: paidAt || null,
        memo: memo || null,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-sm space-y-3 p-6">
        <h2 className="font-semibold">{row.customerName} 청구 입력</h2>
        <label className="flex flex-col gap-1 text-sm">
          금액
          <input
            type="number"
            min="0"
            className="input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={busy}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          청구일
          <input
            type="date"
            className="input"
            value={billedAt}
            onChange={(e) => setBilledAt(e.target.value)}
            disabled={busy}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          납기일
          <input
            type="date"
            className="input"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            disabled={busy}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          입금일
          <input
            type="date"
            className="input"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            disabled={busy}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          메모
          <input className="input" value={memo} onChange={(e) => setMemo(e.target.value)} disabled={busy} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 pt-2">
          <button onClick={save} disabled={busy} className="btn-primary flex-1 rounded-lg py-2 text-sm font-medium">
            저장
          </button>
          <button onClick={onClose} disabled={busy} className="btn-ghost rounded-lg px-4 py-2 text-sm">
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">불러오는 중…</div>}>
      <BillingContent />
    </Suspense>
  );
}
