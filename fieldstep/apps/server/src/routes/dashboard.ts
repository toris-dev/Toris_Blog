import { Hono } from "hono";
import { computeBillingStatus, toSeoulDateString } from "@fieldstep/shared";
import type { AppEnv } from "../db.js";
import { requireAuth, requireOfficeOrAdmin } from "../middleware.js";

export const dashboardRoutes = new Hono<AppEnv>();

async function count(db: D1Database, sql: string, ...params: unknown[]): Promise<number> {
  const row = await db.prepare(sql).bind(...params).first<{ n: number }>();
  return row?.n ?? 0;
}

dashboardRoutes.get("/dashboard", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const today = toSeoulDateString();

  const [todayCount, inProgress, submitted, pendingApproval, revisionRequested, billable] = await Promise.all([
    count(c.env.DB, "SELECT COUNT(*) AS n FROM work_orders WHERE org_id = ? AND scheduled_date = ?", orgId, today),
    count(c.env.DB, "SELECT COUNT(*) AS n FROM work_orders WHERE org_id = ? AND work_status = 'in_progress'", orgId),
    count(c.env.DB, "SELECT COUNT(*) AS n FROM work_orders WHERE org_id = ? AND work_status = 'submitted'", orgId),
    count(c.env.DB, "SELECT COUNT(*) AS n FROM work_orders WHERE org_id = ? AND approval_status = 'pending'", orgId),
    count(c.env.DB, "SELECT COUNT(*) AS n FROM work_orders WHERE org_id = ? AND approval_status = 'revision_requested'", orgId),
    count(c.env.DB, "SELECT COUNT(*) AS n FROM work_orders WHERE org_id = ? AND billing_status = 'billable'", orgId),
  ]);

  const billingRows = await c.env.DB.prepare(
    `SELECT br.billed_at, br.due_at, br.paid_at FROM billing_records br
     JOIN work_orders wo ON wo.id = br.work_order_id WHERE wo.org_id = ?`,
  )
    .bind(orgId)
    .all<{ billed_at: string | null; due_at: string | null; paid_at: string | null }>();

  const overdue = (billingRows.results ?? []).filter(
    (r) => computeBillingStatus({ billedAt: r.billed_at, dueAt: r.due_at, paidAt: r.paid_at }, today) === "overdue",
  ).length;

  return c.json({
    counts: {
      today: todayCount,
      inProgress,
      submitted,
      pendingApproval,
      revisionRequested,
      billable,
      overdue,
    },
  });
});
