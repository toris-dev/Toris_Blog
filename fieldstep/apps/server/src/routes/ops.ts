/**
 * 통합관리자(서비스 운영자) 콘솔 — PRD §14.3 운영자 도구.
 *
 * 조직 격리(org_id)와 분리된 전사(cross-org) 내부 운영 라우트. 모든 라우트는
 * requireOperator 뒤에 있으며, 운영자 자격은 PLATFORM_OPERATOR_EMAILS allowlist로
 * 매 요청 재확인된다. 6개 도구: 조직 조회 · 사용량 조회 · 감사 조회 · 작업 재처리 ·
 * 템플릿 배포 · 데이터 내보내기.
 */
import { Hono } from "hono";
import { loginSchema } from "@fieldstep/shared";
import type { AppEnv } from "../db.js";
import { newId, nowIso, parseJson, recordAudit } from "../db.js";
import {
  generateToken,
  sha256Hex,
  verifyPassword,
  addDaysIso,
  SESSION_TTL_DAYS,
} from "../auth.js";
import { checkLoginThrottle, recordLoginFailure, clearLoginThrottle } from "../ratelimit.js";
import { requireOperator, isOperatorEmail } from "../middleware.js";

export const opsRoutes = new Hono<AppEnv>();

// ── 헬퍼 ──────────────────────────────────────────────────────────────────

async function createOperatorSession(db: D1Database, userId: string): Promise<string> {
  const token = generateToken();
  const tokenHash = await sha256Hex(token);
  await db
    .prepare(
      "INSERT INTO operator_sessions (id, token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(newId(), tokenHash, userId, addDaysIso(SESSION_TTL_DAYS), nowIso())
    .run();
  return token;
}

/** 운영자 행위는 대상 조직의 감사 로그에 남긴다(그 조직 admin도 볼 수 있어야 한다). */
async function opsAudit(
  db: D1Database,
  args: {
    orgId: string;
    operatorUserId: string;
    operatorEmail: string;
    event: string;
    target: string;
    detail?: Record<string, unknown>;
  },
): Promise<void> {
  await recordAudit(db, {
    orgId: args.orgId,
    actorUserId: args.operatorUserId,
    event: `ops.${args.event}`,
    target: args.target,
    detail: { operator: args.operatorEmail, ...(args.detail ?? {}) },
  });
}

/** 뒤 keep자리만 남기고 마스킹(사업자번호·전화 등). */
function maskTail(value: string | null | undefined, keep = 4): string | null {
  if (!value) return value ?? null;
  const s = String(value).trim();
  if (s.length <= keep) return "•".repeat(s.length);
  return "•".repeat(s.length - keep) + s.slice(-keep);
}

function maskEmail(value: string | null | undefined): string | null {
  if (!value) return value ?? null;
  const [local, domain] = String(value).split("@");
  if (!domain || !local) return maskTail(value, 2);
  return `${local.slice(0, 1)}${"•".repeat(Math.max(1, local.length - 1))}@${domain}`;
}

/** 배열 → CSV(RFC4180 최소 이스케이프). */
function toCsv(rows: Record<string, unknown>[]): string {
  const firstRow = rows[0];
  if (!firstRow) return "";
  const headers = Object.keys(firstRow);
  const esc = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((h) => esc(row[h])).join(","));
  return lines.join("\r\n");
}

// ── 운영자 인증 ────────────────────────────────────────────────────────────

opsRoutes.post("/ops/auth/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const { email, password } = parsed.data;

  const ip = c.req.header("cf-connecting-ip") ?? "unknown";
  const retryAfter = await checkLoginThrottle(c.env.DB, ip, email);
  if (retryAfter !== null) {
    return c.json({ error: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요" }, 429, {
      "Retry-After": String(retryAfter),
    });
  }

  // allowlist 미설정 또는 미등록 이메일 → 자격 없음(비밀번호 오류와 동일 응답으로 사용자 열거 방지).
  const user = await c.env.DB.prepare(
    "SELECT id, email, name, pw_hash, pw_salt FROM users WHERE email = ?",
  )
    .bind(email)
    .first<{ id: string; email: string; name: string; pw_hash: string; pw_salt: string }>();

  const passwordOk = user
    ? await verifyPassword(password, user.pw_hash, user.pw_salt)
    : false;
  const operatorOk =
    !!user && isOperatorEmail(c.env.PLATFORM_OPERATOR_EMAILS, user.email);

  if (!user || !passwordOk || !operatorOk) {
    await recordLoginFailure(c.env.DB, ip, email);
    return c.json({ error: "운영자 계정이 아니거나 인증 정보가 올바르지 않습니다" }, 401);
  }
  await clearLoginThrottle(c.env.DB, ip, email);

  const token = await createOperatorSession(c.env.DB, user.id);
  return c.json({
    token,
    operator: { id: user.id, email: user.email, name: user.name },
  });
});

