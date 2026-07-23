import { Hono } from "hono";
import {
  workOrderCreateSchema,
  workOrderPatchSchema,
  assignSchema,
  fieldRecordUpsertSchema,
  photoCreateSchema,
  reportPutSchema,
  canTransition,
  RuleBasedDraftEngine,
  formatReportNumber,
  APPROVAL_LINK_TTL_DAYS,
  type UsedPart,
  type StructuredDraft,
} from "@fieldstep/shared";
import type { AppEnv } from "../db.js";
import { newId, nowIso, parseJson, recordAudit, notify } from "../db.js";
import { requireAuth, requireOfficeOrAdmin } from "../middleware.js";
import { generateToken, sha256Hex, addDaysIso } from "../auth.js";
import { z } from "zod";


export const workOrderRoutes = new Hono<AppEnv>();


type WorkOrderRow = {
  id: string;
  customer_id: string;
  site_id: string;
  asset_id: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  work_type: string;
  request: string | null;
  work_status: string;
  approval_status: string;
  billing_status: string;
  ai_status: string;
  started_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  completed_at: string | null;
  canceled_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

async function assigneeNames(db: D1Database, workOrderId: string): Promise<string[]> {
  const rows = await db
    .prepare("SELECT u.name FROM assignments a JOIN users u ON u.id = a.user_id WHERE a.work_order_id = ?")
    .bind(workOrderId)
    .all<{ name: string }>();
  return (rows.results ?? []).map((r) => r.name);
}

async function assigneeIds(db: D1Database, workOrderId: string): Promise<string[]> {
  const rows = await db
    .prepare("SELECT user_id FROM assignments WHERE work_order_id = ?")
    .bind(workOrderId)
    .all<{ user_id: string }>();
  return (rows.results ?? []).map((r) => r.user_id);
}

async function allActiveMembers(db: D1Database, orgId: string, userIds: string[]): Promise<boolean> {
  if (userIds.length === 0) return true;
  const placeholders = userIds.map(() => "?").join(", ");
  const rows = await db
    .prepare(`SELECT user_id FROM memberships WHERE org_id = ? AND active = 1 AND user_id IN (${placeholders})`)
    .bind(orgId, ...userIds)
    .all<{ user_id: string }>();
  const found = new Set((rows.results ?? []).map((r) => r.user_id));
  return userIds.every((uid) => found.has(uid));
}

const cancelSchema = z.object({ reason: z.string().min(1) });

async function isAssigned(db: D1Database, workOrderId: string, userId: string): Promise<boolean> {
  const row = await db
    .prepare("SELECT 1 FROM assignments WHERE work_order_id = ? AND user_id = ?")
    .bind(workOrderId, userId)
    .first();
  return !!row;
}

function summaryOf(r: WorkOrderRow, customerName: string, siteName: string, names: string[]) {
  return {
    id: r.id,
    workStatus: r.work_status,
    approvalStatus: r.approval_status,
    billingStatus: r.billing_status,
    scheduledDate: r.scheduled_date,
    scheduledTime: r.scheduled_time,
    workType: r.work_type,
    customerName,
    siteName,
    assigneeNames: names,
  };
}

// ---------------------------------------------------------------------------
// GET /work-orders
// ---------------------------------------------------------------------------

workOrderRoutes.get("/work-orders", requireAuth, async (c) => {
  const orgId = c.get("orgId");
  const role = c.get("role");
  const date = c.req.query("date");
  const status = c.req.query("status");
  const mine = c.req.query("mine") === "1" || role === "field";

  const conditions = ["wo.org_id = ?"];
  const params: unknown[] = [orgId];
  if (date) {
    conditions.push("wo.scheduled_date = ?");
    params.push(date);
  }
  if (status) {
    conditions.push("wo.work_status = ?");
    params.push(status);
  }
  if (mine) {
    conditions.push("EXISTS (SELECT 1 FROM assignments a WHERE a.work_order_id = wo.id AND a.user_id = ?)");
    params.push(c.get("userId"));
  }

  const rows = await c.env.DB.prepare(
    `SELECT wo.*, c.name AS customer_name, s.name AS site_name
     FROM work_orders wo
     JOIN customers c ON c.id = wo.customer_id
     JOIN sites s ON s.id = wo.site_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY wo.scheduled_date DESC, wo.scheduled_time ASC`,
  )
    .bind(...params)
    .all<WorkOrderRow & { customer_name: string; site_name: string }>();

  const workOrders = await Promise.all(
    (rows.results ?? []).map(async (r) => summaryOf(r, r.customer_name, r.site_name, await assigneeNames(c.env.DB, r.id))),
  );

  return c.json({ workOrders });
});

// ---------------------------------------------------------------------------
// POST /work-orders
// ---------------------------------------------------------------------------

workOrderRoutes.post("/work-orders", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const body = await c.req.json().catch(() => null);
  const parsed = workOrderCreateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const d = parsed.data;

  const customer = await c.env.DB.prepare("SELECT id FROM customers WHERE org_id = ? AND id = ?")
    .bind(orgId, d.customerId)
    .first();
  if (!customer) return c.json({ error: "고객을 찾을 수 없습니다" }, 400);
  const site = await c.env.DB.prepare("SELECT id FROM sites WHERE org_id = ? AND id = ?")
    .bind(orgId, d.siteId)
    .first();
  if (!site) return c.json({ error: "현장을 찾을 수 없습니다" }, 400);
  if (!(await allActiveMembers(c.env.DB, orgId, d.assigneeIds))) {
    return c.json({ error: "배정 대상이 유효하지 않습니다" }, 400);
  }

  const id = newId();
  const ts = nowIso();
  await c.env.DB.prepare(
    `INSERT INTO work_orders
       (id, org_id, customer_id, site_id, asset_id, scheduled_date, scheduled_time, work_type, request,
        work_status, approval_status, billing_status, ai_status, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', 'not_sent', 'none', 'idle', ?, ?, ?)`,
  )
    .bind(
      id,
      orgId,
      d.customerId,
      d.siteId,
      d.assetId ?? null,
      d.scheduledDate,
      d.scheduledTime ?? null,
      d.workType,
      d.request ?? null,
      c.get("userId"),
      ts,
      ts,
    )
    .run();

  for (const userId of d.assigneeIds) {
    await c.env.DB.prepare("INSERT INTO assignments (id, work_order_id, user_id) VALUES (?, ?, ?)")
      .bind(newId(), id, userId)
      .run();
    await notify(c.env.DB, {
      orgId,
      userId,
      type: "assigned",
      workOrderId: id,
      message: `${d.scheduledDate} ${d.workType} 작업이 배정되었습니다`,
    });
  }

  await recordAudit(c.env.DB, { orgId, actorUserId: c.get("userId"), event: "work_order_created", target: id });

  const row = await c.env.DB.prepare("SELECT * FROM work_orders WHERE id = ?").bind(id).first<WorkOrderRow>();
  return c.json({
    workOrder: {
      ...summaryOf(row!, "", "", []),
      customerId: d.customerId,
      siteId: d.siteId,
      assetId: d.assetId ?? null,
      request: d.request ?? null,
      assigneeIds: d.assigneeIds,
      createdAt: ts,
      updatedAt: ts,
    },
  });
});

