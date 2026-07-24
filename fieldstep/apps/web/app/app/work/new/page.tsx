"use client";

import type {
  Asset,
  Customer,
  MaintenanceFrequency,
  Member,
  Site,
} from "@fieldstep/shared";
import { toSeoulDateString } from "@fieldstep/shared";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

function NewWorkOrderContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sourceWorkOrderId = params.get("sourceWorkOrderId") ?? "";
  const sourceReportVersionId = params.get("sourceReportVersionId") ?? "";
  const suggestedDate = params.get("scheduledDate") ?? "";
  const suggestedRecurrence = params.get("recurring") === "1";
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const [form, setForm] = useState({
    scheduledDate: toSeoulDateString(),
    scheduledTime: "",
    workType: "",
    customerId: "",
    siteId: "",
    assetId: "",
    request: "",
  });
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [recurring, setRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<{
    frequency: MaintenanceFrequency;
    intervalCount: string;
    endDate: string;
  }>({
    frequency: "monthly",
    intervalCount: "1",
    endDate: "",
  });
  const [prefillLoading, setPrefillLoading] = useState(false);
  const recurrenceRequest = useRef<{
    fingerprint: string;
    idempotencyKey: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"draft" | "schedule" | null>(null);

  useEffect(() => {
    api.customers.list().then((r) => setCustomers(r.customers));
    api.users().then((r) => setMembers(r.members));
  }, []);

  useEffect(() => {
    if (!sourceWorkOrderId) return;
    let canceled = false;
    setPrefillLoading(true);
    api.workOrders
      .get(sourceWorkOrderId)
      .then((source) => {
        if (canceled) return;
        setForm((current) => ({
          ...current,
          scheduledDate: suggestedDate || current.scheduledDate,
          scheduledTime: source.workOrder.scheduledTime ?? "",
          workType: source.workOrder.workType,
          customerId: source.customer.id,
          siteId: source.site.id,
          assetId: source.asset?.id ?? "",
          request: source.workOrder.request ?? "",
        }));
        setAssigneeIds(
          source.assignees
            .filter((member) => member.active)
            .map((member) => member.id),
        );
        setRecurring(suggestedRecurrence);
      })
      .catch((err) => {
        if (!canceled) {
          setError(
            err instanceof Error
              ? err.message
              : "이전 작업 정보를 불러오지 못했습니다",
          );
        }
      })
      .finally(() => {
        if (!canceled) setPrefillLoading(false);
      });
    return () => {
      canceled = true;
    };
  }, [sourceWorkOrderId, suggestedDate, suggestedRecurrence]);

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

  async function onSubmit(intent: "draft" | "schedule") {
    setError(null);
    if (!form.scheduledDate || !form.customerId || !form.siteId || !form.workType.trim()) {
      setError("일정/고객/현장/작업유형을 모두 입력해주세요");
      return;
    }
    if (intent === "schedule" && assigneeIds.length === 0) {
      setError("예정 작업으로 등록하려면 담당자를 한 명 이상 선택해주세요");
      return;
    }
    if (recurring && intent === "draft") {
      setError("반복 일정은 담당자를 배정한 예정 작업으로 등록해주세요");
      return;
    }
    const intervalCount = Number(recurrence.intervalCount);
    if (
      recurring &&
      (!Number.isInteger(intervalCount) ||
        intervalCount < 1 ||
        intervalCount > 60)
    ) {
      setError("반복 간격은 1~60 사이의 정수로 입력해주세요");
      return;
    }
    if (
      recurring &&
      recurrence.endDate &&
      recurrence.endDate < form.scheduledDate
    ) {
      setError("반복 종료일은 첫 작업일보다 빠를 수 없습니다");
      return;
    }
    setBusy(intent);
    try {
      const createBody = {
        ...form,
        workType: form.workType.trim(),
        scheduledTime: form.scheduledTime || undefined,
        assetId: form.assetId || undefined,
        request: form.request || undefined,
        assigneeIds: intent === "schedule" ? assigneeIds : [],
        intent,
        recurrence: recurring
          ? {
              frequency: recurrence.frequency,
              intervalCount,
              endDate: recurrence.endDate || undefined,
            }
          : undefined,
        sourceReportVersionId:
          recurring && sourceReportVersionId
            ? sourceReportVersionId
            : undefined,
      };
      const requestFingerprint = JSON.stringify(createBody);
      const idempotencyKey = recurring
        ? recurrenceRequest.current?.fingerprint === requestFingerprint
          ? recurrenceRequest.current.idempotencyKey
          : crypto.randomUUID()
        : undefined;
      if (idempotencyKey) {
        recurrenceRequest.current = {
          fingerprint: requestFingerprint,
          idempotencyKey,
        };
      }
      const { workOrder } = await api.workOrders.create(
        createBody,
        { idempotencyKey },
      );
      router.push(`/app/work/detail?id=${workOrder.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-xl font-bold">작업 등록</h1>
      {sourceWorkOrderId && (
        <p className="mt-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
          {prefillLoading
            ? "이전 작업 정보를 불러오는 중…"
            : "이전 작업의 현장·장비·담당자를 불러왔습니다. 저장 전 내용을 확인해주세요."}
        </p>
      )}
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
          <p className="mt-2 text-xs text-muted">
            담당자 없이 초안으로 저장하거나, 한 명 이상 선택해 바로 예정 작업으로 배정할 수 있습니다.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-bg-2 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-primary"
              checked={recurring}
              onChange={(event) => setRecurring(event.target.checked)}
            />
            <span>
              <span className="block text-sm font-semibold">
                정기점검 일정으로 반복
              </span>
              <span className="mt-1 block text-xs text-muted">
                첫 작업을 등록하고, 운영 화면에서 향후 작업을 안전하게 일괄 생성합니다.
              </span>
            </span>
          </label>
          {recurring && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm">
                주기
                <select
                  className="input"
                  value={recurrence.frequency}
                  onChange={(event) =>
                    setRecurrence({
                      ...recurrence,
                      frequency: event.target.value as MaintenanceFrequency,
                    })
                  }
                >
                  <option value="weekly">주</option>
                  <option value="monthly">개월</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                간격
                <input
                  type="number"
                  min={1}
                  max={60}
                  className="input"
                  value={recurrence.intervalCount}
                  onChange={(event) =>
                    setRecurrence({
                      ...recurrence,
                      intervalCount: event.target.value,
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                종료일 (선택)
                <input
                  type="date"
                  min={form.scheduledDate}
                  className="input"
                  value={recurrence.endDate}
                  onChange={(event) =>
                    setRecurrence({
                      ...recurrence,
                      endDate: event.target.value,
                    })
                  }
                />
              </label>
            </div>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            onClick={() => onSubmit("draft")}
            disabled={busy !== null}
            className="btn-ghost tap-target w-full rounded-lg py-3 font-medium"
          >
            {busy === "draft" ? "저장 중…" : "초안으로 저장"}
          </button>
          <button
            onClick={() => onSubmit("schedule")}
            disabled={busy !== null}
            className="btn-primary tap-target w-full rounded-lg py-3 font-medium"
          >
            {busy === "schedule"
              ? "배정 중…"
              : recurring
                ? "첫 작업·반복 일정 등록"
                : "담당자 배정·등록"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewWorkOrderPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-center text-muted">불러오는 중…</div>}
    >
      <NewWorkOrderContent />
    </Suspense>
  );
}