opsRoutes.post("/ops/auth/logout", requireOperator, async (c) => {
  const header = c.req.header("authorization") ?? c.req.header("Authorization") ?? "";
  const token = header.slice("Bearer ".length).trim();
  const tokenHash = await sha256Hex(token);
  await c.env.DB.prepare("DELETE FROM operator_sessions WHERE token_hash = ?")
    .bind(tokenHash)
    .run();
  return c.json({ ok: true });
});

opsRoutes.get("/ops/me", requireOperator, async (c) => {
  const userId = c.get("operatorUserId");
  const email = c.get("operatorEmail");
  const user = await c.env.DB.prepare("SELECT name FROM users WHERE id = ?")
    .bind(userId)
    .first<{ name: string }>();
  return c.json({ operator: { id: userId, email, name: user?.name ?? email } });
});

// ── 1) 조직 조회 (읽기 중심, 민감정보 마스킹) ────────────────────────────────

opsRoutes.get("/ops/orgs", requireOperator, async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT o.id, o.name, o.created_at,
       (SELECT COUNT(*) FROM memberships m WHERE m.org_id = o.id AND m.active = 1) AS members,
       (SELECT COUNT(*) FROM work_orders w WHERE w.org_id = o.id) AS work_orders,
       (SELECT MAX(updated_at) FROM work_orders w WHERE w.org_id = o.id) AS last_activity
     FROM organizations o
     ORDER BY o.created_at DESC`,
  ).all<{
    id: string;
    name: string;
    created_at: string;
    members: number;
    work_orders: number;
    last_activity: string | null;
  }>();
  return c.json({ orgs: rows.results });
});

opsRoutes.get("/ops/orgs/:id", requireOperator, async (c) => {
  const orgId = c.req.param("id");
  const org = await c.env.DB.prepare(
    "SELECT id, name, created_at FROM organizations WHERE id = ?",
  )
    .bind(orgId)
    .first<{ id: string; name: string; created_at: string }>();
  if (!org) return c.json({ error: "조직을 찾을 수 없습니다" }, 404);

  const profile = await c.env.DB.prepare(
    `SELECT business_no, address, contact_name, contact_phone, contact_email, logo_url, updated_at
     FROM organization_profiles WHERE org_id = ?`,
  )
    .bind(orgId)
    .first<{
      business_no: string | null;
      address: string | null;
      contact_name: string | null;
      contact_phone: string | null;
      contact_email: string | null;
      logo_url: string | null;
      updated_at: string | null;
    }>();

  const members = await c.env.DB.prepare(
    `SELECT u.name, m.role, m.active, m.created_at
     FROM memberships m JOIN users u ON u.id = m.user_id
     WHERE m.org_id = ? ORDER BY m.created_at ASC`,
  )
    .bind(orgId)
    .all<{ name: string; role: string; active: number; created_at: string }>();

  return c.json({
    org,
    // 민감정보 마스킹 — 운영자는 상태 확인만, 원문 열람은 데이터 내보내기(감사 기록)로.
    profile: profile
      ? {
          businessNo: maskTail(profile.business_no),
          address: profile.address, // 주소는 지원 맥락 파악에 필요 — 비마스킹
          contactName: profile.contact_name,
          contactPhone: maskTail(profile.contact_phone),
          contactEmail: maskEmail(profile.contact_email),
          hasLogo: !!profile.logo_url,
          updatedAt: profile.updated_at,
        }
      : null,
    members: members.results.map((m) => ({
      name: m.name,
      role: m.role,
      active: m.active === 1,
      createdAt: m.created_at,
    })),
  });
});

// ── 2) 사용량 조회 (작업·음성분·저장량) ──────────────────────────────────────

opsRoutes.get("/ops/orgs/:id/usage", requireOperator, async (c) => {
  const orgId = c.req.param("id");
  const org = await c.env.DB.prepare("SELECT id FROM organizations WHERE id = ?")
    .bind(orgId)
    .first();
  if (!org) return c.json({ error: "조직을 찾을 수 없습니다" }, 404);

  // D1과 테스트 shim(better-sqlite3) 모두 호환되도록 번호형(?1) 대신 반복 ? 바인딩을 쓴다.
  const usage = await c.env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM work_orders WHERE org_id = ?) AS work_orders,
       (SELECT COUNT(*) FROM report_versions rv JOIN work_orders w ON w.id = rv.work_order_id WHERE w.org_id = ?) AS reports,
       (SELECT COALESCE(SUM(size_bytes), 0) FROM media_assets WHERE org_id = ? AND deleted_at IS NULL) AS storage_bytes,
       (SELECT COUNT(*) FROM media_assets WHERE org_id = ? AND deleted_at IS NULL AND media_type = 'photo') AS photo_count,
       (SELECT COALESCE(SUM(duration_seconds), 0) FROM media_assets WHERE org_id = ? AND deleted_at IS NULL AND media_type = 'audio') AS voice_seconds`,
  )
    .bind(orgId, orgId, orgId, orgId, orgId)
    .first<{
      work_orders: number;
      reports: number;
      storage_bytes: number;
      photo_count: number;
      voice_seconds: number;
    }>();

  return c.json({
    orgId,
    workOrders: usage?.work_orders ?? 0,
    reports: usage?.reports ?? 0,
    storageBytes: usage?.storage_bytes ?? 0,
    photoCount: usage?.photo_count ?? 0,
    voiceMinutes: Math.round(((usage?.voice_seconds ?? 0) / 60) * 10) / 10,
  });
});

