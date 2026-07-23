"use client";

import type { Asset, Customer, Member, Site } from "@fieldstep/shared";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function NewWorkOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const [form, setForm] = useState({
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTime: "",
    workType: "",
    customerId: "",
    siteId: "",
    assetId: "",
    request: "",
  });
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.customers.list().then((r) => setCustomers(r.customers));
    api.users().then((r) => setMembers(r.members));
  }, []);

  useEffect(() => {
    if (!form.customerId) {
      setSites([]);
      return;
    }
    api.sites.list(form.customerId).then((r) => setSites(r.sites));
  }, [form.customerId]);

  useEffect(() => {
    if (!form.siteId) {
      setAssets([]);
      return;
    }
    api.assets.list(form.siteId).then((r) => setAssets(r.assets));
  }, [form.siteId]);

  function toggleAssignee(id: string) {
    setAssigneeIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function onSubmit() {
    setError(null);
    if (!form.customerId || !form.siteId || !form.workType || assigneeIds.length === 0) {
      setError("고객/현장/작업유형/담당자를 모두 입력해주세요");
      return;
    }
    setBusy(true);
    try {
      const { workOrder } = await api.workOrders.create({
        ...form,
        scheduledTime: form.scheduledTime || undefined,
        assetId: form.assetId || undefined,
        request: form.request || undefined,
        assigneeIds,
      });
      router.push(`/app/work/detail?id=${workOrder.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-xl font-bold">작업 등록</h1>
      <div className="card mt-6 space-y-4 p-6">
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            일정
            <input
              type="date"
              className="input"
              value={form.scheduledDate}
              onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            시간 (선택)
            <input
              type="time"
              className="input"
              value={form.scheduledTime}
              onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          작업 유형
          <input
            className="input"
            placeholder="예: 정기점검, 수리"
            value={form.workType}
            onChange={(e) => setForm({ ...form, workType: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          고객
          <select
            className="input"
            value={form.customerId}
            onChange={(e) => setForm({ ...form, customerId: e.target.value, siteId: "", assetId: "" })}
          >
            <option value="">선택</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          현장
          <select
            className="input"
            value={form.siteId}
            disabled={!form.customerId}
            onChange={(e) => setForm({ ...form, siteId: e.target.value, assetId: "" })}
          >
            <option value="">선택</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          장비 (선택)
          <select
            className="input"
            value={form.assetId}
            disabled={!form.siteId}
            onChange={(e) => setForm({ ...form, assetId: e.target.value })}
          >
            <option value="">선택 안 함</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          요청 사항 (선택)
          <textarea
            className="input min-h-20"
            value={form.request}
            onChange={(e) => setForm({ ...form, request: e.target.value })}
          />
        </label>
        <div>
          <p className="mb-1 text-sm">담당자 (복수 선택)</p>
          <div className="flex flex-wrap gap-2">
            {members
              .filter((m) => m.active)
              .map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleAssignee(m.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    assigneeIds.includes(m.id)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-line text-ink-dim"
                  }`}
                >
                  {m.name}
                </button>
              ))}
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button onClick={onSubmit} disabled={busy} className="btn-primary tap-target w-full rounded-lg py-3 font-medium">
          {busy ? "등록 중…" : "작업 등록"}
        </button>
      </div>
    </div>
  );
}
