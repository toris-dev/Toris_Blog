import type {
  ApprovalInfo,
  ApprovalStatus,
  AssignmentHistoryItem,
  Asset,
  AssetPhoto,
  BillingInfo,
  BillingStatus,
  CrmImportResponse,
  Customer,
  DashboardCounts,
  FieldRecord,
  MaintenanceSchedule,
  Member,
  NextVisitCandidate,
  NotificationItem,
  Organization,
  Photo,
  ReportVersionMeta,
  Role,
  Site,
  WorkOrderDetail,
  WorkOrderSummary,
} from "@fieldstep/shared";
import type { StructuredDraft } from "@fieldstep/shared";

export interface AudioMemo {
  id: string;
  workOrderId: string;
  url: string;
  mimeType: "audio/webm" | "audio/mp4" | "audio/mpeg" | "audio/wav";
  caption: string | null;
  durationSeconds: number | null;
  createdAt: string;
  transcriptStatus: "not_connected";
}

export interface OrganizationInvite {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
  createdAt?: string;
  accepted: boolean;
  acceptedAt: string | null;
  canceledAt: string | null;
  resendCount: number;
  status: "pending" | "accepted" | "canceled" | "expired";
}

export interface OrganizationLogo {
  id: string;
  url: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  sizeBytes: number;
  createdAt: string;
}

export type ReportArtifactStatus =
  | "pending"
  | "uploading"
  | "ready"
  | "failed";

export interface ReportArtifactDescriptor {
  id: string;
  kind: "approval" | "signed";
  status: ReportArtifactStatus;
  rendererVersion: string;
  sourceSha256: string;
  sizeBytes: number | null;
  checksumSha256: string | null;
  attemptCount: number;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  updatedAt?: string;
  readyAt: string | null;
  uploadUrl: string | null;
  failureUrl: string | null;
  pdfUrl: string | null;
  filename: string;
}

export interface ReportVersionListItem extends ReportVersionMeta {
  artifact: {
    id: string;
    status: ReportArtifactStatus;
    sourceSha256: string;
    pdfUrl: string | null;
  } | null;
  signedArtifact: {
    id: string;
    status: ReportArtifactStatus;
    pdfUrl: string | null;
  } | null;
}

export interface SignedPdfReceiptResponse {
  reportVersionId: string;
  approvalRequestId: string;
  sourceSha256: string;
  signerName: string;
  signerTitle: string | null;
  approvedAt: string;
  agreementVersion: string;
  signatureDataUrl?: string;
}

export interface MaintenanceSyncBlockedSchedule {
  scheduleId: string;
  code: "inactive_hierarchy" | "no_active_assignees";
  message: string;
  nextOccurrenceDate: string;
}

export interface MaintenanceScheduleSyncResult {
  generated: number;
  processed: number;
  assignedCount: number;
  blockedCount: number;
  blockedSchedules: MaintenanceSyncBlockedSchedule[];
  horizonDate: string;
  rowCap: number;
  limitReached: boolean;
  concurrencyRetries: number;
}

export interface ReportContextSnapshot {
  org: {
    name: string;
    businessNo: string | null;
    address: string | null;
    contactName: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    logo: {
      id: string;
      url: string;
      mimeType: "image/jpeg" | "image/png" | "image/webp";
      checksumSha256: string;
      sizeBytes: number;
    } | null;
  };
  workOrder: {
    id: string;
    scheduledDate: string;
    scheduledTime: string | null;
    workType: string;
    request: string | null;
  };
  customer: {
    id: string;
    name: string;
    businessNo: string | null;
    address: string | null;
    contactName: string | null;
    contactPhone: string | null;
  };
  site: { id: string; name: string; address: string | null };
  asset: {
    id: string;
    name: string;
    model: string | null;
    serialNo: string | null;
  } | null;
  assigneeNames: string[];
}

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  (typeof location !== "undefined" && location.hostname === "localhost"
    ? "http://localhost:8788"
    : "https://api.field.toris.kr");

const BINARY_UPLOAD_TIMEOUT_MS = 5 * 60_000;
const TOKEN_KEY = "fieldstep_token";
export const FIELD_RECORD_DRAFT_PREFIX = "fieldstep:field-record:";
const LEGACY_FIELD_RECORD_DRAFT_PREFIX = "fieldstep_field_record_draft:";