// ---------------------------------------------------------------------------
// GET /work-orders/:id
// ---------------------------------------------------------------------------

async function loadWorkOrder(db: D1Database, orgId: string, id: string): Promise<WorkOrderRow | null> {
  return db.prepare("SELECT * FROM work_orders WHERE org_id = ? AND id = ?").bind(orgId, id).first<WorkOrderRow>();
}

/** field 역할은 본인 배정 작업만 접근 가능 — 조회 대상 미배정 시 404(존재 노출 방지). */
async function guardAccess(c: any, wo: WorkOrderRow): Promise<boolean> {
  if (c.get("role") !== "field") return true;
  return isAssigned(c.env.DB, wo.id, c.get("userId"));
}

workOrderRoutes.get("/work-orders/:id", requireAuth, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  if (!(await guardAccess(c, wo))) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  const customer = await c.env.DB.prepare(
    "SELECT id, name, biz_no, address, contact_name, contact_phone, memo FROM customers WHERE id = ?",
  )
    .bind(wo.customer_id)
    .first<{ id: string; name: string; biz_no: string | null; address: string | null; contact_name: string | null; contact_phone: string | null; memo: string | null }>();
  const site = await c.env.DB.prepare(
    "SELECT id, customer_id, name, address, access_info, map_url FROM sites WHERE id = ?",
  )
    .bind(wo.site_id)
    .first<{ id: string; customer_id: string; name: string; address: string | null; access_info: string | null; map_url: string | null }>();
  const asset = wo.asset_id
    ? await c.env.DB.prepare("SELECT id, site_id, name, model, serial_no, installed_at FROM assets WHERE id = ?")
        .bind(wo.asset_id)
        .first<{ id: string; site_id: string; name: string; model: string | null; serial_no: string | null; installed_at: string | null }>()
    : null;

  const assigneeRows = await c.env.DB.prepare(
    `SELECT u.id, u.email, u.name, m.role, m.active
     FROM assignments a JOIN users u ON u.id = a.user_id JOIN memberships m ON m.user_id = u.id AND m.org_id = ?
     WHERE a.work_order_id = ?`,
  )
    .bind(orgId, id)
    .all<{ id: string; email: string; name: string; role: string; active: number }>();

  const fieldRecordRow = await c.env.DB.prepare(
    "SELECT work_order_id, work_summary, transcript, parts_json, issues, notes, next_inspection_date, updated_at FROM field_records WHERE work_order_id = ?",
  )
    .bind(id)
    .first<{
      work_order_id: string;
      work_summary: string | null;
      transcript: string | null;
      parts_json: string | null;
      issues: string | null;
      notes: string | null;
      next_inspection_date: string | null;
      updated_at: string;
    }>();

  const photoRows = await c.env.DB.prepare(
    "SELECT id, work_order_id, kind, data_url, caption, created_at FROM photos WHERE work_order_id = ? ORDER BY created_at ASC",
  )
    .bind(id)
    .all<{ id: string; work_order_id: string; kind: string; data_url: string; caption: string | null; created_at: string }>();

  const draftRow = await c.env.DB.prepare(
    "SELECT structured_json FROM report_drafts WHERE work_order_id = ?",
  )
    .bind(id)
    .first<{ structured_json: string }>();

  const versionRows = await c.env.DB.prepare(
    "SELECT id, work_order_id, version, report_number, created_at, created_by FROM report_versions WHERE work_order_id = ? ORDER BY version ASC",
  )
    .bind(id)
    .all<{ id: string; work_order_id: string; version: number; report_number: string; created_at: string; created_by: string }>();

  const approvalRow = await c.env.DB.prepare(
    `SELECT ar.id, ar.status, ar.sent_at, ar.expires_at, ar.decided_at,
            sig.name AS approver_name, sig.title AS approver_title
     FROM approval_requests ar
     LEFT JOIN signatures sig ON sig.approval_request_id = ar.id
     WHERE ar.work_order_id = ? ORDER BY ar.sent_at DESC LIMIT 1`,
  )
    .bind(id)
    .first<{
      id: string;
      status: string;
      sent_at: string;
      expires_at: string;
      decided_at: string | null;
      approver_name: string | null;
      approver_title: string | null;
    }>();

  let revisionComment: string | null = null;
  if (approvalRow && approvalRow.status === "revision_requested") {
    // revision 코멘트는 별도 저장소가 없으므로 감사 로그에서 최근 항목을 조회
    const auditRow = await c.env.DB.prepare(
      "SELECT detail_json FROM audit_events WHERE org_id = ? AND target = ? AND event = 'revision_requested' ORDER BY created_at DESC LIMIT 1",
    )
      .bind(orgId, id)
      .first<{ detail_json: string | null }>();
    if (auditRow?.detail_json) {
      revisionComment = parseJson<{ comment?: string }>(auditRow.detail_json, {}).comment ?? null;
    }
  }

  const billingRow = await c.env.DB.prepare(
    "SELECT amount, billed_at, due_at, paid_at, memo FROM billing_records WHERE work_order_id = ?",
  )
    .bind(id)
    .first<{ amount: number | null; billed_at: string | null; due_at: string | null; paid_at: string | null; memo: string | null }>();

  return c.json({
    workOrder: {
      ...summaryOf(wo, customer?.name ?? "", site?.name ?? "", (assigneeRows.results ?? []).map((a) => a.name)),
      customerId: wo.customer_id,
      siteId: wo.site_id,
      assetId: wo.asset_id,
      request: wo.request,
      assigneeIds: (assigneeRows.results ?? []).map((a) => a.id),
      createdAt: wo.created_at,
      updatedAt: wo.updated_at,
    },
    customer: customer
      ? {
          id: customer.id,
          name: customer.name,
          bizNo: customer.biz_no,
          address: customer.address,
          contactName: customer.contact_name,
          contactPhone: customer.contact_phone,
          memo: customer.memo,
        }
      : null,
    site: site
      ? { id: site.id, customerId: site.customer_id, name: site.name, address: site.address, accessInfo: site.access_info, mapUrl: site.map_url }
      : null,
    asset: asset
      ? { id: asset.id, siteId: asset.site_id, name: asset.name, model: asset.model, serialNo: asset.serial_no, installedAt: asset.installed_at }
      : null,
    assignees: (assigneeRows.results ?? []).map((a) => ({ id: a.id, email: a.email, name: a.name, role: a.role, active: !!a.active })),
    fieldRecord: fieldRecordRow
      ? {
          workOrderId: fieldRecordRow.work_order_id,
          workSummary: fieldRecordRow.work_summary,
          transcript: fieldRecordRow.transcript,
          parts: parseJson<UsedPart[]>(fieldRecordRow.parts_json, []),
          issues: fieldRecordRow.issues,
          notes: fieldRecordRow.notes,
          nextInspectionDate: fieldRecordRow.next_inspection_date,
          updatedAt: fieldRecordRow.updated_at,
        }
      : null,
    photos: (photoRows.results ?? []).map((p) => ({
      id: p.id,
      workOrderId: p.work_order_id,
      kind: p.kind,
      url: p.data_url,
      caption: p.caption,
      createdAt: p.created_at,
    })),
    draft: draftRow ? parseJson(draftRow.structured_json, null) : null,
    reportVersions: (versionRows.results ?? []).map((v) => ({
      id: v.id,
      workOrderId: v.work_order_id,
      reportNumber: v.report_number,
      version: v.version,
      createdAt: v.created_at,
      createdBy: v.created_by,
    })),
    approval: approvalRow
      ? {
          workOrderId: id,
          status: wo.approval_status,
          requestedAt: approvalRow.sent_at,
          expiresAt: approvalRow.expires_at,
          approvedAt: approvalRow.status === "approved" ? approvalRow.decided_at : null,
          approverName: approvalRow.approver_name,
          approverTitle: approvalRow.approver_title,
          revisionComment,
        }
      : null,
    billing: billingRow
      ? {
          workOrderId: id,
          status: wo.billing_status,
          amount: billingRow.amount,
          billedAt: billingRow.billed_at,
          dueAt: billingRow.due_at,
          paidAt: billingRow.paid_at,
          memo: billingRow.memo,
        }
      : null,
  });
});

