"use client";

import type { MaintenanceSchedule, Member } from "@fieldstep/shared";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  api,
  type MaintenanceScheduleSyncResult,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

type InitialSyncEntry = {
  completed: boolean;
  promise: Promise<MaintenanceScheduleSyncResult> | null;
};

const initialSyncByOrganization = new Map<string, InitialSyncEntry>();

function syncMaintenanceSchedules(
  orgId: string,
  force: boolean,
): Promise<MaintenanceScheduleSyncResult | null> {
  const entry = initialSyncByOrganization.get(orgId) ?? {
    completed: false,
    promise: null,
  };
  initialSyncByOrganization.set(orgId, entry);
  if (entry.promise) return entry.promise;
  if (!force && entry.completed) return Promise.resolve(null);

  const promise = api.maintenanceSchedules
    .sync({ horizonDays: 90, rowCap: 50 })
    .then((result) => {
      entry.completed = !result.limitReached;
      return result;
    })
    .finally(() => {
      entry.promise = null;
    });
  entry.promise = promise;
  return promise;
}

const STATUS_LABELS: Record<MaintenanceSchedule["status"], string> = {
  active: "운영 중",
  paused: "일시중지",
  completed: "종료",
  canceled: "취소",
};

const STATUS_STYLES: Record<MaintenanceSchedule["status"], string> = {
  active: "bg-emerald-50 text-emerald-700",
  paused: "bg-amber-50 text-amber-700",
  completed: "bg-slate-100 text-slate-600",
  canceled: "bg-red-50 text-red-700",
};

function recurrenceLabel(schedule: MaintenanceSchedule): string {
  const unit = schedule.frequency === "weekly" ? "주" : "개월";
  return `${schedule.intervalCount}${unit}마다`;
}

