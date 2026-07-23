import type {
  ApprovalInfo,
  ApprovalStatus,
  Asset,
  BillingInfo,
  BillingStatus,
  Customer,
  DashboardCounts,
  FieldRecord,
  Member,
  NotificationItem,
  Photo,
  ReportVersionMeta,
  Role,
  Site,
  WorkOrderDetail,
  WorkOrderSummary,
} from "@fieldstep/shared";
import type { StructuredDraft } from "@fieldstep/shared";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  (typeof location !== "undefined" && location.hostname === "localhost"
    ? "http://localhost:8788"
    : "https://api.field.toris.kr");

const TOKEN_KEY = "fieldstep_token";

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

  users: () => get<{ members: Member[] }>("/users"),

  invites: {
    create: (body: { email: string; role: Role }) =>
      post<{ invite: { id: string; email: string; role: Role; token: string; expiresAt: string } }>(
        "/invites",
        body,
      ),
    list: () =>
      get<{ invites: { id: string; email: string; role: Role; expiresAt: string; accepted: boolean }[] }>(
        "/invites",
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
    create: (body: Record<string, unknown>) => post<{ asset: Asset }>("/assets", body),
    patch: (id: string, body: Record<string, unknown>) => patch<{ asset: Asset }>(`/assets/${id}`, body),
    history: (id: string) => get<{ workOrders: WorkOrderSummary[] }>(`/assets/${id}/history`),
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
    create: (body: Record<string, unknown>) => post<{ workOrder: WorkOrderDetail }>("/work-orders", body),
    get: (id: string) =>
      get<{
        workOrder: WorkOrderDetail;
        customer: Customer;
        site: Site;
        asset: Asset | null;
        assignees: Member[];
        fieldRecord: FieldRecord | null;
        photos: Photo[];
        draft: StructuredDraft | null;
        reportVersions: ReportVersionMeta[];
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
    addPhoto: (id: string, body: { kind: string; dataUrl: string; caption?: string }) =>
      post<{ photo: Photo }>(`/work-orders/${id}/photos`, body),
    deletePhoto: (id: string, photoId: string) => del<{ ok: true }>(`/work-orders/${id}/photos/${photoId}`),
    submit: (id: string) =>
      post<{ ok: true; submittedAt: string; workStatus: string; aiStatus: string; draft: StructuredDraft | null }>(
        `/work-orders/${id}/submit`,
      ),
    putReport: (id: string, structured: StructuredDraft) =>
      put<{ draft: StructuredDraft }>(`/work-orders/${id}/report`, { structured }),
    finalizeReport: (id: string) => post<{ reportVersion: ReportVersionMeta }>(`/work-orders/${id}/report/finalize`),
    reportVersion: (id: string, version: number) =>
      get<{
        reportVersion: ReportVersionMeta & {
          structured: StructuredDraft;
          photos: Photo[];
          templateVersion: number;
          lockedAt: string | null;
          signature: { name: string; title: string | null; signatureDataUrl: string; approvedAt: string } | null;
        };
      }>(`/work-orders/${id}/report-versions/${version}`),
    createApprovalLink: (id: string) =>
      post<{ url: string; token: string; expiresAt: string }>(`/work-orders/${id}/approval-links`),
    putBilling: (id: string, body: Record<string, unknown>) => put<{ billing: BillingInfo }>(`/work-orders/${id}/billing`, body),
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
      get<{
        org: { name: string };
        reportVersion: {
          reportNumber: string;
          version: number;
          createdAt: string;
          structured: StructuredDraft;
          photos: Photo[];
          workOrder: { id: string; scheduledDate: string; scheduledTime: string | null; workType: string; request: string | null };
          customer: { id: string; name: string; address: string | null };
          site: { id: string; name: string; address: string | null };
          asset: { id: string; name: string; model: string | null; serialNo: string | null } | null;
        } | null;
        approvalStatus: ApprovalStatus;
        viewedAt: string | null;
      }>(`/public/approvals/${token}`, { auth: false }),
    approve: (
      token: string,
      body: { name: string; title?: string; signatureDataUrl: string; agree: true },
    ) => post<{ ok: true }>(`/public/approvals/${token}/approve`, body, { auth: false }),
    requestRevision: (token: string, comment: string) =>
      post<{ ok: true }>(`/public/approvals/${token}/revision`, { comment }, { auth: false }),
  },

  health: () => get<{ ok: true; service: string }>("/health", { auth: false }),
};