// ---------------------------------------------------------------------------
// PATCH /work-orders/:id
// ---------------------------------------------------------------------------

workOrderRoutes.patch("/work-orders/:id", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  const body = await c.req.json().catch(() => null);
  const parsed = workOrderPatchSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const d = parsed.data;
  if (d.customerId) {
    const customer = await c.env.DB.prepare("SELECT id FROM customers WHERE org_id = ? AND id = ?")
      .bind(orgId, d.customerId)
      .first();
    if (!customer) return c.json({ error: "고객/현장/장비를 찾을 수 없습니다" }, 400);
  }
  if (d.siteId) {
    const site = await c.env.DB.prepare("SELECT id FROM sites WHERE org_id = ? AND id = ?")
      .bind(orgId, d.siteId)
      .first();
    if (!site) return c.json({ error: "고객/현장/장비를 찾을 수 없습니다" }, 400);
  }
  if (d.assetId) {
    const asset = await c.env.DB.prepare("SELECT id FROM assets WHERE org_id = ? AND id = ?")
      .bind(orgId, d.assetId)
      .first();
    if (!asset) return c.json({ error: "고객/현장/장비를 찾을 수 없습니다" }, 400);
  }
  if (d.assigneeIds && !(await allActiveMembers(c.env.DB, orgId, d.assigneeIds))) {
    return c.json({ error: "배정 대상이 유효하지 않습니다" }, 400);
  }

  const merged = {
    scheduledDate: d.scheduledDate ?? wo.scheduled_date,
    scheduledTime: d.scheduledTime ?? wo.scheduled_time,
    workType: d.workType ?? wo.work_type,
    request: d.request ?? wo.request,
    customerId: d.customerId ?? wo.customer_id,
    siteId: d.siteId ?? wo.site_id,
    assetId: d.assetId ?? wo.asset_id,
  };

  await c.env.DB.prepare(
    `UPDATE work_orders SET scheduled_date = ?, scheduled_time = ?, work_type = ?, request = ?,
       customer_id = ?, site_id = ?, asset_id = ?, updated_at = ? WHERE id = ?`,
  )
    .bind(
      merged.scheduledDate,
      merged.scheduledTime,
      merged.workType,
      merged.request,
      merged.customerId,
      merged.siteId,
      merged.assetId,
      nowIso(),
      id,
    )
    .run();

  if (d.assigneeIds) {
    await c.env.DB.prepare("DELETE FROM assignments WHERE work_order_id = ?").bind(id).run();
    for (const userId of d.assigneeIds) {
      await c.env.DB.prepare("INSERT INTO assignments (id, work_order_id, user_id) VALUES (?, ?, ?)")
        .bind(newId(), id, userId)
        .run();
    }
  }

  const updated = await loadWorkOrder(c.env.DB, orgId, id);
  return c.json({
    workOrder: {
      ...summaryOf(updated!, "", "", await assigneeNames(c.env.DB, id)),
      customerId: updated!.customer_id,
      siteId: updated!.site_id,
      assetId: updated!.asset_id,
      request: updated!.request,
      assigneeIds: await assigneeIds(c.env.DB, id),
      createdAt: updated!.created_at,
      updatedAt: updated!.updated_at,
    },
  });
});

