import { Hono } from "hono";
import { approveSchema, revisionRequestSchema, canTransition } from "@fieldstep/shared";
import type { AppEnv } from "../db.js";
import { newId, nowIso, parseJson, recordAudit, notify } from "../db.js";
import { sha256Hex } from "../auth.js";

export const publicRoutes = new Hono<AppEnv>();

type ApprovalRequestRow = {
  id: string;
  work_order_id: string;
  report_version_id: string;
  expires_at: string;
  sent_at: string;
  viewed_at: string | null;
  decided_at: string | null;
  status: string;
};

async function loadApprovalByToken(db: D1Database, token: string): Promise<ApprovalRequestRow | null> {
  const tokenHash = await sha256Hex(token);
  return db
    .prepare(
      "SELECT id, work_order_id, report_version_id, expires_at, sent_at, viewed_at, decided_at, status FROM approval_requests WHERE token_hash = ?",
    )
    .bind(tokenHash)
    .first<ApprovalRequestRow>();
}

publicRoutes.get("/public/approvals/:token", async (c) => {
  const token = c.req.param("token");
  const ar = await loadApprovalByToken(c.env.DB, token);
  if (!ar) return c.json({ error: "승인 링크를 찾을 수 없습니다" }, 404);

  const wo = await c.env.DB.prepare(
    "SELECT id, org_id, approval_status, scheduled_date, scheduled_time, work_type, request FROM work_orders WHERE id = ?",
  )
    .bind(ar.work_order_id)
    .first<{
      id: string;
      org_id: string;
      approval_status: string;
      scheduled_date: string;
      scheduled_time: string | null;
      work_type: string;
      request: string | null;
    }>();
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  const isTimeExpired = new Date(ar.expires_at).getTime() < Date.now();
  const isInvalidated = ar.status === "expired";
  if (isTimeExpired || isInvalidated) {
    if (ar.status !== "expired") {
      await c.env.DB.prepare("UPDATE approval_requests SET status = 'expired' WHERE id = ?").bind(ar.id).run();
    }
    if (wo.approval_status !== "approved") {
      await c.env.DB.prepare("UPDATE work_orders SET approval_status = 'expired', updated_at = ? WHERE id = ?")
        .bind(nowIso(), wo.id)
        .run();
    }
    return c.json({ error: "expired", approval: "expired" }, 410);
  }

  const org = await c.env.DB.prepare("SELECT name FROM organizations WHERE id = ?").bind(wo.org_id).first<{ name: string }>();
  const ctx = await c.env.DB.prepare(
    `SELECT c.id AS customer_id, c.name AS customer_name, c.address AS customer_address,
            s.id AS site_id, s.name AS site_name, s.address AS site_address,
            a.id AS asset_id, a.name AS asset_name, a.model AS asset_model, a.serial_no AS asset_serial
     FROM work_orders w
     JOIN customers c ON c.id = w.customer_id
     JOIN sites s ON s.id = w.site_id
     LEFT JOIN assets a ON a.id = w.asset_id
     WHERE w.id = ?`,
  )
    .bind(wo.id)
    .first<{
      customer_id: string;
      customer_name: string;
      customer_address: string | null;
      site_id: string;
      site_name: string;
      site_address: string | null;
      asset_id: string | null;
      asset_name: string | null;
      asset_model: string | null;
      asset_serial: string | null;
    }>();
  const version = await c.env.DB.prepare(
    "SELECT id, work_order_id, version, report_number, structured_json, photos_json, template_version, created_at, created_by FROM report_versions WHERE id = ?",
  )
    .bind(ar.report_version_id)
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
    }>();

  let viewedAt = ar.viewed_at;
  if (!viewedAt) {
    viewedAt = nowIso();
    await c.env.DB.prepare("UPDATE approval_requests SET viewed_at = ? WHERE id = ?").bind(viewedAt, ar.id).run();
  }

  return c.json({
    org: { name: org?.name ?? "" },
    reportVersion: version
      ? {
          id: version.id,
          workOrderId: version.work_order_id,
          version: version.version,
          reportNumber: version.report_number,
          structured: parseJson(version.structured_json, null),
          photos: parseJson(version.photos_json, []),
          templateVersion: version.template_version,
          createdAt: version.created_at,
          createdBy: version.created_by,
          workOrder: {
            id: wo.id,
            scheduledDate: wo.scheduled_date,
            scheduledTime: wo.scheduled_time,
            workType: wo.work_type,
            request: wo.request,
          },
          customer: { id: ctx?.customer_id ?? "", name: ctx?.customer_name ?? "", address: ctx?.customer_address ?? null },
          site: { id: ctx?.site_id ?? "", name: ctx?.site_name ?? "", address: ctx?.site_address ?? null },
          asset: ctx?.asset_id
            ? { id: ctx.asset_id, name: ctx.asset_name ?? "", model: ctx.asset_model, serialNo: ctx.asset_serial }
            : null,
        }
      : null,
    approvalStatus: wo.approval_status,
    viewedAt,
  });
});