export default function MaintenanceSchedulesPage() {
  const { org } = useAuth();
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoSyncWarning, setAutoSyncWarning] = useState<string | null>(null);
  const [syncResult, setSyncResult] =
    useState<MaintenanceScheduleSyncResult | null>(null);

  const membersById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [scheduleResponse, memberResponse] = await Promise.all([
        api.maintenanceSchedules.list(),
        api.users(),
      ]);
      setSchedules(scheduleResponse.schedules);
      setMembers(memberResponse.members);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "정기점검 일정을 불러오지 못했습니다",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!org?.id) return;
    let canceled = false;
    void syncMaintenanceSchedules(org.id, false)
      .then((result) => {
        if (
          !canceled &&
          result &&
          (result.generated > 0 ||
            result.blockedCount > 0 ||
            result.limitReached)
        ) {
          setSyncResult(result);
        }
      })
      .catch(() => {
        if (!canceled) {
          setAutoSyncWarning(
            "향후 작업 자동 생성에 실패했습니다. 일정 목록은 계속 확인할 수 있으며, 위 버튼으로 다시 시도할 수 있습니다.",
          );
        }
      })
      .finally(() => {
        if (!canceled) void load();
      });
    return () => {
      canceled = true;
    };
  }, [load, org?.id]);

  async function syncUpcoming() {
    setBusy("sync");
    setError(null);
    setAutoSyncWarning(null);
    try {
      const result = org?.id
        ? await syncMaintenanceSchedules(org.id, true)
        : await api.maintenanceSchedules.sync({
            horizonDays: 90,
            rowCap: 50,
          });
      if (!result) return;
      setSyncResult(result);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "향후 작업 생성에 실패했습니다",
      );
    } finally {
      setBusy(null);
    }
  }

  async function changeStatus(
    schedule: MaintenanceSchedule,
    action: "pause" | "resume" | "cancel",
  ) {
    if (
      action === "cancel" &&
      !window.confirm(
        "이 정기점검 일정을 취소할까요? 이미 생성된 작업은 유지됩니다.",
      )
    ) {
      return;
    }
    setBusy(schedule.id);
    setError(null);
    try {
      await api.maintenanceSchedules.update(schedule.id, action);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "일정 상태를 변경하지 못했습니다",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">정기점검</h1>
          <p className="mt-1 text-sm text-muted">
            반복 일정을 관리하고 90일 이내의 작업을 미리 생성합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/app/work/new"
            className="btn-ghost rounded-lg px-4 py-2 text-sm font-medium"
          >
            반복 일정 등록
          </Link>
          <button
            type="button"
            onClick={() => void syncUpcoming()}
            disabled={busy !== null}
            className="btn-primary rounded-lg px-4 py-2 text-sm font-medium"
          >
            {busy === "sync" ? "생성 중…" : "향후 90일 작업 생성"}
          </button>
        </div>
      </div>

      {syncResult && (
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            syncResult.blockedCount > 0
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <p className="font-semibold">
            작업 {syncResult.generated}건 생성 · 담당 {syncResult.assignedCount}
            건 배정
          </p>
          <p className="mt-1">
            생성 기준일 {syncResult.horizonDate}
            {syncResult.limitReached
              ? " · 한 번의 생성 한도에 도달했습니다. 다시 실행해주세요."
              : ""}
          </p>
          {syncResult.blockedSchedules.map((blocked) => (
            <p key={blocked.scheduleId} className="mt-1">
              중지됨 · {blocked.nextOccurrenceDate} · {blocked.message}
            </p>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {autoSyncWarning && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {autoSyncWarning}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-center text-sm text-muted">불러오는 중…</p>
      ) : schedules.length === 0 ? (
        <div className="card mt-6 p-8 text-center">
          <p className="font-medium">등록된 정기점검 일정이 없습니다</p>
          <p className="mt-1 text-sm text-muted">
            작업 등록에서 ‘정기점검 일정으로 반복’을 선택해 시작하세요.
          </p>
          <Link
            href="/app/work/new"
            className="btn-primary mt-4 inline-flex rounded-lg px-4 py-2 text-sm font-medium"
          >
            첫 반복 일정 등록
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {schedules.map((schedule) => {
            const inactiveAssigneeIds = schedule.assigneeIds.filter(
              (id) => !membersById.get(id)?.active,
            );
            const assigneeNames = schedule.assigneeIds.map(
              (id) => {
                const member = membersById.get(id);
                if (!member) return "삭제된 담당자 (비활성)";
                return member.active
                  ? member.name
                  : `${member.name} (비활성)`;
              },
            );
            return (
              <article key={schedule.id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-muted">
                      {schedule.customerName} · {schedule.siteName}
                    </p>
                    <h2 className="mt-1 truncate font-semibold">
                      {schedule.workType}
                    </h2>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[schedule.status]}`}
                  >
                    {STATUS_LABELS[schedule.status]}
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted">반복</dt>
                    <dd className="mt-1 font-medium">
                      {recurrenceLabel(schedule)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">다음 작업일</dt>
                    <dd className="mt-1 font-medium">
                      {schedule.nextOccurrenceDate ?? "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">종료일</dt>
                    <dd className="mt-1">{schedule.endDate ?? "계속 운영"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">담당자</dt>
                    <dd className="mt-1">
                      {assigneeNames.join(", ") || "-"}
                    </dd>
                  </div>
                </dl>

                {inactiveAssigneeIds.length > 0 && (
                  <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    비활성 담당자는 향후 생성되는 작업의 배정에서 제외됩니다.
                  </p>
                )}

                {schedule.lastErrorMessage && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    <p className="font-semibold">확인이 필요합니다</p>
                    <p className="mt-1">{schedule.lastErrorMessage}</p>
                    <p className="mt-1 text-xs">
                      기준정보 또는 담당자를 활성화한 뒤 재개해주세요.
                    </p>
                  </div>
                )}

                {schedule.occurrences.length > 0 && (
                  <div className="mt-4 border-t border-line pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      최근 생성 작업
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {schedule.occurrences.slice(0, 3).map((occurrence) => (
                        <Link
                          key={occurrence.id}
                          href={`/app/work/detail?id=${occurrence.workOrderId}`}
                          className="rounded-lg bg-bg-2 px-2.5 py-1.5 text-xs font-medium hover:text-primary"
                        >
                          {occurrence.occurrenceDate}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
                  <Link
                    href={`/app/work/detail?id=${schedule.sourceWorkOrderId}`}
                    className="text-sm text-primary hover:underline"
                  >
                    최초 작업 보기
                  </Link>
                  <div className="flex gap-2">
                    {schedule.status === "active" && (
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => void changeStatus(schedule, "pause")}
                        className="btn-ghost rounded-lg px-3 py-1.5 text-sm"
                      >
                        일시중지
                      </button>
                    )}
                    {schedule.status === "paused" && (
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => void changeStatus(schedule, "resume")}
                        className="btn-primary rounded-lg px-3 py-1.5 text-sm"
                      >
                        재개
                      </button>
                    )}
                    {(schedule.status === "active" ||
                      schedule.status === "paused") && (
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => void changeStatus(schedule, "cancel")}
                        className="rounded-lg px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                      >
                        취소
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
