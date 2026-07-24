"use client";

import {
  CRM_IMPORT_COLUMNS,
  CRM_IMPORT_MAX_BYTES,
  CRM_IMPORT_MAX_ROWS,
  createCrmImportTemplate,
  type Asset,
  type AssetPhoto,
  type CrmImportResult,
  type CrmImportTemplateLanguage,
  type Customer,
  type Site,
  type WorkOrderSummary,
} from "@fieldstep/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { ProtectedImage } from "@/components/ProtectedMedia";
import { RecoverableError } from "@/components/RecoverableError";
import { WorkStatusBadge } from "@/components/StatusBadge";

type Tab = "customers" | "sites" | "assets";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function compressAssetImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const sourceUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      reject(new Error("이미지를 처리하지 못했습니다"));
    };
    image.onload = () => {
      URL.revokeObjectURL(sourceUrl);
      const scale = Math.min(1, 1280 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("이미지 캔버스를 사용할 수 없습니다"));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("이미지를 압축하지 못했습니다"));
        },
        "image/jpeg",
        0.7,
      );
    };
    image.src = sourceUrl;
  });
}

function downloadCsvTemplate(language: CrmImportTemplateLanguage): void {
  const blob = new Blob([createCrmImportTemplate(language)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    language === "ko"
      ? "현장완료_CRM_가져오기_템플릿.csv"
      : "fieldstep_crm_import_template.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function CountCell({
  label,
  created,
  reused,
}: {
  label: string;
  created: number;
  reused: number;
}) {
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold">
        신규 {created.toLocaleString("ko-KR")}
        <span className="ml-2 font-normal text-muted">
          기존 {reused.toLocaleString("ko-KR")}
        </span>
      </p>
    </div>
  );
}

