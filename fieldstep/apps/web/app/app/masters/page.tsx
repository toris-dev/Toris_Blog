"use client";

import type { Asset, Customer, Site, WorkOrderSummary } from "@fieldstep/shared";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { WorkStatusBadge } from "@/components/StatusBadge";

type Tab = "customers" | "sites" | "assets";

export default function MastersPage() {
  const [tab, setTab] = useState<Tab>("customers");
  return (
    <div>
      <h1 className="text-xl font-bold">고객사 / 현장 / 장비</h1>
      <div className="mt-4 flex gap-2">
        {(["customers", "sites", "assets"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === t ? "bg-primary text-white" : "btn-ghost"}`}
          >
            {t === "customers" ? "고객사" : t === "sites" ? "현장" : "장비"}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tab === "customers" && <CustomersTab />}
        {tab === "sites" && <SitesTab />}
        {tab === "assets" && <AssetsTab />}
      </div>
    </div>
  );
}

function CustomersTab() {
  const [list, setList] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ name: "", bizNo: "", address: "", contactName: "", contactPhone: "", memo: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    api.customers.list(q || undefined).then((r) => setList(r.customers));
  }
  useEffect(load, [q]);

  function startEdit(c: Customer) {
    setEditing(c.id);
    setForm({
      name: c.name,
      bizNo: c.bizNo ?? "",
      address: c.address ?? "",
      contactName: c.contactName ?? "",
      contactPhone: c.contactPhone ?? "",
      memo: c.memo ?? "",
    });
  }

  async function save() {
    setBusy(true);
    try {
      if (editing) await api.customers.patch(editing, form);
      else await api.customers.create(form);
      setForm({ name: "", bizNo: "", address: "", contactName: "", contactPhone: "", memo: "" });
      setEditing(null);
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="card space-y-2 p-4 lg:col-span-2">
        <input className="input w-full" placeholder="검색" value={q} onChange={(e) => setQ(e.target.value)} />
        <table className="mt-2 w-full text-sm">
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="cursor-pointer border-b border-line hover:bg-bg-2" onClick={() => startEdit(c)}>
                <td className="py-2">{c.name}</td>
                <td className="py-2 text-muted">{c.contactName ?? "-"}</td>
                <td className="py-2 text-muted">{c.contactPhone ?? "-"}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td className="py-4 text-center text-muted">고객사가 없습니다</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="card space-y-2 p-4">
        <p className="font-medium">{editing ? "고객사 수정" : "고객사 추가"}</p>
        {(["name", "bizNo", "address", "contactName", "contactPhone", "memo"] as const).map((k) => (
          <input
            key={k}
            className="input w-full"
            placeholder={
              { name: "이름", bizNo: "사업자번호", address: "주소", contactName: "담당자", contactPhone: "연락처", memo: "메모" }[k]
            }
            value={form[k]}
            onChange={(e) => setForm({ ...form, [k]: e.target.value })}
          />
        ))}
        <div className="flex gap-2">
          <button onClick={save} disabled={busy || !form.name} className="btn-primary flex-1 rounded-lg py-2 text-sm font-medium">
            저장
          </button>
          {editing && (
            <button
              onClick={() => {
                setEditing(null);
                setForm({ name: "", bizNo: "", address: "", contactName: "", contactPhone: "", memo: "" });
              }}
              className="btn-ghost rounded-lg px-3 py-2 text-sm"
            >
              취소
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SitesTab() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [list, setList] = useState<Site[]>([]);
  const [form, setForm] = useState({ customerId: "", name: "", address: "", accessInfo: "", mapUrl: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.customers.list().then((r) => setCustomers(r.customers));
  }, []);
  useEffect(() => {
    api.sites.list(customerId || undefined).then((r) => setList(r.sites));
  }, [customerId]);

  function startEdit(s: Site) {
    setEditing(s.id);
    setForm({ customerId: s.customerId, name: s.name, address: s.address ?? "", accessInfo: s.accessInfo ?? "", mapUrl: s.mapUrl ?? "" });
  }

  async function save() {
    setBusy(true);
    try {
      if (editing) await api.sites.patch(editing, form);
      else await api.sites.create(form);
      setForm({ customerId: "", name: "", address: "", accessInfo: "", mapUrl: "" });
      setEditing(null);
      api.sites.list(customerId || undefined).then((r) => setList(r.sites));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="card space-y-2 p-4 lg:col-span-2">
        <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">전체 고객사</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <table className="mt-2 w-full text-sm">
          <tbody>
            {list.map((s) => (
              <tr key={s.id} className="cursor-pointer border-b border-line hover:bg-bg-2" onClick={() => startEdit(s)}>
                <td className="py-2">{s.name}</td>
                <td className="py-2 text-muted">{s.address ?? "-"}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td className="py-4 text-center text-muted">현장이 없습니다</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="card space-y-2 p-4">
        <p className="font-medium">{editing ? "현장 수정" : "현장 추가"}</p>
        <select className="input w-full" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
          <option value="">고객사 선택</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {(["name", "address", "accessInfo", "mapUrl"] as const).map((k) => (
          <input
            key={k}
            className="input w-full"
            placeholder={{ name: "이름", address: "주소", accessInfo: "출입정보", mapUrl: "지도 URL" }[k]}
            value={form[k]}
            onChange={(e) => setForm({ ...form, [k]: e.target.value })}
          />
        ))}
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={busy || !form.name || !form.customerId}
            className="btn-primary flex-1 rounded-lg py-2 text-sm font-medium"
          >
            저장
          </button>
          {editing && (
            <button
              onClick={() => {
                setEditing(null);
                setForm({ customerId: "", name: "", address: "", accessInfo: "", mapUrl: "" });
              }}
              className="btn-ghost rounded-lg px-3 py-2 text-sm"
            >
              취소
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AssetsTab() {
  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState("");
  const [list, setList] = useState<Asset[]>([]);
  const [form, setForm] = useState({ siteId: "", name: "", model: "", serialNo: "", installedAt: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<{ assetId: string; rows: WorkOrderSummary[] } | null>(null);

  useEffect(() => {
    api.sites.list().then((r) => setSites(r.sites));
  }, []);
  useEffect(() => {
    if (!siteId) {
      setList([]);
      return;
    }
    api.assets.list(siteId).then((r) => setList(r.assets));
  }, [siteId]);

  function startEdit(a: Asset) {
    setEditing(a.id);
    setForm({ siteId: a.siteId, name: a.name, model: a.model ?? "", serialNo: a.serialNo ?? "", installedAt: a.installedAt ?? "" });
  }

  async function save() {
    setBusy(true);
    try {
      if (editing) await api.assets.patch(editing, form);
      else await api.assets.create(form);
      setForm({ siteId, name: "", model: "", serialNo: "", installedAt: "" });
      setEditing(null);
      if (siteId) api.assets.list(siteId).then((r) => setList(r.assets));
    } finally {
      setBusy(false);
    }
  }

  async function loadHistory(a: Asset) {
    const r = await api.assets.history(a.id);
    setHistory({ assetId: a.id, rows: r.workOrders });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="card space-y-2 p-4 lg:col-span-2">
        <select className="input" value={siteId} onChange={(e) => setSiteId(e.target.value)}>
          <option value="">현장 선택</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <table className="mt-2 w-full text-sm">
          <tbody>
            {list.map((a) => (
              <tr key={a.id} className="border-b border-line hover:bg-bg-2">
                <td className="cursor-pointer py-2" onClick={() => startEdit(a)}>
                  {a.name}
                </td>
                <td className="py-2 text-muted">{a.model ?? "-"}</td>
                <td className="py-2">
                  <button onClick={() => loadHistory(a)} className="text-primary hover:underline">
                    이력
                  </button>
                </td>
              </tr>
            ))}
            {siteId && list.length === 0 && (
              <tr>
                <td className="py-4 text-center text-muted">장비가 없습니다</td>
              </tr>
            )}
          </tbody>
        </table>
        {history && (
          <div className="mt-4 rounded-lg border border-line p-3">
            <p className="text-sm font-medium">작업 이력</p>
            <ul className="mt-2 space-y-1 text-sm">
              {history.rows.map((w) => (
                <li key={w.id} className="flex items-center justify-between">
                  <span>
                    {w.scheduledDate} · {w.workType}
                  </span>
                  <WorkStatusBadge status={w.workStatus} />
                </li>
              ))}
              {history.rows.length === 0 && <li className="text-muted">이력이 없습니다</li>}
            </ul>
          </div>
        )}
      </div>
      <div className="card space-y-2 p-4">
        <p className="font-medium">{editing ? "장비 수정" : "장비 추가"}</p>
        <select className="input w-full" value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value })}>
          <option value="">현장 선택</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {(["name", "model", "serialNo"] as const).map((k) => (
          <input
            key={k}
            className="input w-full"
            placeholder={{ name: "이름", model: "모델", serialNo: "일련번호" }[k]}
            value={form[k]}
            onChange={(e) => setForm({ ...form, [k]: e.target.value })}
          />
        ))}
        <label className="flex flex-col gap-1 text-sm">
          설치일
          <input type="date" className="input" value={form.installedAt} onChange={(e) => setForm({ ...form, installedAt: e.target.value })} />
        </label>
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={busy || !form.name || !form.siteId}
            className="btn-primary flex-1 rounded-lg py-2 text-sm font-medium"
          >
            저장
          </button>
          {editing && (
            <button
              onClick={() => {
                setEditing(null);
                setForm({ siteId, name: "", model: "", serialNo: "", installedAt: "" });
              }}
              className="btn-ghost rounded-lg px-3 py-2 text-sm"
            >
              취소
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
