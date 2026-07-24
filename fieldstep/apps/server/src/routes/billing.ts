import { Hono } from "hono";
import {
  billingPutSchema,
  computeBillingStatus,
  toSeoulDateString,
  type BillingStatus,
} from "@fieldstep/shared";
import type { AppEnv } from "../db.js";
import { newId, nowIso, recordAudit } from "../db.js";
import { requireAuth, requireOfficeOrAdmin } from "../middleware.js";
import { BILLING_OVERDUE_NOTIFICATION_TYPE } from "../overdue-notifications.js";

export const billingRoutes = new Hono<AppEnv>();

type BillingValues = {
  amount: number | null;
  billed_at: string | null;
  due_at: string | null;
  paid_at: string | null;
  memo: string | null;
};

type BillingRow = BillingValues & {
  revision: number;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysInMonth[month - 1]!;
}

billingRoutes.get("/billing", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const statusFilter = c.req.query("status") as BillingStatus | undefined;
  const today = toSeoulDateString();

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
        billingStatus: effective,
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
  if (
    typeof body === "object" &&
    body !== null &&
    "amount" in body &&
    typeof body.amount === "number" &&
    !Number.isFinite(body.amount)
  ) {
    return c.json({ error: "청구 금액은 0 이상의 유한한 숫자여야 합니다" }, 400);
  }
  const parsed = billingPutSchema.safeParse(body);
  if (!parsed.success) {
    if (
      parsed.error.issues.some(
        (issue) =>
          issue.path[0] === "amount" &&
          (issue.code === "too_small" || issue.code === "not_finite"),
      )
    ) {
      return c.json({ error: "청구 금액은 0 이상의 유한한 숫자여야 합니다" }, 400);
    }
    const dateFields = [
      ["billedAt", "청구일"],
      ["dueAt", "납기일"],
      ["paidAt", "입금일"],
    ] as const;
    for (const [field, label] of dateFields) {
      if (parsed.error.issues.some((issue) => issue.path[0] === field)) {
        return c.json({ error: `${label}은 YYYY-MM-DD 형식의 유효한 날짜여야 합니다` }, 400);
      }
    }
    return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  }
  const d = parsed.data;
  if (
    d.amount !== undefined &&
    d.amount !== null &&
    (!Number.isFinite(d.amount) || d.amount < 0)
  ) {
    return c.json({ error: "청구 금액은 0 이상의 유한한 숫자여야 합니다" }, 400);
  }

  const suppliedDates = [
    ["청구일", d.billedAt],
    ["납기일", d.dueAt],
    ["입금일", d.paidAt],
  ] as const;
  for (const [label, value] of suppliedDates) {
    if (value !== undefined && value !== null && !isValidDate(value)) {
      return c.json({ error: `${label}은 YYYY-MM-DD 형식의 유효한 날짜여야 합니다` }, 400);
    }
  }

  const current = await c.env.DB.prepare(
    `SELECT amount, billed_at, due_at, paid_at, memo, revision
     FROM billing_records WHERE work_order_id = ?`,
  )
    .bind(id)
    .first<BillingRow>();

  const merged: BillingValues = {
    amount: d.amount === undefined ? (current?.amount ?? null) : d.amount,
    billed_at: d.billedAt === undefined ? (current?.billed_at ?? null) : d.billedAt,
    due_at: d.dueAt === undefined ? (current?.due_at ?? null) : d.dueAt,
    paid_at: d.paidAt === undefined ? (current?.paid_at ?? null) : d.paidAt,
    memo: d.memo === undefined ? (current?.memo ?? null) : d.memo,
  };

  if (!merged.billed_at && (merged.due_at || merged.paid_at)) {
    return c.json({ error: "납기일과 입금일을 입력하려면 청구일이 필요합니다" }, 400);
  }
  if (merged.billed_at && merged.due_at && merged.due_at < merged.billed_at) {
    return c.json({ error: "납기일은 청구일보다 빠를 수 없습니다" }, 400);
  }
  if (merged.billed_at && merged.paid_at && merged.paid_at < merged.billed_at) {
    return c.json({ error: "입금일은 청구일보다 빠를 수 없습니다" }, 400);
  }
  if (
    merged.billed_at &&
    (merged.amount === null || !Number.isFinite(merged.amount) || merged.amount <= 0)
  ) {
    return c.json(
      { error: "청구완료 처리에는 0원보다 큰 청구 금액과 청구일이 필요합니다" },
      400,
    );
  }

  const today = toSeoulDateString();
  const computed = computeBillingStatus(
    { billedAt: merged.billed_at, dueAt: merged.due_at, paidAt: merged.paid_at },
    today,
  );
  if (wo.billing_status === "paid" && computed !== "paid") {
    return c.json({ error: "입금완료 상태는 이전 상태로 되돌릴 수 없습니다" }, 409);
  }

  // 청구 데이터 전체를 기준으로 상태를 파생한다. 따라서 한 요청에서
  // 청구가능 → 입금완료처럼 중간 상태를 안전하게 건너뛸 수 있고,
  // 청구일을 명시적으로 지운 승인 작업은 빈 청구 레코드와 일치하게
  // 청구가능 상태로 돌아간다. paid 역전이는 위에서 별도로 차단한다.
  const nextStatus: BillingStatus = computed ?? "billable";
  const ts = nowIso();
  const writeToken = newId();
  const nextRevision = (current?.revision ?? 0) + 1;
  const billingStatement = current
    ? c.env.DB.prepare(
      `UPDATE billing_records
       SET amount = ?, billed_at = ?, due_at = ?, paid_at = ?, memo = ?,
           updated_at = ?, revision = ?, write_token = ?
       WHERE work_order_id = ? AND revision = ?
         AND EXISTS (
           SELECT 1 FROM work_orders
           WHERE id = ? AND org_id = ? AND approval_status = 'approved'
             AND billing_status = ?
         )`,
    )
      .bind(
        merged.amount,
        merged.billed_at,
        merged.due_at,
        merged.paid_at,
        merged.memo,
        ts,
        nextRevision,
        writeToken,
        id,
        current.revision,
        id,
        orgId,
        wo.billing_status,
      )
    : c.env.DB.prepare(
      `INSERT INTO billing_records (
         id, work_order_id, amount, billed_at, due_at, paid_at, memo,
         updated_at, revision, write_token
       )
       SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
       WHERE EXISTS (
         SELECT 1 FROM work_orders
         WHERE id = ? AND org_id = ? AND approval_status = 'approved'
           AND billing_status = ?
       )
         AND NOT EXISTS (
           SELECT 1 FROM billing_records WHERE work_order_id = ?
         )`,
    )
      .bind(
        newId(),
        id,
        merged.amount,
        merged.billed_at,
        merged.due_at,
        merged.paid_at,
        merged.memo,
        ts,
        nextRevision,
        writeToken,
        id,
        orgId,
        wo.billing_status,
        id,
      );
  const transition = await c.env.DB.batch([
    billingStatement,
    c.env.DB
      .prepare(
        `UPDATE work_orders SET billing_status = ?, updated_at = ?
         WHERE id = ? AND org_id = ? AND approval_status = 'approved'
           AND billing_status = ?
           AND EXISTS (
             SELECT 1 FROM billing_records
             WHERE work_order_id = work_orders.id
               AND revision = ? AND write_token = ?
           )`,
      )
      .bind(
        nextStatus,
        ts,
        id,
        orgId,
        wo.billing_status,
        nextRevision,
        writeToken,
      ),
    c.env.DB
      .prepare(
        `UPDATE notifications
         SET read_at = ?
         WHERE org_id = ?
           AND work_order_id = ?
           AND type = ?
           AND read_at IS NULL
           AND ? = 'paid'
           AND EXISTS (
             SELECT 1
             FROM work_orders AS paid_work
             JOIN billing_records AS paid_billing
               ON paid_billing.work_order_id = paid_work.id
             WHERE paid_work.id = ?
               AND paid_work.org_id = ?
               AND paid_work.billing_status = 'paid'
               AND paid_billing.paid_at IS NOT NULL
               AND paid_billing.revision = ?
               AND paid_billing.write_token = ?
           )`,
      )
      .bind(
        ts,
        orgId,
        id,
        BILLING_OVERDUE_NOTIFICATION_TYPE,
        nextStatus,
        id,
        orgId,
        nextRevision,
        writeToken,
      ),
  ]);
  if (transition[0]?.meta.changes !== 1 || transition[1]?.meta.changes !== 1) {
    return c.json({ error: "청구 정보가 다른 요청에서 변경되었습니다. 새로고침 후 다시 시도해주세요" }, 409);
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