publicRoutes.post("/public/approvals/:token/approve", async (c) => {
  const token = c.req.param("token");
  const ar = await loadApprovalByToken(c.env.DB, token);
  if (!ar) return c.json({ error: "승인 링크를 찾을 수 없습니다" }, 404);
  if (new Date(ar.expires_at).getTime() < Date.now() || ar.status === "expired") return c.json({ error: "expired" }, 410);

  const wo = await c.env.DB.prepare("SELECT id, org_id, approval_status, billing_status FROM work_orders WHERE id = ?")
    .bind(ar.work_order_id)
    .first<{ id: string; org_id: string; approval_status: string; billing_status: string }>();
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  if (!canTransition("approval", wo.approval_status as any, "approved")) {
    return c.json({ error: `현재 승인 상태(${wo.approval_status})에서 승인할 수 없습니다` }, 409);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = approveSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const d = parsed.data;

  const ts = nowIso();
  await c.env.DB.prepare(
    "INSERT INTO signatures (id, approval_request_id, name, title, signature_data_url, approved_at) VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind(newId(), ar.id, d.name, d.title ?? null, d.signatureDataUrl, ts)
    .run();

  await c.env.DB.prepare("UPDATE approval_requests SET status = 'approved', decided_at = ? WHERE id = ?").bind(ts, ar.id).run();
  await c.env.DB.prepare("UPDATE report_versions SET locked_at = ? WHERE id = ?").bind(ts, ar.report_version_id).run();

  const nextBilling = canTransition("billing", wo.billing_status as any, "billable") ? "billable" : wo.billing_status;
  await c.env.DB.prepare(
    "UPDATE work_orders SET approval_status = 'approved', billing_status = ?, updated_at = ? WHERE id = ?",
  )
    .bind(nextBilling, ts, wo.id)
    .run();

  const existingBilling = await c.env.DB.prepare("SELECT id FROM billing_records WHERE work_order_id = ?").bind(wo.id).first<{ id: string }>();
  if (!existingBilling) {
    await c.env.DB.prepare(
      "INSERT INTO billing_records (id, work_order_id, amount, billed_at, due_at, paid_at, memo, updated_at) VALUES (?, ?, NULL, NULL, NULL, NULL, NULL, ?)",
    )
      .bind(newId(), wo.id, ts)
      .run();
  }

  const officeMembers = await c.env.DB.prepare(
    "SELECT user_id FROM memberships WHERE org_id = ? AND role IN ('office', 'admin') AND active = 1",
  )
    .bind(wo.org_id)
    .all<{ user_id: string }>();
  for (const m of officeMembers.results ?? []) {
    await notify(c.env.DB, { orgId: wo.org_id, userId: m.user_id, type: "approved", workOrderId: wo.id, message: "고객 승인이 완료되었습니다" });
  }

  await recordAudit(c.env.DB, { orgId: wo.org_id, actorUserId: null, event: "approved", target: wo.id });

  return c.json({ ok: true });
});

publicRoutes.post("/public/approvals/:token/revision", async (c) => {
  const token = c.req.param("token");
  const ar = await loadApprovalByToken(c.env.DB, token);
  if (!ar) return c.json({ error: "승인 링크를 찾을 수 없습니다" }, 404);
  if (new Date(ar.expires_at).getTime() < Date.now() || ar.status === "expired") return c.json({ error: "expired" }, 410);

  const wo = await c.env.DB.prepare("SELECT id, org_id, approval_status FROM work_orders WHERE id = ?")
    .bind(ar.work_order_id)
    .first<{ id: string; org_id: string; approval_status: string }>();
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);

  if (!canTransition("approval", wo.approval_status as any, "revision_requested")) {
    return c.json({ error: `현재 승인 상태(${wo.approval_status})에서 수정 요청할 수 없습니다` }, 409);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = revisionRequestSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);

  const ts = nowIso();
  await c.env.DB.prepare("UPDATE approval_requests SET status = 'revision_requested', decided_at = ? WHERE id = ?").bind(ts, ar.id).run();
  await c.env.DB.prepare("UPDATE work_orders SET approval_status = 'revision_requested', updated_at = ? WHERE id = ?").bind(ts, wo.id).run();

  const officeMembers = await c.env.DB.prepare(
    "SELECT user_id FROM memberships WHERE org_id = ? AND role IN ('office', 'admin') AND active = 1",
  )
    .bind(wo.org_id)
    .all<{ user_id: string }>();
  for (const m of officeMembers.results ?? []) {
    await notify(c.env.DB, { orgId: wo.org_id, userId: m.user_id, type: "revision_requested", workOrderId: wo.id, message: `수정 요청: ${parsed.data.comment}` });
  }

  await recordAudit(c.env.DB, { orgId: wo.org_id, actorUserId: null, event: "revision_requested", target: wo.id, detail: { comment: parsed.data.comment } });

  return c.json({ ok: true });
});