workOrderRoutes.post("/work-orders/:id/assign", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  const body = await c.req.json().catch(() => null);
  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  if (!(await allActiveMembers(c.env.DB, orgId, parsed.data.userIds))) {
    return c.json({ error: "배정 대상이 유효하지 않습니다" }, 400);
  }

  await c.env.DB.prepare("DELETE FROM assignments WHERE work_order_id = ?").bind(id).run();
  for (const userId of parsed.data.userIds) {
    await c.env.DB.prepare("INSERT INTO assignments (id, work_order_id, user_id) VALUES (?, ?, ?)")
      .bind(newId(), id, userId)
      .run();
    await notify(c.env.DB, { orgId, userId, type: "assigned", workOrderId: id, message: `${wo.scheduled_date} ${wo.work_type} 작업이 배정되었습니다` });
  }

  return c.json({
    workOrder: {
      ...summaryOf(wo, "", "", await assigneeNames(c.env.DB, id)),
      customerId: wo.customer_id,
      siteId: wo.site_id,
      assetId: wo.asset_id,
      request: wo.request,
      assigneeIds: parsed.data.userIds,
      createdAt: wo.created_at,
      updatedAt: wo.updated_at,
    },
  });
});

// ---------------------------------------------------------------------------
// POST /work-orders/:id/start
// ---------------------------------------------------------------------------