// ── 3) 감사 조회 (cross-org, 중요 이벤트 검색) ───────────────────────────────

opsRoutes.get("/ops/audit", requireOperator, async (c) => {
  const orgId = c.req.query("orgId") ?? null;
  const event = c.req.query("event") ?? null;
  const from = c.req.query("from") ?? null;
  const to = c.req.query("to") ?? null;
  const limitRaw = Number.parseInt(c.req.query("limit") ?? "100", 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 100;

  // D1과 테스트 shim(better-sqlite3) 모두 호환되도록 번호형(?1) 대신 반복 ? 바인딩을 쓴다.
  const rows = await c.env.DB.prepare(
    `SELECT ae.id, ae.org_id, ae.actor_user_id, ae.event, ae.target, ae.detail_json, ae.created_at,
       o.name AS org_name
     FROM audit_events ae
     LEFT JOIN organizations o ON o.id = ae.org_id
     WHERE (? IS NULL OR ae.org_id = ?)
       AND (? IS NULL OR ae.event = ?)
       AND (? IS NULL OR ae.created_at >= ?)
       AND (? IS NULL OR ae.created_at <= ?)
     ORDER BY ae.created_at DESC
     LIMIT ?`,
  )
    .bind(orgId, orgId, event, event, from, from, to, to, limit)
    .all<{
      id: string;
      org_id: string;
      actor_user_id: string | null;
      event: string;
      target: string;
      detail_json: string | null;
      created_at: string;
      org_name: string | null;
    }>();

  return c.json({
    events: rows.results.map((e) => ({
      id: e.id,
      orgId: e.org_id,
      orgName: e.org_name,
      actorUserId: e.actor_user_id,
      event: e.event,
      target: e.target,
      detail: parseJson<unknown>(e.detail_json, null),
      createdAt: e.created_at,
    })),
  });
});

// ── 4) 작업 재처리 (AI·PDF 실패 복구, 멱등 리셋 + 결과 로그) ──────────────────

opsRoutes.post("/ops/work-orders/:id/reprocess", requireOperator, async (c) => {
  const workOrderId = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const target = (body?.target ?? "").toString();
  if (target !== "ai" && target !== "pdf") {
    return c.json({ error: "target은 'ai' 또는 'pdf'여야 합니다" }, 400);
  }

  const wo = await c.env.DB.prepare(
    "SELECT id, org_id, ai_status FROM work_orders WHERE id = ?",
  )
    .bind(workOrderId)
    .first<{ id: string; org_id: string; ai_status: string }>();
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  const ts = nowIso();
  let reset = 0;
  if (target === "ai") {
    // 실패한 AI 초안 상태만 pending으로 되돌린다(멱등). 성공 상태는 건드리지 않는다.
    const res = await c.env.DB.prepare(
      "UPDATE work_orders SET ai_status = 'pending', updated_at = ? WHERE id = ? AND ai_status = 'failed'",
    )
      .bind(ts, workOrderId)
      .run();
    reset = res.meta.changes ?? 0;
  } else {
    // 실패한 PDF 산출물을 pending으로 되돌려 다음 요청 시 온디맨드 재생성되게 한다.
    const res = await c.env.DB.prepare(
      `UPDATE report_artifacts
       SET status = 'pending', last_error_code = NULL, last_error_message = NULL, updated_at = ?
       WHERE work_order_id = ? AND org_id = ? AND status = 'failed'`,
    )
      .bind(ts, workOrderId, wo.org_id)
      .run();
    reset = res.meta.changes ?? 0;
  }

  await opsAudit(c.env.DB, {
    orgId: wo.org_id,
    operatorUserId: c.get("operatorUserId"),
    operatorEmail: c.get("operatorEmail"),
    event: "reprocess",
    target: workOrderId,
    detail: { target, resetCount: reset },
  });

  return c.json({ ok: true, target, resetCount: reset });
});

// ── 5) 템플릿 배포 (조직별 템플릿 버전 업로드·활성화) ─────────────────────────

opsRoutes.get("/ops/orgs/:id/templates", requireOperator, async (c) => {
  const orgId = c.req.param("id");
  const rows = await c.env.DB.prepare(
    `SELECT id, version, name, active, uploaded_by, uploaded_at
     FROM org_templates WHERE org_id = ? ORDER BY version DESC`,
  )
    .bind(orgId)
    .all<{
      id: string;
      version: number;
      name: string;
      active: number;
      uploaded_by: string | null;
      uploaded_at: string;
    }>();
  return c.json({
    templates: rows.results.map((t) => ({
      id: t.id,
      version: t.version,
      name: t.name,
      active: t.active === 1,
      uploadedBy: t.uploaded_by,
      uploadedAt: t.uploaded_at,
    })),
  });
});

opsRoutes.post("/ops/orgs/:id/templates", requireOperator, async (c) => {
  const orgId = c.req.param("id");
  const org = await c.env.DB.prepare("SELECT id FROM organizations WHERE id = ?")
    .bind(orgId)
    .first();
  if (!org) return c.json({ error: "조직을 찾을 수 없습니다" }, 404);

  const body = await c.req.json().catch(() => null);
  const name = (body?.name ?? "").toString().trim();
  const config = body?.config;
  if (!name) return c.json({ error: "템플릿 이름이 필요합니다" }, 400);
  if (config === undefined || config === null) {
    return c.json({ error: "템플릿 config가 필요합니다" }, 400);
  }

  const maxRow = await c.env.DB.prepare(
    "SELECT COALESCE(MAX(version), 0) AS max FROM org_templates WHERE org_id = ?",
  )
    .bind(orgId)
    .first<{ max: number }>();
  const version = (maxRow?.max ?? 0) + 1;
  const id = newId();
  const ts = nowIso();

  await c.env.DB.prepare(
    `INSERT INTO org_templates (id, org_id, version, name, config_json, active, uploaded_by, uploaded_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
  )
    .bind(id, orgId, version, name, JSON.stringify(config), c.get("operatorUserId"), ts)
    .run();

  await opsAudit(c.env.DB, {
    orgId,
    operatorUserId: c.get("operatorUserId"),
    operatorEmail: c.get("operatorEmail"),
    event: "template_upload",
    target: id,
    detail: { version, name },
  });

  return c.json({ id, version, name, active: false, uploadedAt: ts });
});

opsRoutes.post("/ops/orgs/:id/templates/:templateId/activate", requireOperator, async (c) => {
  const orgId = c.req.param("id");
  const templateId = c.req.param("templateId");

  const tpl = await c.env.DB.prepare(
    "SELECT id, version FROM org_templates WHERE id = ? AND org_id = ?",
  )
    .bind(templateId, orgId)
    .first<{ id: string; version: number }>();
  if (!tpl) return c.json({ error: "템플릿을 찾을 수 없습니다" }, 404);

  const ts = nowIso();
  // 활성 유일성(org_templates_active_org_uq) 보장: 먼저 전부 비활성화 후 대상만 활성화.
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE org_templates SET active = 0 WHERE org_id = ?").bind(orgId),
    c.env.DB
      .prepare("UPDATE org_templates SET active = 1 WHERE id = ? AND org_id = ?")
      .bind(templateId, orgId),
  ]);

  await opsAudit(c.env.DB, {
    orgId,
    operatorUserId: c.get("operatorUserId"),
    operatorEmail: c.get("operatorEmail"),
    event: "template_activate",
    target: templateId,
    detail: { version: tpl.version },
  });

  return c.json({ ok: true, activeTemplateId: templateId, version: tpl.version, activatedAt: ts });
});

// ── 6) 데이터 내보내기 (해지·이관 지원, CSV·JSON) ────────────────────────────

opsRoutes.get("/ops/orgs/:id/export", requireOperator, async (c) => {
  const orgId = c.req.param("id");
  const format = (c.req.query("format") ?? "json").toLowerCase();
  if (format !== "json" && format !== "csv") {
    return c.json({ error: "format은 'json' 또는 'csv'여야 합니다" }, 400);
  }

  const org = await c.env.DB.prepare(
    "SELECT id, name FROM organizations WHERE id = ?",
  )
    .bind(orgId)
    .first<{ id: string; name: string }>();
  if (!org) return c.json({ error: "조직을 찾을 수 없습니다" }, 404);

  const [customers, sites, assets, workOrders, billing] = await Promise.all([
    c.env.DB.prepare(
      "SELECT id, name, biz_no, address, contact_name, contact_phone, memo, created_at FROM customers WHERE org_id = ? ORDER BY created_at",
    )
      .bind(orgId)
      .all(),
    c.env.DB.prepare(
      "SELECT id, customer_id, name, address, access_info, map_url, created_at FROM sites WHERE org_id = ? ORDER BY created_at",
    )
      .bind(orgId)
      .all(),
    c.env.DB.prepare(
      "SELECT id, site_id, name, model, serial_no, installed_at, created_at FROM assets WHERE org_id = ? ORDER BY created_at",
    )
      .bind(orgId)
      .all(),
    c.env.DB.prepare(
      `SELECT id, customer_id, site_id, asset_id, scheduled_date, work_type, work_status,
              approval_status, billing_status, created_at FROM work_orders WHERE org_id = ? ORDER BY created_at`,
    )
      .bind(orgId)
      .all(),
    c.env.DB.prepare(
      `SELECT b.id, b.work_order_id, b.amount, b.billed_at, b.due_at, b.paid_at, b.memo, b.updated_at
       FROM billing_records b JOIN work_orders w ON w.id = b.work_order_id
       WHERE w.org_id = ? ORDER BY b.updated_at`,
    )
      .bind(orgId)
      .all(),
  ]);

  await opsAudit(c.env.DB, {
    orgId,
    operatorUserId: c.get("operatorUserId"),
    operatorEmail: c.get("operatorEmail"),
    event: "export",
    target: orgId,
    detail: { format },
  });

  const stamp = nowIso();
  if (format === "csv") {
    const sections = [
      `# organization,${org.name},${org.id},${stamp}`,
      "\n## customers\n" + toCsv(customers.results as Record<string, unknown>[]),
      "\n## sites\n" + toCsv(sites.results as Record<string, unknown>[]),
      "\n## assets\n" + toCsv(assets.results as Record<string, unknown>[]),
      "\n## work_orders\n" + toCsv(workOrders.results as Record<string, unknown>[]),
      "\n## billing_records\n" + toCsv(billing.results as Record<string, unknown>[]),
    ];
    return new Response(sections.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="fieldstep-export-${orgId}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return c.json({
    org,
    exportedAt: stamp,
    customers: customers.results,
    sites: sites.results,
    assets: assets.results,
    workOrders: workOrders.results,
    billingRecords: billing.results,
  });
});
