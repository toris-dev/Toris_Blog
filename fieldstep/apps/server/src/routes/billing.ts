import { Hono } from "hono";
import { billingPutSchema, computeBillingStatus, canTransition, type BillingStatus } from "@fieldstep/shared";
import type { AppEnv } from "../db.js";
import { newId, nowIso, recordAudit } from "../db.js";
import { requireAuth, requireOfficeOrAdmin } from "../middleware.js";

export const billingRoutes = new Hono<AppEnv>();


type BillingRow = { amount: number | null; billed_at: string | null; due_at: string | null; paid_at: string | null; memo: string | null };

billingRoutes.get("/billing", requireAuth, async (c) => {
  const orgId = c.get("orgId");
  const statusFilter = c.req.query("status") as BillingStatus | undefined;
  const today = new Date().toISOString().slice(0, 10);

  const rows = await c.env.DB.prepare(
    `SELECT wo.id, wo.work_status, wo.approval_status, wo.billing_status, wo.scheduled_date, wo.scheduled_time,
            wo.work_type, c.name AS customer_name, s.name AS site_name,
            br.amount, br.billed_at, br.due_at, br.paid_at, br.memo
     FROM work_orders wo
     JOIN customers c ON c.id = wo.customer_id
     JOIN sites s ON s.id = wo.site_id
     LEFT JOIN billing_records br ON br.work_order_id = wo.id
     WHERE wo.org_id = ?
     ORDER BY wo.scheduled_date DESC`,
  )
    .bind(orgId)
    .all<{
      id: string;
      work_status: string;
      approval_status: string;
      billing_status: string;
      scheduled_date: string;
      scheduled_time: string | null;
      work_type: string;
      customer_name: string;
      site_name: string;
      amount: number | null;
      billed_at: string | null;
      due_at: string | null;
      paid_at: string | null;
      memo: string | null;
    }>();

  const out = [];
  for (const r of rows.results ?? []) {
    const effective: BillingStatus =
      computeBillingStatus({ billedAt: r.billed_at, dueAt: r.due_at, paidAt: r.paid_at }, today) ??
      (r.billing_status as BillingStatus);
    if (statusFilter && effective !== statusFilter) continue;

    const assignees = await c.env.DB.prepare(
      "SELECT u.name FROM assignments a JOIN users u ON u.id = a.user_id WHERE a.work_order_id = ?",
    )
      .bind(r.id)
      .all<{ name: string }>();

    out.push({
      workOrder: {
        id: r.id,
        workStatus: r.work_status,
        approvalStatus: r.approval_status,
        billingStatus: r.billing_status,
        scheduledDate: r.scheduled_date,
        scheduledTime: r.scheduled_time,
        workType: r.work_type,
        customerName: r.customer_name,
        siteName: r.site_name,
        assigneeNames: (assignees.results ?? []).map((a) => a.name),
      },
      customerName: r.customer_name,
      billing: {
        workOrderId: r.id,
        status: effective,
        amount: r.amount,
        billedAt: r.billed_at,
        dueAt: r.due_at,
        paidAt: r.paid_at,
        memo: r.memo,
      },
    });
  }

  return c.json({ rows: out });
});

billingRoutes.put("/work-orders/:id/billing", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const wo = await c.env.DB.prepare("SELECT id, approval_status, billing_status FROM work_orders WHERE org_id = ? AND id = ?")
    .bind(orgId, id)
    .first<{ id: string; approval_status: string; billing_status: string }>();
  if (!wo) return c.json({ error: "작업을 찾을 수 없습니다" }, 404);
  if (wo.approval_status !== "approved") {
    return c.json({ error: "승인완료 이후에만 청구 정보를 입력할 수 있습니다" }, 409);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = billingPutSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const d = parsed.data;

  const current = await c.env.DB.prepare(
    "SELECT amount, billed_at, due_at, paid_at, memo FROM billing_records WHERE work_order_id = ?",
  )
    .bind(id)
    .first<BillingRow>();

  const merged: BillingRow = {
    amount: d.amount ?? current?.amount ?? null,
    billed_at: d.billedAt ?? current?.billed_at ?? null,
    due_at: d.dueAt ?? current?.due_at ?? null,
    paid_at: d.paidAt ?? current?.paid_at ?? null,
    memo: d.memo ?? current?.memo ?? null,
  };

  const ts = nowIso();
  if (current) {
    await c.env.DB.prepare(
      "UPDATE billing_records SET amount = ?, billed_at = ?, due_at = ?, paid_at = ?, memo = ?, updated_at = ? WHERE work_order_id = ?",
    )
      .bind(merged.amount, merged.billed_at, merged.due_at, merged.paid_at, merged.memo, ts, id)
      .run();
  } else {
    await c.env.DB.prepare(
      "INSERT INTO billing_records (id, work_order_id, amount, billed_at, due_at, paid_at, memo, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(newId(), id, merged.amount, merged.billed_at, merged.due_at, merged.paid_at, merged.memo, ts)
      .run();
  }

  const today = new Date().toISOString().slice(0, 10);
  const computed = computeBillingStatus({ billedAt: merged.billed_at, dueAt: merged.due_at, paidAt: merged.paid_at }, today);
  let nextStatus = wo.billing_status as BillingStatus;
  if (computed && canTransition("billing", wo.billing_status as BillingStatus, computed)) {
    nextStatus = computed;
    await c.env.DB.prepare("UPDATE work_orders SET billing_status = ?, updated_at = ? WHERE id = ?").bind(nextStatus, ts, id).run();
  }

  await recordAudit(c.env.DB, { orgId, actorUserId: c.get("userId"), event: "billing_updated", target: id, detail: merged });

  return c.json({
    billing: {
      workOrderId: id,
      status: nextStatus,
      amount: merged.amount,
      billedAt: merged.billed_at,
      dueAt: merged.due_at,
      paidAt: merged.paid_at,
      memo: merged.memo,
    },
  });
});