function CsvImportPanel({ onImported }: { onImported: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CrmImportResult | null>(null);

  function selectFile(nextFile: File | null) {
    setFile(nextFile);
    setIdempotencyKey(nextFile ? crypto.randomUUID() : "");
    setProgress(0);
    setResult(null);
    if (!nextFile) {
      setError(null);
      return;
    }
    if (!nextFile.name.toLowerCase().endsWith(".csv")) {
      setError("확장자가 .csv인 파일을 선택해주세요.");
      return;
    }
    if (nextFile.size > CRM_IMPORT_MAX_BYTES) {
      setError(
        `파일 크기는 최대 ${Math.floor(CRM_IMPORT_MAX_BYTES / 1024 / 1024)}MB입니다.`,
      );
      return;
    }
    setError(null);
  }

  async function upload() {
    if (!file || !idempotencyKey) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("확장자가 .csv인 파일을 선택해주세요.");
      return;
    }
    if (file.size > CRM_IMPORT_MAX_BYTES) {
      setError(
        `파일 크기는 최대 ${Math.floor(CRM_IMPORT_MAX_BYTES / 1024 / 1024)}MB입니다.`,
      );
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);
    setProgress(0);
    try {
      const response = await api.crmImports.upload(file, {
        idempotencyKey,
        onProgress: setProgress,
      });
      setResult(response.import);
      if (response.import.succeededRows > 0) onImported();
    } catch (uploadError) {
      setError(
        getErrorMessage(uploadError, "CSV 파일을 가져오지 못했습니다"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="mt-5 overflow-hidden rounded-xl border border-line bg-white shadow-sm"
      aria-labelledby="crm-import-title"
    >
      <div className="border-l-4 border-l-primary px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-primary">
              초기 데이터 일괄 등록
            </p>
            <h2 id="crm-import-title" className="mt-1 text-base font-bold">
              고객사·현장·장비 CSV 가져오기
            </h2>
            <p className="mt-1 text-sm text-muted">
              고객사명은 필수입니다. 현장과 장비는 필요한 단계까지만 채워
              최대 {CRM_IMPORT_MAX_ROWS.toLocaleString("ko-KR")}행을 한 번에
              등록할 수 있습니다.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              className="btn-ghost rounded-lg px-3 py-2 text-sm font-medium"
              onClick={() => downloadCsvTemplate("ko")}
            >
              한국어 템플릿
            </button>
            <button
              type="button"
              className="btn-ghost rounded-lg px-3 py-2 text-sm font-medium"
              onClick={() => downloadCsvTemplate("en")}
            >
              English template
            </button>
          </div>
        </div>

        <details className="mt-3 rounded-lg bg-bg-2 px-3 py-2 text-sm">
          <summary className="cursor-pointer font-medium">
            템플릿 열과 작성 규칙
          </summary>
          <p className="mt-2 text-xs leading-5 text-muted">
            같은 조직 안에서 고객사명, 고객사별 현장명, 현장별 장비명이
            같으면 기존 항목을 재사용합니다. 쉼표나 줄바꿈이 포함된 값은
            템플릿을 저장한 프로그램이 자동으로 큰따옴표 처리하도록
            두세요. 설치일은 YYYY-MM-DD 형식입니다.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {CRM_IMPORT_COLUMNS.map((column) => (
              <span
                key={column.key}
                className="rounded border border-line bg-white px-2 py-1 text-xs"
              >
                {column.ko}
                {column.required && (
                  <span className="ml-1 font-semibold text-primary">필수</span>
                )}
                <span className="ml-1.5 font-mono text-[11px] text-muted">
                  {column.en}
                </span>
              </span>
            ))}
          </div>
        </details>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block text-sm font-medium">
            CSV 파일
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv,application/csv"
              className="input mt-1 block w-full cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-bg-2 file:px-3 file:py-1.5 file:text-sm file:font-medium"
              disabled={busy}
              onChange={(event) =>
                selectFile(event.target.files?.[0] ?? null)
              }
            />
          </label>
          <button
            type="button"
            className="btn-primary min-h-11 rounded-lg px-5 py-2 text-sm font-semibold"
            disabled={busy || !file || Boolean(error)}
            onClick={() => void upload()}
          >
            {busy ? "가져오는 중…" : "CSV 가져오기"}
          </button>
        </div>

        {busy && (
          <div className="mt-3" role="status" aria-live="polite">
            <div className="mb-1 flex justify-between text-xs text-muted">
              <span>{progress < 100 ? "파일 업로드 중" : "행 검증·저장 중"}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-bg-2">
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div
            className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4" aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">
                총 {result.totalRows.toLocaleString("ko-KR")}행 중{" "}
                <span className="text-primary">
                  {result.succeededRows.toLocaleString("ko-KR")}행 성공
                </span>
                {result.failedRows > 0 && (
                  <span className="ml-2 text-red-700">
                    {result.failedRows.toLocaleString("ko-KR")}행 실패
                  </span>
                )}
              </p>
              {result.idempotentReplay && (
                <span className="rounded-full bg-bg-2 px-2.5 py-1 text-xs text-muted">
                  이전 처리 결과를 안전하게 다시 표시함
                </span>
              )}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <CountCell
                label="고객사"
                created={result.created.customers}
                reused={result.reused.customers}
              />
              <CountCell
                label="현장"
                created={result.created.sites}
                reused={result.reused.sites}
              />
              <CountCell
                label="장비"
                created={result.created.assets}
                reused={result.reused.assets}
              />
            </div>

            {result.errors.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold">확인이 필요한 오류 행</p>
                <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-line">
                  <table className="w-full min-w-[28rem] text-left text-sm">
                    <thead className="sticky top-0 bg-bg-2">
                      <tr>
                        <th className="w-24 px-3 py-2 font-medium">원본 행</th>
                        <th className="px-3 py-2 font-medium">오류 원인</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((rowError) => (
                        <tr
                          key={`${rowError.row}-${rowError.reason}`}
                          className="border-t border-line"
                        >
                          <td className="px-3 py-2 font-mono">
                            {rowError.row}
                          </td>
                          <td className="px-3 py-2 text-red-800">
                            {rowError.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default function MastersPage() {
  const [tab, setTab] = useState<Tab>("customers");
  const [dataRevision, setDataRevision] = useState(0);
  return (
    <div>
      <h1 className="text-xl font-bold">고객사 / 현장 / 장비</h1>
      <CsvImportPanel
        onImported={() => setDataRevision((revision) => revision + 1)}
      />
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
        {tab === "customers" && (
          <CustomersTab key={`customers-${dataRevision}`} />
        )}
        {tab === "sites" && <SitesTab key={`sites-${dataRevision}`} />}
        {tab === "assets" && <AssetsTab key={`assets-${dataRevision}`} />}
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await api.customers.list(q || undefined);
      setList(result.customers);
    } catch (error) {
      setLoadError(getErrorMessage(error, "고객사 목록을 불러오지 못했습니다"));
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

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
    setSaveError(null);
    try {
      if (editing) await api.customers.patch(editing, form);
      else await api.customers.create(form);
      setForm({ name: "", bizNo: "", address: "", contactName: "", contactPhone: "", memo: "" });
      setEditing(null);
      await load();
    } catch (error) {
      setSaveError(getErrorMessage(error, "고객사를 저장하지 못했습니다"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="card space-y-2 p-4 lg:col-span-2">
        <input
          aria-label="고객사 검색"
          className="input w-full"
          placeholder="고객사 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {loadError && (
          <RecoverableError
            title="고객사 목록을 불러오지 못했습니다"
            message={loadError}
            onRetry={() => void load()}
          />
        )}
        <table className="mt-2 w-full text-sm">
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="cursor-pointer border-b border-line hover:bg-bg-2" onClick={() => startEdit(c)}>
                <td className="py-2">{c.name}</td>
                <td className="py-2 text-muted">{c.contactName ?? "-"}</td>
                <td className="py-2 text-muted">{c.contactPhone ?? "-"}</td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-muted">
                  고객사를 불러오는 중…
                </td>
              </tr>
            )}
            {!loading && !loadError && list.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-muted">고객사가 없습니다</td>
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
        {saveError && (
          <RecoverableError
            title="고객사를 저장하지 못했습니다"
            message={saveError}
            nextAction="입력 내용을 확인한 뒤 저장을 다시 시도해주세요."
            onRetry={() => void save()}
            retryLabel="저장 다시 시도"
          />
        )}
        <div className="flex gap-2">
          <button onClick={save} disabled={busy || !form.name} className="btn-primary flex-1 rounded-lg py-2 text-sm font-medium">
            {busy ? "저장 중…" : "저장"}
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
  const [customersLoading, setCustomersLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    setCustomersLoading(true);
    setCustomersError(null);
    try {
      const result = await api.customers.list();
      setCustomers(result.customers);
    } catch (error) {
      setCustomersError(getErrorMessage(error, "고객사 선택 목록을 불러오지 못했습니다"));
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  const loadSites = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const result = await api.sites.list(customerId || undefined);
      setList(result.sites);
    } catch (error) {
      setListError(getErrorMessage(error, "현장 목록을 불러오지 못했습니다"));
    } finally {
      setListLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);
  useEffect(() => {
    void loadSites();
  }, [loadSites]);

  function startEdit(s: Site) {
    setEditing(s.id);
    setForm({ customerId: s.customerId, name: s.name, address: s.address ?? "", accessInfo: s.accessInfo ?? "", mapUrl: s.mapUrl ?? "" });
  }

  async function save() {
    setBusy(true);
    setSaveError(null);
    try {
      if (editing) await api.sites.patch(editing, form);
      else await api.sites.create(form);
      setForm({ customerId: "", name: "", address: "", accessInfo: "", mapUrl: "" });
      setEditing(null);
      await loadSites();
    } catch (error) {
      setSaveError(getErrorMessage(error, "현장을 저장하지 못했습니다"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="card space-y-2 p-4 lg:col-span-2">
        <select
          aria-label="고객사로 현장 필터"
          className="input"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          disabled={customersLoading}
        >
          <option value="">전체 고객사</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {customersError && (
          <RecoverableError
            title="고객사 선택 목록을 불러오지 못했습니다"
            message={customersError}
            onRetry={() => void loadCustomers()}
          />
        )}
        {listError && (
          <RecoverableError
            title="현장 목록을 불러오지 못했습니다"
            message={listError}
            onRetry={() => void loadSites()}
          />
        )}
        <table className="mt-2 w-full text-sm">
          <tbody>
            {list.map((s) => (
              <tr key={s.id} className="cursor-pointer border-b border-line hover:bg-bg-2" onClick={() => startEdit(s)}>
                <td className="py-2">{s.name}</td>
                <td className="py-2 text-muted">{s.address ?? "-"}</td>
              </tr>
            ))}
            {listLoading && (
              <tr>
                <td colSpan={2} className="py-4 text-center text-muted">
                  현장을 불러오는 중…
                </td>
              </tr>
            )}
            {!listLoading && !listError && list.length === 0 && (
              <tr>
                <td colSpan={2} className="py-4 text-center text-muted">현장이 없습니다</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="card space-y-2 p-4">
        <p className="font-medium">{editing ? "현장 수정" : "현장 추가"}</p>
        <select
          aria-label="현장의 고객사"
          className="input w-full"
          value={form.customerId}
          onChange={(e) => setForm({ ...form, customerId: e.target.value })}
          disabled={customersLoading}
        >
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
        {saveError && (
          <RecoverableError
            title="현장을 저장하지 못했습니다"
            message={saveError}
            nextAction="입력 내용을 확인한 뒤 저장을 다시 시도해주세요."
            onRetry={() => void save()}
            retryLabel="저장 다시 시도"
          />
        )}
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={busy || !form.name || !form.customerId}
            className="btn-primary flex-1 rounded-lg py-2 text-sm font-medium"
          >
            {busy ? "저장 중…" : "저장"}
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
  const [historyTarget, setHistoryTarget] = useState<Asset | null>(null);
  const [photos, setPhotos] = useState<AssetPhoto[]>([]);
  const [photosTarget, setPhotosTarget] = useState<Asset | null>(null);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [sitesError, setSitesError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [photosError, setPhotosError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const listRequestId = useRef(0);
  const historyRequestId = useRef(0);
  const photosRequestId = useRef(0);
  const photoOperationId = useRef(0);
  const selectedPhotoAssetId = useRef<string | null>(null);

  const loadSites = useCallback(async () => {
    setSitesLoading(true);
    setSitesError(null);
    try {
      const result = await api.sites.list();
      setSites(result.sites);
    } catch (error) {
      setSitesError(getErrorMessage(error, "현장 선택 목록을 불러오지 못했습니다"));
    } finally {
      setSitesLoading(false);
    }
  }, []);

  const loadAssets = useCallback(async () => {
    const requestId = ++listRequestId.current;
    if (!siteId) {
      setList([]);
      setListError(null);
      setListLoading(false);
      return;
    }
    setListLoading(true);
    setListError(null);
    try {
      const result = await api.assets.list(siteId);
      if (listRequestId.current !== requestId) return;
      setList(result.assets);
    } catch (error) {
      if (listRequestId.current !== requestId) return;
      setListError(getErrorMessage(error, "장비 목록을 불러오지 못했습니다"));
    } finally {
      if (listRequestId.current === requestId) {
        setListLoading(false);
      }
    }
  }, [siteId]);

  useEffect(() => {
    void loadSites();
  }, [loadSites]);
  useEffect(() => {
    historyRequestId.current += 1;
    photosRequestId.current += 1;
    photoOperationId.current += 1;
    selectedPhotoAssetId.current = null;
    setHistory(null);
    setHistoryTarget(null);
    setHistoryLoading(false);
    setHistoryError(null);
    setPhotos([]);
    setPhotosTarget(null);
    setPhotosLoading(false);
    setPhotoBusy(false);
    setPhotosError(null);
    void loadAssets();
  }, [loadAssets]);

  function startEdit(a: Asset) {
    setEditing(a.id);
    setForm({ siteId: a.siteId, name: a.name, model: a.model ?? "", serialNo: a.serialNo ?? "", installedAt: a.installedAt ?? "" });
  }

  async function save() {
    setBusy(true);
    setSaveError(null);
    try {
      if (editing) await api.assets.patch(editing, form);
      else await api.assets.create(form);
      setForm({ siteId, name: "", model: "", serialNo: "", installedAt: "" });
      setEditing(null);
      if (siteId) await loadAssets();
    } catch (error) {
      setSaveError(getErrorMessage(error, "장비를 저장하지 못했습니다"));
    } finally {
      setBusy(false);
    }
  }

  async function loadHistory(a: Asset) {
    const requestId = ++historyRequestId.current;
    setHistoryTarget(a);
    setHistory(null);
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const result = await api.assets.history(a.id);
      if (historyRequestId.current !== requestId) return;
      setHistory({ assetId: a.id, rows: result.workOrders });
    } catch (error) {
      if (historyRequestId.current !== requestId) return;
      setHistory(null);
      setHistoryError(getErrorMessage(error, "장비 작업 이력을 불러오지 못했습니다"));
    } finally {
      if (historyRequestId.current === requestId) {
        setHistoryLoading(false);
      }
    }
  }

  async function loadPhotos(a: Asset) {
    const requestId = ++photosRequestId.current;
    selectedPhotoAssetId.current = a.id;
    setPhotosTarget(a);
    setPhotos([]);
    setPhotosLoading(true);
    setPhotosError(null);
    try {
      const result = await api.assets.photos(a.id);
      if (photosRequestId.current !== requestId) return;
      setPhotos(result.photos);
    } catch (error) {
      if (photosRequestId.current !== requestId) return;
      setPhotos([]);
      setPhotosError(getErrorMessage(error, "장비 사진을 불러오지 못했습니다"));
    } finally {
      if (photosRequestId.current === requestId) {
        setPhotosLoading(false);
      }
    }
  }

  async function uploadPhoto(assetId: string, file: File) {
    const operationId = ++photoOperationId.current;
    setPhotoBusy(true);
    setPhotosError(null);
    try {
      const blob = await compressAssetImage(file);
      const result = await api.assets.addPhoto(assetId, { blob });
      if (
        photoOperationId.current !== operationId ||
        selectedPhotoAssetId.current !== assetId
      ) {
        return;
      }
      setPhotos((current) => [...current, result.photo]);
    } catch (error) {
      if (
        photoOperationId.current !== operationId ||
        selectedPhotoAssetId.current !== assetId
      ) {
        return;
      }
      setPhotosError(getErrorMessage(error, "장비 사진을 저장하지 못했습니다"));
    } finally {
      if (photoOperationId.current === operationId) {
        setPhotoBusy(false);
      }
    }
  }

  async function deletePhoto(assetId: string, photoId: string) {
    if (!window.confirm("이 장비 사진을 삭제할까요?")) return;
    const operationId = ++photoOperationId.current;
    setPhotoBusy(true);
    setPhotosError(null);
    try {
      await api.assets.deletePhoto(assetId, photoId);
      if (
        photoOperationId.current !== operationId ||
        selectedPhotoAssetId.current !== assetId
      ) {
        return;
      }
      setPhotos((current) => current.filter((photo) => photo.id !== photoId));
    } catch (error) {
      if (
        photoOperationId.current !== operationId ||
        selectedPhotoAssetId.current !== assetId
      ) {
        return;
      }
      setPhotosError(getErrorMessage(error, "장비 사진을 삭제하지 못했습니다"));
    } finally {
      if (photoOperationId.current === operationId) {
        setPhotoBusy(false);
      }
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="card space-y-2 p-4 lg:col-span-2">
        <select
          aria-label="장비를 조회할 현장"
          className="input"
          value={siteId}
          onChange={(event) => {
            listRequestId.current += 1;
            setList([]);
            setListError(null);
            setListLoading(Boolean(event.target.value));
            setSiteId(event.target.value);
          }}
          disabled={sitesLoading}
        >
          <option value="">현장 선택</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {sitesError && (
          <RecoverableError
            title="현장 선택 목록을 불러오지 못했습니다"
            message={sitesError}
            onRetry={() => void loadSites()}
          />
        )}
        {listError && (
          <RecoverableError
            title="장비 목록을 불러오지 못했습니다"
            message={listError}
            onRetry={() => void loadAssets()}
          />
        )}
        <table className="mt-2 w-full text-sm">
          <tbody>
            {list.map((a) => (
              <tr key={a.id} className="border-b border-line hover:bg-bg-2">
                <td className="cursor-pointer py-2" onClick={() => startEdit(a)}>
                  {a.name}
                </td>
                <td className="py-2 text-muted">{a.model ?? "-"}</td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => void loadPhotos(a)}
                    disabled={photoBusy}
                    className="tap-target text-primary hover:underline disabled:opacity-50"
                  >
                    사진
                  </button>
                </td>
                <td className="py-2 text-right">
                  <button onClick={() => void loadHistory(a)} className="tap-target text-primary hover:underline">
                    이력
                  </button>
                </td>
              </tr>
            ))}
            {listLoading && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-muted">
                  장비를 불러오는 중…
                </td>
              </tr>
            )}
            {siteId && !listLoading && !listError && list.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-muted">장비가 없습니다</td>
              </tr>
            )}
          </tbody>
        </table>
        {photosTarget && (
          <section className="mt-4 space-y-3 rounded-lg border border-line p-3" aria-label={`${photosTarget.name} 장비 사진`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{photosTarget.name} 사진</p>
                <p className="mt-0.5 text-xs text-muted">모델·명판·설치 상태를 최대 8장까지 보관합니다.</p>
              </div>
              <label
                className={`btn-ghost tap-target cursor-pointer rounded-lg px-3 py-2 text-sm ${
                  photoBusy || photosLoading || photos.length >= 8 ? "pointer-events-none opacity-50" : ""
                }`}
              >
                {photoBusy ? "처리 중…" : "+ 사진 추가"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  className="hidden"
                  disabled={photoBusy || photosLoading || photos.length >= 8}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadPhoto(photosTarget.id, file);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
            {photosLoading && (
              <p role="status" className="py-3 text-sm text-muted">
                장비 사진을 불러오는 중…
              </p>
            )}
            {photosError && (
              <RecoverableError
                title="장비 사진을 처리하지 못했습니다"
                message={photosError}
                onRetry={() => void loadPhotos(photosTarget)}
              />
            )}
            {!photosLoading && photos.length > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {photos.map((photo, index) => (
                  <div key={photo.id} className="group relative overflow-hidden rounded-lg border border-line bg-bg-2">
                    <ProtectedImage
                      src={photo.url}
                      alt={`${photosTarget.name} 장비 사진 ${index + 1}`}
                      className="aspect-square w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => void deletePhoto(photosTarget.id, photo.id)}
                      disabled={photoBusy}
                      className="absolute right-1 top-1 rounded-full bg-black/65 px-2 py-1 text-xs text-white disabled:opacity-50"
                      aria-label={`${index + 1}번째 장비 사진 삭제`}
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
            {!photosLoading && !photosError && photos.length === 0 && (
              <p className="rounded-lg bg-bg-2 px-3 py-4 text-center text-sm text-muted">
                등록된 장비 사진이 없습니다.
              </p>
            )}
          </section>
        )}
        {historyLoading && (
          <p role="status" className="py-3 text-sm text-muted">
            작업 이력을 불러오는 중…
          </p>
        )}
        {historyError && historyTarget && (
          <RecoverableError
            title={`${historyTarget.name} 작업 이력을 불러오지 못했습니다`}
            message={historyError}
            onRetry={() => void loadHistory(historyTarget)}
          />
        )}
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
        <select
          aria-label="장비의 현장"
          className="input w-full"
          value={form.siteId}
          onChange={(e) => setForm({ ...form, siteId: e.target.value })}
          disabled={sitesLoading}
        >
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
        {saveError && (
          <RecoverableError
            title="장비를 저장하지 못했습니다"
            message={saveError}
            nextAction="입력 내용을 확인한 뒤 저장을 다시 시도해주세요."
            onRetry={() => void save()}
            retryLabel="저장 다시 시도"
          />
        )}
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={busy || !form.name || !form.siteId}
            className="btn-primary flex-1 rounded-lg py-2 text-sm font-medium"
          >
            {busy ? "저장 중…" : "저장"}
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