workOrderRoutes.post("/work-orders/:id/start", requireAuth, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  const role = c.get("role");
  if (role === "field" && !(await isAssigned(c.env.DB, id, c.get("userId")))) {
    return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  }
  if (role !== "office" && role !== "admin" && role !== "field") {
    return c.json({ error: "권한이 없습니다" }, 403);
  }

  if (!canTransition("work", wo.work_status as any, "in_progress")) {
    return c.json({ error: `현재 상태(${wo.work_status})에서 시작할 수 없습니다` }, 409);
  }

  const ts = nowIso();
  await c.env.DB.prepare("UPDATE work_orders SET work_status = 'in_progress', started_at = ?, updated_at = ? WHERE id = ?")
    .bind(ts, ts, id)
    .run();
  await recordAudit(c.env.DB, { orgId, actorUserId: c.get("userId"), event: "work_started", target: id });

  return c.json({ ok: true, startedAt: ts, workStatus: "in_progress" });
});


// ---------------------------------------------------------------------------
// POST /work-orders/:id/complete
// ---------------------------------------------------------------------------

workOrderRoutes.post("/work-orders/:id/complete", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  if (!canTransition("work", wo.work_status as any, "completed")) {
    return c.json({ error: `현재 상태(${wo.work_status})에서 완료 처리할 수 없습니다` }, 409);
  }

  const ts = nowIso();
  await c.env.DB.prepare("UPDATE work_orders SET work_status = 'completed', completed_at = ?, updated_at = ? WHERE id = ?")
    .bind(ts, ts, id)
    .run();
  await recordAudit(c.env.DB, { orgId, actorUserId: c.get("userId"), event: "work_completed", target: id });

  return c.json({ ok: true, completedAt: ts, workStatus: "completed" });
});

// ---------------------------------------------------------------------------
// POST /work-orders/:id/cancel
// ---------------------------------------------------------------------------

workOrderRoutes.post("/work-orders/:id/cancel", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  const body = await c.req.json().catch(() => null);
  const parsed = cancelSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);

  if (!canTransition("work", wo.work_status as any, "canceled")) {
    return c.json({ error: `현재 상태(${wo.work_status})에서 취소할 수 없습니다` }, 409);
  }

  const ts = nowIso();
  await c.env.DB.prepare("UPDATE work_orders SET work_status = 'canceled', canceled_at = ?, updated_at = ? WHERE id = ?")
    .bind(ts, ts, id)
    .run();
  await recordAudit(c.env.DB, {
    orgId,
    actorUserId: c.get("userId"),
    event: "work_canceled",
    target: id,
    detail: { reason: parsed.data.reason },
  });

  return c.json({ ok: true, canceledAt: ts, workStatus: "canceled" });
});

// ---------------------------------------------------------------------------
// PUT /work-orders/:id/field-record
// ---------------------------------------------------------------------------

