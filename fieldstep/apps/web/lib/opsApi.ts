// ---------------------------------------------------------------------------
// 통합관리자(서비스 운영자) 콘솔 전용 API 클라이언트
//
// 조직 앱(lib/api.ts)과 완전히 분리된 토큰·요청 래퍼를 사용한다.
// - 토큰 키: "fieldstep_ops_token"
// - 401 응답 시 조직 로그인(/login)이 아니라 /ops/login 으로 이동
// - API_BASE 는 조직 앱과 동일한 워커(api.field.toris.kr)를 재사용
// ---------------------------------------------------------------------------

import { API_BASE, ApiError } from "./api";

export { ApiError };

const OPS_TOKEN_KEY = "fieldstep_ops_token";

export interface Operator {
  id: string;
  email: string;
  name: string;
}

export interface OpsOrgListItem {
  id: string;
  name: string;
  created_at: string;
  members: number;
  work_orders: number;
  last_activity: string | null;
}

export interface OpsOrgProfile {
  businessNo: string | null;
  address: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  hasLogo: boolean;
  updatedAt: string | null;
}

export interface OpsOrgMember {
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export interface OpsOrgDetail {
  org: { id: string; name: string; created_at: string };
  profile: OpsOrgProfile | null;
  members: OpsOrgMember[];
}

export interface OpsOrgUsage {
  orgId: string;
  workOrders: number;
  reports: number;
  storageBytes: number;
  photoCount: number;
  voiceMinutes: number;
}

export interface OpsAuditEvent {
  id: string;
  orgId: string;
  orgName: string;
  actorUserId: string | null;
  event: string;
  target: string | null;
  detail: unknown;
  createdAt: string;
}

export interface OpsTemplate {
  id: string;
  version: number;
  name: string;
  active: boolean;
  uploadedBy: string | null;
  uploadedAt: string;
}

export interface OpsAuditFilters {
  orgId?: string;
  event?: string;
  from?: string;
  to?: string;
  limit?: number;
}

// ---------------------------------------------------------------------------
// 토큰 저장소 (localStorage)
// ---------------------------------------------------------------------------

export function getOpsToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(OPS_TOKEN_KEY);
}

export function setOpsToken(token: string): void {
  window.localStorage.setItem(OPS_TOKEN_KEY, token);
}

export function clearOpsToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(OPS_TOKEN_KEY);
}

export function goToOpsLogin(): void {
  if (typeof window === "undefined") return;
  clearOpsToken();
  if (!window.location.pathname.startsWith("/ops/login")) {
    window.location.href = "/ops/login";
  }
}

// ---------------------------------------------------------------------------
// 요청 래퍼
// ---------------------------------------------------------------------------

async function opsRequest<T>(
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
    const token = getOpsToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 401) {
    goToOpsLogin();
    throw new ApiError("운영자 로그인이 필요합니다", 401);
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new ApiError(
      (data.error as string | undefined) ?? `요청 실패 (${res.status})`,
      res.status,
    );
  }
  return data as T;
}

function opsGet<T>(path: string, opts?: { auth?: boolean }) {
  return opsRequest<T>(path, { method: "GET" }, opts);
}
function opsPost<T>(path: string, body?: unknown, opts?: { auth?: boolean }) {
  return opsRequest<T>(
    path,
    { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined },
    opts,
  );
}

function buildAuditQuery(filters: OpsAuditFilters): string {
  const q = new URLSearchParams();
  if (filters.orgId) q.set("orgId", filters.orgId);
  if (filters.event) q.set("event", filters.event);
  if (filters.from) q.set("from", filters.from);
  if (filters.to) q.set("to", filters.to);
  if (filters.limit != null) q.set("limit", String(filters.limit));
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

// ---------------------------------------------------------------------------
// 데이터 내보내기 (다운로드)
// ---------------------------------------------------------------------------

async function exportOrg(id: string, format: "csv" | "json"): Promise<void> {
  const token = getOpsToken();
  const res = await fetch(
    `${API_BASE}/ops/orgs/${encodeURIComponent(id)}/export?format=${format}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  );
  if (res.status === 401) {
    goToOpsLogin();
    throw new ApiError("운영자 로그인이 필요합니다", 401);
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    throw new ApiError(
      (data.error as string | undefined) ?? `내보내기 실패 (${res.status})`,
      res.status,
    );
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `fieldstep-export-${id}.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

// ---------------------------------------------------------------------------
// 공개 API
// ---------------------------------------------------------------------------

export const opsApi = {
  login: (body: { email: string; password: string }) =>
    opsPost<{ token: string; operator: Operator }>("/ops/auth/login", body, {
      auth: false,
    }),
  logout: () => opsPost<{ ok: true }>("/ops/auth/logout"),
  me: () => opsGet<{ operator: Operator }>("/ops/me"),

  orgs: () => opsGet<{ orgs: OpsOrgListItem[] }>("/ops/orgs"),
  org: (id: string) =>
    opsGet<OpsOrgDetail>(`/ops/orgs/${encodeURIComponent(id)}`),
  usage: (id: string) =>
    opsGet<OpsOrgUsage>(`/ops/orgs/${encodeURIComponent(id)}/usage`),

  audit: (filters: OpsAuditFilters = {}) =>
    opsGet<{ events: OpsAuditEvent[] }>(`/ops/audit${buildAuditQuery(filters)}`),

  reprocess: (workOrderId: string, target: "ai" | "pdf") =>
    opsPost<{ ok: true; target: "ai" | "pdf"; resetCount: number }>(
      `/ops/work-orders/${encodeURIComponent(workOrderId)}/reprocess`,
      { target },
    ),

  templates: {
    list: (id: string) =>
      opsGet<{ templates: OpsTemplate[] }>(
        `/ops/orgs/${encodeURIComponent(id)}/templates`,
      ),
    create: (id: string, body: { name: string; config: unknown }) =>
      opsPost<{
        id: string;
        version: number;
        name: string;
        active: boolean;
        uploadedAt: string;
      }>(`/ops/orgs/${encodeURIComponent(id)}/templates`, body),
    activate: (id: string, templateId: string) =>
      opsPost<{
        ok: true;
        activeTemplateId: string;
        version: number;
        activatedAt: string;
      }>(
        `/ops/orgs/${encodeURIComponent(id)}/templates/${encodeURIComponent(
          templateId,
        )}/activate`,
      ),
  },

  export: exportOrg,
};
