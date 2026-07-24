"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState, type FormEvent } from "react";
import {
  opsApi,
  type OpsOrgDetail,
  type OpsOrgUsage,
  type OpsTemplate,
} from "@/lib/opsApi";

function formatTimestamp(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / 1024 ** exponent;
  const rounded = exponent === 0 ? value : Math.round(value * 10) / 10;
  return `${rounded.toLocaleString("ko-KR")} ${units[exponent]}`;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "관리자",
  office: "사무",
  field: "현장",
};

function UsageCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white px-4 py-3">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function OrgDetailContent() {
  const id = useSearchParams().get("id") ?? "";

  const [detail, setDetail] = useState<OpsOrgDetail | null>(null);
  const [usage, setUsage] = useState<OpsOrgUsage | null>(null);
  const [templates, setTemplates] = useState<OpsTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 템플릿 업로드 폼
  const [templateName, setTemplateName] = useState("");
  const [templateConfig, setTemplateConfig] = useState("{\n  \n}");
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [templateBusy, setTemplateBusy] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  // 데이터 내보내기
  const [exportError, setExportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"csv" | "json" | null>(null);

  // 작업 재처리
  const [reprocessId, setReprocessId] = useState("");
  const [reprocessTarget, setReprocessTarget] = useState<"ai" | "pdf">("ai");
  const [reprocessBusy, setReprocessBusy] = useState(false);
  const [reprocessError, setReprocessError] = useState<string | null>(null);
  const [reprocessResult, setReprocessResult] = useState<{
    target: "ai" | "pdf";
    resetCount: number;
  } | null>(null);

  const loadTemplates = useCallback(() => {
    if (!id) return;
    opsApi.templates
      .list(id)
      .then((res) => setTemplates(res.templates))
      .catch((err) =>
        setTemplateError(
          err instanceof Error ? err.message : "템플릿을 불러오지 못했습니다",
        ),
      );
  }, [id]);

  useEffect(() => {
    if (!id) return;
    opsApi
      .org(id)
      .then(setDetail)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "불러오기에 실패했습니다"),
      );
    opsApi
      .usage(id)
      .then(setUsage)
      .catch(() => {
        // 사용량 조회 실패는 치명적이지 않다 — 카드에서 '-'로 표시.
      });
    loadTemplates();
  }, [id, loadTemplates]);

  async function onUploadTemplate(e: FormEvent) {
    e.preventDefault();
    setTemplateError(null);
    if (!templateName.trim()) {
      setTemplateError("템플릿 이름을 입력해주세요");
      return;
    }
    let config: unknown;
    try {
      config = JSON.parse(templateConfig);
    } catch {
      setTemplateError("config 가 올바른 JSON 형식이 아닙니다");
      return;
    }
    setTemplateBusy(true);
    try {
      await opsApi.templates.create(id, { name: templateName.trim(), config });
      setTemplateName("");
      setTemplateConfig("{\n  \n}");
      loadTemplates();
    } catch (err) {
      setTemplateError(
        err instanceof Error ? err.message : "템플릿 업로드에 실패했습니다",
      );
    } finally {
      setTemplateBusy(false);
    }
  }

  async function onActivateTemplate(templateId: string) {
    setTemplateError(null);
    setActivatingId(templateId);
    try {
      await opsApi.templates.activate(id, templateId);
      loadTemplates();
    } catch (err) {
      setTemplateError(
        err instanceof Error ? err.message : "템플릿 활성화에 실패했습니다",
      );
    } finally {
      setActivatingId(null);
    }
  }

  async function onExport(format: "csv" | "json") {
    setExportError(null);
    setExporting(format);
    try {
      await opsApi.export(id, format);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : "내보내기에 실패했습니다",
      );
    } finally {
      setExporting(null);
    }
  }

  async function onReprocess(e: FormEvent) {
    e.preventDefault();
    setReprocessError(null);
    setReprocessResult(null);
    if (!reprocessId.trim()) {
      setReprocessError("작업 ID를 입력해주세요");
      return;
    }
    setReprocessBusy(true);
    try {
      const res = await opsApi.reprocess(reprocessId.trim(), reprocessTarget);
      setReprocessResult({ target: res.target, resetCount: res.resetCount });
    } catch (err) {
      setReprocessError(
        err instanceof Error ? err.message : "재처리에 실패했습니다",
      );
    } finally {
      setReprocessBusy(false);
    }
  }

  if (!id) {
    return (
      <p className="card p-4 text-sm text-muted">조직 ID가 지정되지 않았습니다.</p>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <Link href="/ops" className="text-sm text-primary hover:underline">
          ← 조직 목록
        </Link>
        <p className="card border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      </div>
    );
  }

  if (!detail) {
    return <p className="text-sm text-muted">불러오는 중…</p>;
  }

  const profile = detail.profile;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link href="/ops" className="text-sm text-primary hover:underline">
          ← 조직 목록
        </Link>
        <h1 className="text-lg font-bold">{detail.org.name}</h1>
        <p className="text-xs text-muted">
          ID {detail.org.id} · 생성 {formatTimestamp(detail.org.created_at)}
        </p>
      </div>

      {/* (a) 프로필 + 멤버 */}
      <section className="card space-y-4 p-4">
        <h2 className="font-semibold">프로필</h2>
        {profile ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-4 border-b border-line py-1.5 sm:border-0">
              <dt className="text-muted">사업자번호</dt>
              <dd className="text-right">{profile.businessNo ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-line py-1.5 sm:border-0">
              <dt className="text-muted">담당자</dt>
              <dd className="text-right">{profile.contactName ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-line py-1.5 sm:border-0">
              <dt className="text-muted">연락처</dt>
              <dd className="text-right">{profile.contactPhone ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-line py-1.5 sm:border-0">
              <dt className="text-muted">이메일</dt>
              <dd className="text-right">{profile.contactEmail ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-line py-1.5 sm:border-0">
              <dt className="text-muted">주소</dt>
              <dd className="text-right">{profile.address ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-line py-1.5 sm:border-0">
              <dt className="text-muted">로고</dt>
              <dd className="text-right">{profile.hasLogo ? "있음" : "없음"}</dd>
            </div>
            <div className="flex justify-between gap-4 py-1.5">
              <dt className="text-muted">수정일</dt>
              <dd className="text-right">{formatTimestamp(profile.updatedAt)}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted">프로필 정보가 없습니다.</p>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-ink-dim">
            멤버 {detail.members.length.toLocaleString("ko-KR")}명
          </h3>
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-3 py-2 font-medium">이름</th>
                  <th className="px-3 py-2 font-medium">역할</th>
                  <th className="px-3 py-2 font-medium">상태</th>
                  <th className="px-3 py-2 font-medium">가입일</th>
                </tr>
              </thead>
              <tbody>
                {detail.members.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-muted">
                      멤버가 없습니다
                    </td>
                  </tr>
                ) : (
                  detail.members.map((member, index) => (
                    <tr
                      key={`${member.name}-${index}`}
                      className="border-b border-line last:border-0"
                    >
                      <td className="px-3 py-2">{member.name}</td>
                      <td className="px-3 py-2 text-ink-dim">
                        {ROLE_LABELS[member.role] ?? member.role}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            member.active
                              ? "rounded-full bg-done/10 px-2 py-0.5 text-xs font-medium text-done"
                              : "rounded-full bg-bg-2 px-2 py-0.5 text-xs font-medium text-muted"
                          }
                        >
                          {member.active ? "활성" : "비활성"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-ink-dim">
                        {formatTimestamp(member.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* (b) 사용량 */}
      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">사용량</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <UsageCard
            label="작업 수"
            value={usage ? usage.workOrders.toLocaleString("ko-KR") : "-"}
          />
          <UsageCard
            label="보고서 수"
            value={usage ? usage.reports.toLocaleString("ko-KR") : "-"}
          />
          <UsageCard
            label="저장량"
            value={usage ? formatBytes(usage.storageBytes) : "-"}
          />
          <UsageCard
            label="사진 수"
            value={usage ? usage.photoCount.toLocaleString("ko-KR") : "-"}
          />
          <UsageCard
            label="음성(분)"
            value={usage ? usage.voiceMinutes.toLocaleString("ko-KR") : "-"}
          />
        </div>
      </section>

      {/* (c) 템플릿 */}
      <section className="card space-y-4 p-4">
        <h2 className="font-semibold">보고서 템플릿</h2>
        {templateError && (
          <p className="text-sm text-red-600">{templateError}</p>
        )}
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-3 py-2 font-medium">버전</th>
                <th className="px-3 py-2 font-medium">이름</th>
                <th className="px-3 py-2 font-medium">상태</th>
                <th className="px-3 py-2 font-medium">업로드</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted">
                    템플릿이 없습니다
                  </td>
                </tr>
              ) : (
                templates.map((template) => (
                  <tr
                    key={template.id}
                    className="border-b border-line last:border-0"
                  >
                    <td className="px-3 py-2 tabular-nums">v{template.version}</td>
                    <td className="px-3 py-2">{template.name}</td>
                    <td className="px-3 py-2">
                      {template.active ? (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          활성
                        </span>
                      ) : (
                        <span className="text-xs text-muted">비활성</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-ink-dim">
                      <div>{formatTimestamp(template.uploadedAt)}</div>
                      {template.uploadedBy && (
                        <div className="text-xs text-muted">
                          {template.uploadedBy}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {!template.active && (
                        <button
                          type="button"
                          onClick={() => void onActivateTemplate(template.id)}
                          disabled={activatingId === template.id}
                          className="btn-ghost rounded-lg px-3 py-1.5 text-xs"
                        >
                          {activatingId === template.id ? "활성화 중…" : "활성화"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <form
          onSubmit={onUploadTemplate}
          className="space-y-3 rounded-lg border border-line bg-bg-2 p-3"
        >
          <h3 className="text-sm font-medium text-ink-dim">새 템플릿 업로드</h3>
          <label className="flex flex-col gap-1 text-sm">
            이름
            <input
              className="input"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="예: 기본 점검 보고서"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            config (JSON)
            <textarea
              className="input min-h-32 font-mono text-xs"
              value={templateConfig}
              onChange={(e) => setTemplateConfig(e.target.value)}
              spellCheck={false}
            />
          </label>
          <button
            type="submit"
            disabled={templateBusy}
            className="btn-primary rounded-lg px-4 py-2 text-sm font-medium"
          >
            {templateBusy ? "업로드 중…" : "업로드"}
          </button>
        </form>
      </section>

      {/* (d) 데이터 내보내기 */}
      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">데이터 내보내기</h2>
        <p className="text-sm text-muted">
          이 조직의 데이터를 파일로 내려받습니다.
        </p>
        {exportError && <p className="text-sm text-red-600">{exportError}</p>}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void onExport("json")}
            disabled={exporting !== null}
            className="btn-ghost rounded-lg px-4 py-2 text-sm"
          >
            {exporting === "json" ? "내보내는 중…" : "JSON 내보내기"}
          </button>
          <button
            type="button"
            onClick={() => void onExport("csv")}
            disabled={exporting !== null}
            className="btn-ghost rounded-lg px-4 py-2 text-sm"
          >
            {exporting === "csv" ? "내보내는 중…" : "CSV 내보내기"}
          </button>
        </div>
      </section>

      {/* (e) 작업 재처리 */}
      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">작업 재처리</h2>
        <p className="text-sm text-muted">
          작업의 AI 초안 또는 PDF 산출물 상태를 초기화하여 재처리합니다.
        </p>
        <form onSubmit={onReprocess} className="space-y-3">
          <label className="flex flex-col gap-1 text-sm">
            작업 ID
            <input
              className="input"
              value={reprocessId}
              onChange={(e) => setReprocessId(e.target.value)}
              placeholder="작업(Work Order) ID"
            />
          </label>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="reprocess-target"
                checked={reprocessTarget === "ai"}
                onChange={() => setReprocessTarget("ai")}
              />
              AI 초안
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="reprocess-target"
                checked={reprocessTarget === "pdf"}
                onChange={() => setReprocessTarget("pdf")}
              />
              PDF
            </label>
          </div>
          {reprocessError && (
            <p className="text-sm text-red-600">{reprocessError}</p>
          )}
          {reprocessResult && (
            <p className="text-sm text-done">
              재처리 완료 — {reprocessResult.target === "ai" ? "AI 초안" : "PDF"}{" "}
              {reprocessResult.resetCount.toLocaleString("ko-KR")}건 초기화됨
            </p>
          )}
          <button
            type="submit"
            disabled={reprocessBusy}
            className="btn-primary rounded-lg px-4 py-2 text-sm font-medium"
          >
            {reprocessBusy ? "재처리 중…" : "재처리 실행"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default function OpsOrgDetailPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-center text-muted">불러오는 중…</div>}
    >
      <OrgDetailContent />
    </Suspense>
  );
}