workOrderRoutes.put("/work-orders/:id/field-record", requireAuth, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  if (!(await guardAccess(c, wo))) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  if (wo.work_status !== "in_progress") {
    return c.json({ error: "진행중 상태에서만 기록할 수 있습니다" }, 409);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = fieldRecordUpsertSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const d = parsed.data;

  const existing = await c.env.DB.prepare("SELECT id, next_inspection_date FROM field_records WHERE work_order_id = ?")
    .bind(id)
    .first<{ id: string; next_inspection_date: string | null }>();
  const ts = nowIso();
  const partsJson = d.parts !== undefined ? JSON.stringify(d.parts) : undefined;
  const nextInspectionDate =
    d.nextInspectionDate !== undefined ? d.nextInspectionDate : (existing?.next_inspection_date ?? null);

  if (existing) {
    await c.env.DB.prepare(
      `UPDATE field_records SET
         work_summary = COALESCE(?, work_summary),
         transcript = COALESCE(?, transcript),
         parts_json = COALESCE(?, parts_json),
         issues = COALESCE(?, issues),
         notes = COALESCE(?, notes),
         next_inspection_date = ?,
         updated_at = ?
       WHERE work_order_id = ?`,
    )
      .bind(
        d.workSummary ?? null,
        d.transcript ?? null,
        partsJson ?? null,
        d.issues ?? null,
        d.notes ?? null,
        nextInspectionDate,
        ts,
        id,
      )
      .run();
  } else {
    await c.env.DB.prepare(
      `INSERT INTO field_records (id, work_order_id, work_summary, transcript, parts_json, issues, notes, next_inspection_date, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        newId(),
        id,
        d.workSummary ?? null,
        d.transcript ?? null,
        partsJson ?? "[]",
        d.issues ?? null,
        d.notes ?? null,
        d.nextInspectionDate ?? null,
        ts,
      )
      .run();
  }

  const saved = await c.env.DB.prepare(
    "SELECT work_order_id, work_summary, transcript, parts_json, issues, notes, next_inspection_date, updated_at FROM field_records WHERE work_order_id = ?",
  )
    .bind(id)
    .first<{
      work_order_id: string;
      work_summary: string | null;
      transcript: string | null;
      parts_json: string | null;
      issues: string | null;
      notes: string | null;
      next_inspection_date: string | null;
      updated_at: string;
    }>();

  return c.json({
    fieldRecord: {
      workOrderId: saved!.work_order_id,
      workSummary: saved!.work_summary,
      transcript: saved!.transcript,
      parts: parseJson<UsedPart[]>(saved!.parts_json, []),
      issues: saved!.issues,
      notes: saved!.notes,
      nextInspectionDate: saved!.next_inspection_date,
      updatedAt: saved!.updated_at,
    },
  });
});

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

workOrderRoutes.post("/work-orders/:id/photos", requireAuth, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  if (!(await guardAccess(c, wo))) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  if (wo.work_status !== "in_progress" && wo.work_status !== "submitted") {
    return c.json({ error: "진행중 또는 제출 상태에서만 사진을 추가할 수 있습니다" }, 409);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = photoCreateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const d = parsed.data;

  const photoId = newId();
  const ts = nowIso();
  await c.env.DB.prepare(
    "INSERT INTO photos (id, work_order_id, kind, data_url, caption, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind(photoId, id, d.kind, d.dataUrl, d.caption ?? null, ts)
    .run();

  return c.json({ photo: { id: photoId, workOrderId: id, kind: d.kind, url: d.dataUrl, caption: d.caption ?? null, createdAt: ts } });
});

workOrderRoutes.delete("/work-orders/:id/photos/:photoId", requireAuth, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const photoId = c.req.param("photoId");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  if (!(await guardAccess(c, wo))) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  if (wo.work_status !== "in_progress" && wo.work_status !== "submitted") {
    return c.json({ error: "진행중 또는 제출 상태에서만 사진을 삭제할 수 있습니다" }, 409);
  }

  await c.env.DB.prepare("DELETE FROM photos WHERE id = ? AND work_order_id = ?").bind(photoId, id).run();
  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// POST /work-orders/:id/submit
// ---------------------------------------------------------------------------

workOrderRoutes.post("/work-orders/:id/submit", requireAuth, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  if (!(await guardAccess(c, wo))) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  if (!canTransition("work", wo.work_status as any, "submitted")) {
    return c.json({ error: `현재 상태(${wo.work_status})에서 제출할 수 없습니다` }, 409);
  }

  const fr = await c.env.DB.prepare(
    "SELECT work_summary, transcript, parts_json, issues, next_inspection_date FROM field_records WHERE work_order_id = ?",
  )
    .bind(id)
    .first<{ work_summary: string | null; transcript: string | null; parts_json: string | null; issues: string | null; next_inspection_date: string | null }>();

  const ts = nowIso();
  let aiStatus = "drafted";
  let generatedDraft: StructuredDraft | null = null;
  try {
    const engine = new RuleBasedDraftEngine();
    const draft = await engine.generate({
      transcript: fr?.transcript ?? "",
      workSummary: fr?.work_summary ?? undefined,
      parts: parseJson<UsedPart[]>(fr?.parts_json, []),
      issues: fr?.issues ?? undefined,
      nextInspectionDate: fr?.next_inspection_date ?? null,
    });
    generatedDraft = draft;

    const existingDraft = await c.env.DB.prepare("SELECT id FROM report_drafts WHERE work_order_id = ?").bind(id).first<{ id: string }>();
    if (existingDraft) {
      await c.env.DB.prepare("UPDATE report_drafts SET structured_json = ?, updated_at = ? WHERE work_order_id = ?")
        .bind(JSON.stringify(draft), ts, id)
        .run();
    } else {
      await c.env.DB.prepare(
        "INSERT INTO report_drafts (id, work_order_id, structured_json, updated_at) VALUES (?, ?, ?, ?)",
      )
        .bind(newId(), id, JSON.stringify(draft), ts)
        .run();
    }
  } catch {
    aiStatus = "failed";
  }

  await c.env.DB.prepare(
    "UPDATE work_orders SET work_status = 'submitted', submitted_at = ?, ai_status = ?, updated_at = ? WHERE id = ?",
  )
    .bind(ts, aiStatus, ts, id)
    .run();

  const officeMembers = await c.env.DB.prepare(
    "SELECT user_id FROM memberships WHERE org_id = ? AND role IN ('office', 'admin') AND active = 1",
  )
    .bind(orgId)
    .all<{ user_id: string }>();
  for (const m of officeMembers.results ?? []) {
    await notify(c.env.DB, { orgId, userId: m.user_id, type: "submitted", workOrderId: id, message: `${wo.work_type} 작업이 제출되었습니다` });
  }

  await recordAudit(c.env.DB, { orgId, actorUserId: c.get("userId"), event: "work_submitted", target: id, detail: { aiStatus } });

  return c.json({ ok: true, submittedAt: ts, workStatus: "submitted", aiStatus, draft: generatedDraft });
});

// ---------------------------------------------------------------------------
// PUT /work-orders/:id/report
// ---------------------------------------------------------------------------

workOrderRoutes.put("/work-orders/:id/report", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  if (wo.work_status !== "submitted") {
    return c.json({ error: "제출된 리포트만 수정할 수 있습니다 (확정 후에는 새 버전이 필요합니다)" }, 409);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = reportPutSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);

  const ts = nowIso();
  const existing = await c.env.DB.prepare("SELECT id FROM report_drafts WHERE work_order_id = ?").bind(id).first<{ id: string }>();
  if (existing) {
    await c.env.DB.prepare("UPDATE report_drafts SET structured_json = ?, updated_at = ? WHERE work_order_id = ?")
      .bind(JSON.stringify(parsed.data.structured), ts, id)
      .run();
  } else {
    await c.env.DB.prepare("INSERT INTO report_drafts (id, work_order_id, structured_json, updated_at) VALUES (?, ?, ?, ?)")
      .bind(newId(), id, JSON.stringify(parsed.data.structured), ts)
      .run();
  }

  return c.json({ draft: parsed.data.structured });
});

// ---------------------------------------------------------------------------
// POST /work-orders/:id/report/finalize
// ---------------------------------------------------------------------------

workOrderRoutes.post("/work-orders/:id/report/finalize", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  if (!canTransition("work", wo.work_status as any, "reviewed")) {
    return c.json({ error: `현재 상태(${wo.work_status})에서 확정할 수 없습니다` }, 409);
  }

  const draftRow = await c.env.DB.prepare("SELECT structured_json FROM report_drafts WHERE work_order_id = ?").bind(id).first<{ structured_json: string }>();
  if (!draftRow) return c.json({ error: "초안이 없습니다" }, 400);

  const photoRows = await c.env.DB.prepare(
    "SELECT id, work_order_id, kind, data_url, caption, created_at FROM photos WHERE work_order_id = ? ORDER BY created_at ASC",
  )
    .bind(id)
    .all<{ id: string; work_order_id: string; kind: string; data_url: string; caption: string | null; created_at: string }>();

  const seqRow = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM report_versions rv JOIN work_orders w ON w.id = rv.work_order_id WHERE w.org_id = ?`,
  )
    .bind(orgId)
    .first<{ n: number }>();
  const seq = (seqRow?.n ?? 0) + 1;

  const versionCountRow = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM report_versions WHERE work_order_id = ?")
    .bind(id)
    .first<{ n: number }>();
  const version = (versionCountRow?.n ?? 0) + 1;

  const reportNumber = formatReportNumber("FS", wo.scheduled_date, seq);
  const versionId = newId();
  const ts = nowIso();

  await c.env.DB.prepare(
    `INSERT INTO report_versions (id, work_order_id, version, report_number, structured_json, photos_json, template_version, created_by, created_at, locked_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
  )
    .bind(
      versionId,
      id,
      version,
      reportNumber,
      draftRow.structured_json,
      JSON.stringify(
        (photoRows.results ?? []).map((p) => ({ id: p.id, kind: p.kind, url: p.data_url, caption: p.caption, createdAt: p.created_at })),
      ),
      c.get("userId"),
      ts,
    )
    .run();

  await c.env.DB.prepare("UPDATE work_orders SET work_status = 'reviewed', reviewed_at = ?, updated_at = ? WHERE id = ?")
    .bind(ts, ts, id)
    .run();

  await recordAudit(c.env.DB, { orgId, actorUserId: c.get("userId"), event: "report_finalized", target: id, detail: { version, reportNumber } });

  return c.json({ reportVersion: { id: versionId, workOrderId: id, reportNumber, version, createdAt: ts, createdBy: c.get("userId") } });
});

// ---------------------------------------------------------------------------
// GET /work-orders/:id/report-versions/:version — 불변 스냅샷(인쇄·이력용)
// ---------------------------------------------------------------------------

workOrderRoutes.get("/work-orders/:id/report-versions/:version", requireAuth, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  if (!(await guardAccess(c, wo))) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  const versionNo = Number(c.req.param("version"));
  if (!Number.isInteger(versionNo) || versionNo < 1) return c.json({ error: "버전이 올바르지 않습니다" }, 400);

  const version = await c.env.DB.prepare(
    `SELECT id, work_order_id, version, report_number, structured_json, photos_json, template_version, created_at, created_by, locked_at
     FROM report_versions WHERE work_order_id = ? AND version = ?`,
  )
    .bind(id, versionNo)
    .first<{
      id: string;
      work_order_id: string;
      version: number;
      report_number: string;
      structured_json: string;
      photos_json: string;
      template_version: number;
      created_at: string;
      created_by: string;
      locked_at: string | null;
    }>();
  if (!version) return c.json({ error: "보고서 버전을 찾을 수 없습니다" }, 404);

  const signature = await c.env.DB.prepare(
    `SELECT sig.name, sig.title, sig.signature_data_url, sig.approved_at
     FROM signatures sig JOIN approval_requests ar ON ar.id = sig.approval_request_id
     WHERE ar.report_version_id = ? AND ar.status = 'approved'
     ORDER BY sig.approved_at DESC LIMIT 1`,
  )
    .bind(version.id)
    .first<{ name: string; title: string | null; signature_data_url: string; approved_at: string }>();

  return c.json({
    reportVersion: {
      id: version.id,
      workOrderId: version.work_order_id,
      version: version.version,
      reportNumber: version.report_number,
      structured: parseJson(version.structured_json, null),
      photos: parseJson(version.photos_json, []),
      templateVersion: version.template_version,
      createdAt: version.created_at,
      createdBy: version.created_by,
      lockedAt: version.locked_at,
      signature: signature
        ? { name: signature.name, title: signature.title, signatureDataUrl: signature.signature_data_url, approvedAt: signature.approved_at }
        : null,
    },
  });
});

// ---------------------------------------------------------------------------
// POST /work-orders/:id/approval-links
// ---------------------------------------------------------------------------

workOrderRoutes.post("/work-orders/:id/approval-links", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await loadWorkOrder(c.env.DB, orgId, id);
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  const latestVersion = await c.env.DB.prepare(
    "SELECT id FROM report_versions WHERE work_order_id = ? ORDER BY version DESC LIMIT 1",
  )
    .bind(id)
    .first<{ id: string }>();
  if (!latestVersion) return c.json({ error: "확정된 리포트가 없습니다" }, 400);

  if (wo.approval_status !== "pending" && !canTransition("approval", wo.approval_status as any, "pending")) {
    return c.json({ error: `현재 승인 상태(${wo.approval_status})에서 발송할 수 없습니다` }, 409);
  }

  // 이전 pending 링크 무효화
  await c.env.DB.prepare("UPDATE approval_requests SET status = 'expired' WHERE work_order_id = ? AND status = 'pending'")
    .bind(id)
    .run();

  const token = generateToken();
  const tokenHash = await sha256Hex(token);
  const requestId = newId();
  const ts = nowIso();
  const expiresAt = addDaysIso(APPROVAL_LINK_TTL_DAYS);

  await c.env.DB.prepare(
    `INSERT INTO approval_requests (id, work_order_id, report_version_id, token_hash, expires_at, sent_at, viewed_at, decided_at, status)
     VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, 'pending')`,
  )
    .bind(requestId, id, latestVersion.id, tokenHash, expiresAt, ts)
    .run();

  await c.env.DB.prepare("UPDATE work_orders SET approval_status = 'pending', updated_at = ? WHERE id = ?").bind(ts, id).run();
  await recordAudit(c.env.DB, { orgId, actorUserId: c.get("userId"), event: "approval_link_created", target: id });

  const origin = c.env.APP_ORIGIN ?? "https://field.toris.kr";
  return c.json({ url: `${origin}/approval?token=${token}`, token, expiresAt });
});