function fieldRecordDraftStorageKeys(workOrderId: string): [string, string] {
  return [
    `${FIELD_RECORD_DRAFT_PREFIX}${workOrderId}`,
    `${LEGACY_FIELD_RECORD_DRAFT_PREFIX}${workOrderId}`,
  ];
}

export function readFieldRecordDraft(workOrderId: string): string | null {
  if (typeof window === "undefined") return null;
  const [key, legacyKey] = fieldRecordDraftStorageKeys(workOrderId);
  return window.localStorage.getItem(key) ?? window.localStorage.getItem(legacyKey);
}

export function writeFieldRecordDraft(
  workOrderId: string,
  value: string,
): void {
  const [key, legacyKey] = fieldRecordDraftStorageKeys(workOrderId);
  window.localStorage.setItem(key, value);
  window.localStorage.removeItem(legacyKey);
}

export function removeFieldRecordDraft(workOrderId: string): void {
  if (typeof window === "undefined") return;
  for (const key of fieldRecordDraftStorageKeys(workOrderId)) {
    window.localStorage.removeItem(key);
  }
}

export function clearFieldRecordDrafts(): void {
  if (typeof window === "undefined") return;
  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (
      key?.startsWith(FIELD_RECORD_DRAFT_PREFIX) ||
      key?.startsWith(LEGACY_FIELD_RECORD_DRAFT_PREFIX)
    ) {
      window.localStorage.removeItem(key);
    }
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function goToLogin(): void {
  if (typeof window === "undefined") return;
  clearToken();
  clearFieldRecordDrafts();
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  opts: { auth?: boolean } = {},
): Promise<T> {
  const auth = opts.auth ?? true;
  const headers: Record<string, string> = {
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 401) {
    goToLogin();
    throw new ApiError("로그인이 필요합니다", 401);
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new ApiError((data.error as string | undefined) ?? `요청 실패 (${res.status})`, res.status);
  }
  return data as T;
}

function resolveApiUrl(pathOrUrl: string): string {
  const url = new URL(pathOrUrl, API_BASE);
  const apiOrigin = new URL(API_BASE).origin;
  if (url.origin !== apiOrigin) {
    throw new ApiError("허용되지 않은 미디어 주소입니다", 400);
  }
  return url.toString();
}

async function postBinary<T>(
  path: string,
  blob: Blob,
  options: {
    idempotencyKey: string;
    onProgress?: (percent: number) => void;
  },
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}${path}`);
    xhr.timeout = BINARY_UPLOAD_TIMEOUT_MS;
    xhr.setRequestHeader(
      "Content-Type",
      blob.type || "application/octet-stream",
    );
    xhr.setRequestHeader("Idempotency-Key", options.idempotencyKey);
    const token = getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        options.onProgress?.(
          Math.min(99, Math.round((event.loaded / event.total) * 100)),
        );
      }
    };
    xhr.onerror = () => reject(new ApiError("네트워크 연결을 확인해주세요", 0));
    xhr.ontimeout = () =>
      reject(
        new ApiError(
          "업로드 시간이 5분을 초과했습니다. 네트워크를 확인한 뒤 다시 시도해주세요",
          0,
        ),
      );
    xhr.onabort = () => reject(new ApiError("업로드가 취소되었습니다", 0));
    xhr.onload = () => {
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(xhr.responseText || "{}") as Record<string, unknown>;
      } catch {
        data = {};
      }
      if (xhr.status === 401) {
        goToLogin();
        reject(new ApiError("로그인이 필요합니다", 401));
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(
          new ApiError(
            (data.error as string | undefined) ??
              `요청 실패 (${xhr.status})`,
            xhr.status,
          ),
        );
        return;
      }
      options.onProgress?.(100);
      resolve(data as T);
    };
    xhr.send(blob);
  });
}

async function putBinary<T>(
  pathOrUrl: string,
  blob: Blob,
  options: {
    checksumSha256: string;
    auth?: boolean;
    onProgress?: (percent: number) => void;
  },
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const auth = options.auth ?? true;
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", resolveApiUrl(pathOrUrl));
    xhr.timeout = BINARY_UPLOAD_TIMEOUT_MS;
    xhr.setRequestHeader(
      "Content-Type",
      blob.type || "application/octet-stream",
    );
    xhr.setRequestHeader("X-Content-SHA256", options.checksumSha256);
    if (auth) {
      const token = getToken();
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        options.onProgress?.(
          Math.min(99, Math.round((event.loaded / event.total) * 100)),
        );
      }
    };
    xhr.onerror = () =>
      reject(new ApiError("네트워크 연결을 확인해주세요", 0));
    xhr.ontimeout = () =>
      reject(
        new ApiError(
          "업로드 시간이 5분을 초과했습니다. 네트워크를 확인한 뒤 다시 시도해주세요",
          0,
        ),
      );
    xhr.onabort = () => reject(new ApiError("업로드가 취소되었습니다", 0));
    xhr.onload = () => {
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(xhr.responseText || "{}") as Record<string, unknown>;
      } catch {
        data = {};
      }
      if (auth && xhr.status === 401) {
        goToLogin();
        reject(new ApiError("로그인이 필요합니다", 401));
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(
          new ApiError(
            (data.error as string | undefined) ??
              `요청 실패 (${xhr.status})`,
            xhr.status,
          ),
        );
        return;
      }
      options.onProgress?.(100);
      resolve(data as T);
    };
    xhr.send(blob);
  });
}

export async function fetchApiBlob(
  src: string,
  options: { auth?: boolean; signal?: AbortSignal } = {},
): Promise<Blob> {
  const auth = options.auth ?? true;
  const headers = new Headers();
  if (auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(resolveApiUrl(src), {
    headers,
    signal: options.signal,
  });
  if (auth && res.status === 401) {
    goToLogin();
    throw new ApiError("로그인이 필요합니다", 401);
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    throw new ApiError((data.error as string | undefined) ?? `미디어를 불러오지 못했습니다 (${res.status})`, res.status);
  }
  return res.blob();
}

export async function fetchProtectedMedia(
  src: string,
  signal?: AbortSignal,
): Promise<Blob> {
  return fetchApiBlob(src, { auth: true, signal });
}

function get<T>(path: string, opts?: { auth?: boolean }) {
  return request<T>(path, { method: "GET" }, opts);
}
function post<T>(path: string, body?: unknown, opts?: { auth?: boolean }) {
  return request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }, opts);
}
function put<T>(path: string, body?: unknown, opts?: { auth?: boolean }) {
  return request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }, opts);
}
function patch<T>(path: string, body?: unknown, opts?: { auth?: boolean }) {
  return request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }, opts);
}
function del<T>(path: string, opts?: { auth?: boolean }) {
  return request<T>(path, { method: "DELETE" }, opts);
}

// ---------------------------------------------------------------------------
// 인증
// ---------------------------------------------------------------------------

export interface AuthResult {
  token: string;
  user: { id: string; email: string; name: string };
  org: { id: string; name: string };
  role: Role;
}

export const api = {
  signup: (body: { email: string; password: string; name: string; orgName: string }) =>
    post<AuthResult>("/auth/signup", body, { auth: false }),
  login: (body: { email: string; password: string }) =>
    post<AuthResult>("/auth/login", body, { auth: false }),
  acceptInvite: (body: { token: string; name: string; password: string }) =>
    post<AuthResult>("/auth/accept-invite", body, { auth: false }),
  logout: () => post<{ ok: true }>("/auth/logout"),
  me: () => get<{ user: { id: string; email: string; name: string }; org: { id: string; name: string }; role: Role }>("/me"),

  organization: {
    get: () => get<{ organization: Organization }>("/organization"),
    patch: (body: Record<string, unknown>) =>
      patch<{ organization: Organization }>("/organization", body),
    uploadLogo: (blob: Blob, idempotencyKey = crypto.randomUUID()) =>
      postBinary<{ organization: Organization; logo: OrganizationLogo }>(
        "/organization/logo",
        blob,
        { idempotencyKey },
      ),
    deleteLogo: () =>
      del<{ ok: true; organization: Organization }>("/organization/logo"),
  },

  users: () => get<{ members: Member[] }>("/users"),
  setMemberActive: (id: string, active: boolean) =>
    patch<{ member: Member; changed: boolean }>(
      `/users/${encodeURIComponent(id)}/active`,
      { active },
    ),

  invites: {
    create: (body: { email: string; role: Role }) =>
      post<{ invite: OrganizationInvite & { token: string } }>(
        "/invites",
        body,
      ),
    list: () => get<{ invites: OrganizationInvite[] }>("/invites"),
    resend: (id: string) =>
      post<{ invite: OrganizationInvite & { token: string } }>(
        `/invites/${id}/resend`,
      ),
    cancel: (id: string) =>
      del<{ ok: true; invite: { id: string; status: "canceled"; canceledAt: string } }>(
        `/invites/${id}`,
    ),
  },

  crmImports: {
    upload: (
      file: Blob,
      options: {
        idempotencyKey: string;
        onProgress?: (percent: number) => void;
      },
    ) =>
      postBinary<CrmImportResponse>(
        "/crm/imports/csv",
        new Blob([file], { type: "text/csv;charset=utf-8" }),
        options,
      ),
  },

  customers: {
    list: (q?: string) => get<{ customers: Customer[] }>(`/customers${q ? `?q=${encodeURIComponent(q)}` : ""}`),
    create: (body: Record<string, unknown>) => post<{ customer: Customer }>("/customers", body),
    get: (id: string) => get<{ customer: Customer; sites: Site[] }>(`/customers/${id}`),
    patch: (id: string, body: Record<string, unknown>) => patch<{ customer: Customer }>(`/customers/${id}`, body),
  },

  sites: {
    list: (customerId?: string) =>
      get<{ sites: Site[] }>(`/sites${customerId ? `?customerId=${encodeURIComponent(customerId)}` : ""}`),
    create: (body: Record<string, unknown>) => post<{ site: Site }>("/sites", body),
    patch: (id: string, body: Record<string, unknown>) => patch<{ site: Site }>(`/sites/${id}`, body),
  },

  assets: {
    list: (siteId?: string) =>
      get<{ assets: Asset[] }>(`/assets${siteId ? `?siteId=${encodeURIComponent(siteId)}` : ""}`),
    get: (id: string) => get<{ asset: Asset; photos: AssetPhoto[] }>(`/assets/${id}`),
    create: (body: Record<string, unknown>) => post<{ asset: Asset }>("/assets", body),
    patch: (id: string, body: Record<string, unknown>) => patch<{ asset: Asset }>(`/assets/${id}`, body),
    history: (id: string) => get<{ workOrders: WorkOrderSummary[] }>(`/assets/${id}/history`),
    photos: (id: string) => get<{ photos: AssetPhoto[] }>(`/assets/${id}/photos`),
    addPhoto: (
      id: string,
      body: { blob: Blob; caption?: string; idempotencyKey?: string },
    ) => {
      const query = new URLSearchParams();
      if (body.caption) query.set("caption", body.caption);
      const qs = query.toString();
      return postBinary<{ photo: AssetPhoto }>(
        `/assets/${id}/photos${qs ? `?${qs}` : ""}`,
        body.blob,
        {
          idempotencyKey: body.idempotencyKey ?? crypto.randomUUID(),
        },
      );
    },
    deletePhoto: (id: string, photoId: string) =>
      del<{ ok: true }>(`/assets/${id}/photos/${photoId}`),
  },

  workOrders: {
    list: (params: { date?: string; status?: string; mine?: boolean } = {}) => {
      const q = new URLSearchParams();
      if (params.date) q.set("date", params.date);
      if (params.status) q.set("status", params.status);
      if (params.mine) q.set("mine", "1");
      const qs = q.toString();
      return get<{ workOrders: WorkOrderSummary[] }>(`/work-orders${qs ? `?${qs}` : ""}`);
    },
    create: (
      body: Record<string, unknown>,
      options: { idempotencyKey?: string } = {},
    ) =>
      request<{
        workOrder: WorkOrderDetail;
        maintenanceSchedule: {
          id: string;
          status: MaintenanceSchedule["status"];
          nextOccurrenceDate: string | null;
        } | null;
      }>("/work-orders", {
        method: "POST",
        body: JSON.stringify(body),
        headers: options.idempotencyKey
          ? { "Idempotency-Key": options.idempotencyKey }
          : undefined,
      }),
    get: (id: string) =>
      request<{
        workOrder: WorkOrderDetail;
        customer: Customer;
        site: Site;
        asset: Asset | null;
        assignees: Member[];
        assignmentHistory: AssignmentHistoryItem[];
        fieldRecord: FieldRecord | null;
        photos: Photo[];
        audio: AudioMemo[];
        draft: StructuredDraft | null;
        nextVisitCandidate: NextVisitCandidate | null;
        reportVersions: ReportVersionListItem[];
        approval: ApprovalInfo | null;
        billing: BillingInfo | null;
      }>(`/work-orders/${id}`),
    patch: (id: string, body: Record<string, unknown>) => patch<{ workOrder: WorkOrderDetail }>(`/work-orders/${id}`, body),
    assign: (id: string, userIds: string[]) =>
      post<{ workOrder: WorkOrderDetail }>(`/work-orders/${id}/assign`, { userIds }),
    start: (id: string) => post<{ ok: true; startedAt: string; workStatus: string }>(`/work-orders/${id}/start`),
    complete: (id: string) => post<{ ok: true; completedAt: string; workStatus: string }>(`/work-orders/${id}/complete`),
    cancel: (id: string, reason: string) =>
      post<{ ok: true; canceledAt: string; workStatus: string }>(`/work-orders/${id}/cancel`, { reason }),
    putFieldRecord: (id: string, body: Record<string, unknown>) =>
      put<{ fieldRecord: FieldRecord }>(`/work-orders/${id}/field-record`, body),
    flushFieldRecord: (id: string, body: Record<string, unknown>) => {
      const headers = new Headers({ "Content-Type": "application/json" });
      const token = getToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return fetch(`${API_BASE}/work-orders/${id}/field-record`, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
        keepalive: true,
      });
    },
    addPhoto: (
      id: string,
      body: {
        kind: string;
        blob: Blob;
        caption?: string;
        idempotencyKey: string;
        onProgress?: (percent: number) => void;
      },
    ) => {
      const query = new URLSearchParams({ kind: body.kind });
      if (body.caption) query.set("caption", body.caption);
      return postBinary<{ photo: Photo }>(
        `/work-orders/${id}/photos?${query.toString()}`,
        body.blob,
        {
          idempotencyKey: body.idempotencyKey,
          onProgress: body.onProgress,
        },
      );
    },
    deletePhoto: (id: string, photoId: string) => del<{ ok: true }>(`/work-orders/${id}/photos/${photoId}`),
    addAudio: (
      id: string,
      body: {
        blob: Blob;
        caption?: string;
        durationSeconds?: number;
        idempotencyKey: string;
        onProgress?: (percent: number) => void;
      },
    ) => {
      const query = new URLSearchParams();
      if (body.caption) query.set("caption", body.caption);
      if (body.durationSeconds !== undefined) {
        query.set("durationSeconds", String(body.durationSeconds));
      }
      const qs = query.toString();
      return postBinary<{ audio: AudioMemo }>(
        `/work-orders/${id}/audio${qs ? `?${qs}` : ""}`,
        body.blob,
        {
          idempotencyKey: body.idempotencyKey,
          onProgress: body.onProgress,
        },
      );
    },
    deleteAudio: (id: string, audioId: string) =>
      del<{ ok: true }>(`/work-orders/${id}/audio/${audioId}`),
    submit: (id: string) =>
      post<{ ok: true; submittedAt: string; workStatus: string; aiStatus: string; draft: StructuredDraft | null }>(
        `/work-orders/${id}/submit`,
      ),
    putReport: (id: string, structured: StructuredDraft) =>
      put<{ draft: StructuredDraft }>(`/work-orders/${id}/report`, { structured }),
    finalizeReport: (id: string, confirmedUncertainFields: string[]) =>
      post<{
        reportVersion: ReportVersionMeta;
        artifact: Pick<
          ReportArtifactDescriptor,
          | "id"
          | "kind"
          | "status"
          | "rendererVersion"
          | "sourceSha256"
          | "uploadUrl"
        >;
      }>(`/work-orders/${id}/report/finalize`, {
        confirmedUncertainFields,
      }),
    reportVersion: (id: string, version: number) =>
      get<{
        reportVersion: ReportVersionMeta & {
          structured: StructuredDraft;
          photos: Photo[];
          templateVersion: number;
          lockedAt: string | null;
          context: ReportContextSnapshot | null;
          signature: {
            name: string;
            title: string | null;
            signatureDataUrl: string;
            approvedAt: string;
            agreed: boolean;
            consentedAt: string | null;
            consentVersion: string;
          } | null;
          artifacts: {
            approval: ReportArtifactDescriptor | null;
            signed: ReportArtifactDescriptor | null;
          };
        };
      }>(`/work-orders/${id}/report-versions/${version}`),
    uploadReportArtifact: (
      id: string,
      version: number,
      kind: "approval" | "signed",
      body: {
        blob: Blob;
        checksumSha256: string;
        onProgress?: (percent: number) => void;
      },
    ) =>
      putBinary<{
        artifact: ReportArtifactDescriptor;
        reused: boolean;
      }>(
        `/work-orders/${id}/report-versions/${version}/artifacts/${kind}`,
        body.blob,
        {
          checksumSha256: body.checksumSha256,
          onProgress: body.onProgress,
        },
      ),
    failReportArtifact: (
      id: string,
      version: number,
      kind: "approval" | "signed",
      failure: { code: string; message: string },
    ) =>
      post<{ artifact: ReportArtifactDescriptor }>(
        `/work-orders/${id}/report-versions/${version}/artifacts/${kind}/failure`,
        failure,
      ),
    prepareSignedArtifact: (id: string, version: number) =>
      post<{
        artifact: ReportArtifactDescriptor;
        receipt: SignedPdfReceiptResponse & { signatureDataUrl: string };
        basePdfUrl: string;
      }>(
        `/work-orders/${id}/report-versions/${version}/artifacts/signed/prepare`,
      ),
    createApprovalLink: (id: string, invalidatePrevious = true) =>
      post<{ url: string; token: string; expiresAt: string }>(
        `/work-orders/${id}/approval-links`,
        { invalidatePrevious },
      ),
    requestReportCorrection: (id: string, comment: string) =>
      post<{
        ok: true;
        approvalStatus: "revision_requested";
        reportVersionId: string;
        correctionRequestedAt: string;
      }>(`/work-orders/${id}/report-correction`, { comment }),
    putBilling: (id: string, body: Record<string, unknown>) => put<{ billing: BillingInfo }>(`/work-orders/${id}/billing`, body),
  },

  maintenanceSchedules: {
    list: () =>
      get<{ schedules: MaintenanceSchedule[] }>("/maintenance-schedules"),
    sync: (body: { horizonDays?: number; rowCap?: number } = {}) =>
      post<MaintenanceScheduleSyncResult>("/maintenance-schedules/sync", body),
    update: (
      id: string,
      action: "pause" | "resume" | "cancel",
    ) =>
      patch<{
        changed: boolean;
        schedule: {
          id: string;
          status: MaintenanceSchedule["status"];
          nextOccurrenceDate: string | null;
          revision: number;
        };
      }>(`/maintenance-schedules/${id}`, { action }),
  },

  billing: {
    list: (status?: BillingStatus) =>
      get<{
        rows: {
          workOrder: WorkOrderSummary;
          customerName: string;
          billing: BillingInfo;
        }[];
      }>(`/billing${status ? `?status=${status}` : ""}`),
  },

  dashboard: () => get<{ counts: DashboardCounts }>("/dashboard"),

  notifications: {
    list: (unread?: boolean) => get<{ notifications: NotificationItem[] }>(`/notifications${unread ? "?unread=1" : ""}`),
    markRead: (ids: string[]) => post<{ ok: true }>("/notifications/read", { ids }),
  },

  public: {
    approval: (token: string) =>
      request<{
        org: { name: string };
        reportVersion: {
          id: string;
          workOrderId: string;
          reportNumber: string;
          version: number;
          createdAt: string;
          structured: StructuredDraft;
          context: ReportContextSnapshot;
          photos: Photo[];
          workOrder: { id: string; scheduledDate: string; scheduledTime: string | null; workType: string; request: string | null };
          customer: { id: string; name: string; address: string | null };
          site: { id: string; name: string; address: string | null };
          asset: { id: string; name: string; model: string | null; serialNo: string | null } | null;
          assigneeNames: string[];
          artifact: ReportArtifactDescriptor | null;
        } | null;
        approvalStatus: ApprovalStatus;
        approvalRequestStatus:
          | "pending"
          | "approved"
          | "revision_requested";
        viewedAt: string | null;
        signedArtifact: ReportArtifactDescriptor | null;
      }>(
        `/public/approvals/${token}`,
        { method: "GET", cache: "no-store" },
        { auth: false },
      ),
    approve: (
      token: string,
      body: { name: string; title?: string; signatureDataUrl: string; agree: true },
    ) =>
      post<{
        ok: true;
        approvedAt: string;
        signedArtifact: ReportArtifactDescriptor | null;
        signedPdfRecoveryRequired: boolean;
      }>(`/public/approvals/${token}/approve`, body, { auth: false }),
    requestRevision: (token: string, comment: string) =>
      post<{ ok: true }>(`/public/approvals/${token}/revision`, { comment }, { auth: false }),
  },

  health: () => get<{ ok: true; service: string }>("/health", { auth: false }),
};
