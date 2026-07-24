import { beforeEach, describe, expect, it } from "vitest";
import app from "../worker.js";
import { materializeOverdueNotifications } from "../overdue-notifications.js";
import { createTestDb } from "./d1-shim.js";

function request(
  db: D1Database,
  path: string,
  init: RequestInit & { token?: string } = {},
) {
  const { token, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (rest.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return app.request(path, { ...rest, headers }, { DB: db });
}

async function signup(
  db: D1Database,
  email: string,
  orgName: string,
) {
  const response = await request(db, "/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: "password123",
      name: "관리자",
      orgName,
    }),
  });
  expect(response.status).toBe(200);
  return (await response.json()) as {
    token: string;
    user: { id: string };
    org: { id: string };
  };
}

async function seedMember(
  db: D1Database,
  args: {
    orgId: string;
    id: string;
    role: "admin" | "office" | "field";
    active: boolean;
  },
) {
  const ts = "2026-07-23T00:00:00.000Z";
  await db.batch([
    db
      .prepare(
        `INSERT INTO users
           (id, email, name, pw_hash, pw_salt, created_at)
         VALUES (?, ?, ?, 'hash', 'salt', ?)`,
      )
      .bind(args.id, `${args.id}@example.test`, args.id, ts),
    db
      .prepare(
        `INSERT INTO memberships
           (id, org_id, user_id, role, active, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        `membership-${args.id}`,
        args.orgId,
        args.id,
        args.role,
        args.active ? 1 : 0,
        ts,
      ),
  ]);
}

async function seedBilledWork(
  db: D1Database,
  args: {
    orgId: string;
    creatorId: string;
    suffix: string;
    dueAt: string;
  },
) {
  const ts = "2026-07-23T00:00:00.000Z";
  const customerId = `customer-${args.suffix}`;
  const siteId = `site-${args.suffix}`;
  const workOrderId = `work-${args.suffix}`;
  await db.batch([
    db
      .prepare(
        `INSERT INTO customers
           (id, org_id, name, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(customerId, args.orgId, `고객 ${args.suffix}`, ts, ts),
    db
      .prepare(
        `INSERT INTO sites
           (id, org_id, customer_id, name, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(siteId, args.orgId, customerId, `현장 ${args.suffix}`, ts, ts),
    db
      .prepare(
        `INSERT INTO work_orders
           (id, org_id, customer_id, site_id, scheduled_date, work_type,
            work_status, approval_status, billing_status, ai_status,
            created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, '2026-07-23', '정기점검',
                 'completed', 'approved', 'overdue', 'idle', ?, ?, ?)`,
      )
      .bind(
        workOrderId,
        args.orgId,
        customerId,
        siteId,
        args.creatorId,
        ts,
        ts,
      ),
    db
      .prepare(
        `INSERT INTO billing_records
           (id, work_order_id, amount, billed_at, due_at, paid_at, memo,
            updated_at, revision, write_token)
         VALUES (?, ?, 150000, '2026-01-01', ?, NULL, NULL, ?, 0, NULL)`,
      )
      .bind(`billing-${args.suffix}`, workOrderId, args.dueAt, ts),
  ]);
  return workOrderId;
}

describe("FR-057 overdue billing notifications", () => {
  let db: D1Database;

  beforeEach(() => {
    db = createTestDb();
  });

  it("uses the Seoul calendar boundary and does not alert on the due date", async () => {
    const fixture = await signup(
      db,
      "admin@overdue-boundary.test",
      "연체 경계 조직",
    );
    const workOrderId = await seedBilledWork(db, {
      orgId: fixture.org.id,
      creatorId: fixture.user.id,
      suffix: "boundary",
      dueAt: "2026-07-23",
    });

    await materializeOverdueNotifications(db, {
      orgId: fixture.org.id,
      seoulToday: "2026-07-23",
    });
    const onDueDate = await db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM notifications
         WHERE work_order_id = ? AND type = 'billing_overdue'`,
      )
      .bind(workOrderId)
      .first<{ count: number }>();
    expect(onDueDate?.count).toBe(0);

    await materializeOverdueNotifications(db, {
      orgId: fixture.org.id,
      seoulToday: "2026-07-24",
    });
    const nextDay = await db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM notifications
         WHERE work_order_id = ? AND type = 'billing_overdue'`,
      )
      .bind(workOrderId)
      .first<{ count: number }>();
    expect(nextDay?.count).toBe(1);
  });

  it("targets only active admin/office members and remains unique across refreshes", async () => {
    const primary = await signup(
      db,
      "admin@overdue-primary.test",
      "연체 알림 조직",
    );
    const other = await signup(
      db,
      "admin@overdue-other.test",
      "다른 조직",
    );
    await seedMember(db, {
      orgId: primary.org.id,
      id: "active-office",
      role: "office",
      active: true,
    });
    await seedMember(db, {
      orgId: primary.org.id,
      id: "active-field",
      role: "field",
      active: true,
    });
    await seedMember(db, {
      orgId: primary.org.id,
      id: "inactive-office",
      role: "office",
      active: false,
    });
    const workOrderId = await seedBilledWork(db, {
      orgId: primary.org.id,
      creatorId: primary.user.id,
      suffix: "targeting",
      dueAt: "2000-01-02",
    });
    const otherWorkOrderId = await seedBilledWork(db, {
      orgId: other.org.id,
      creatorId: other.user.id,
      suffix: "other-org",
      dueAt: "2000-01-02",
    });

    const [first, second] = await Promise.all([
      request(db, "/notifications", { token: primary.token }),
      request(db, "/notifications?unread=1", { token: primary.token }),
    ]);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    await request(db, "/notifications", { token: primary.token });
    const stored = await db
      .prepare(
        `SELECT id, org_id, user_id, work_order_id
         FROM notifications
         WHERE type = 'billing_overdue'
         ORDER BY user_id`,
      )
      .all<{
        id: string;
        org_id: string;
        user_id: string | null;
        work_order_id: string;
      }>();

    expect(stored.results).toHaveLength(2);
    expect(stored.results).toEqual(
      expect.arrayContaining([
        {
          id: `billing-overdue:${workOrderId}:active-office`,
          org_id: primary.org.id,
          user_id: "active-office",
          work_order_id: workOrderId,
        },
        {
          id: `billing-overdue:${workOrderId}:${primary.user.id}`,
          org_id: primary.org.id,
          user_id: primary.user.id,
          work_order_id: workOrderId,
        },
      ]),
    );

    const otherBeforeOwnSync = await db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM notifications
         WHERE org_id = ? AND type = 'billing_overdue'`,
      )
      .bind(other.org.id)
      .first<{ count: number }>();
    expect(otherBeforeOwnSync?.count).toBe(0);

    const isolated = await request(db, "/notifications", {
      token: other.token,
    });
    expect(isolated.status).toBe(200);
    await expect(isolated.json()).resolves.toMatchObject({
      notifications: [
        {
          kind: "billing_overdue",
          workOrderId: otherWorkOrderId,
        },
      ],
    });
  });

  it("does not recreate read alerts and paying closes every unread target", async () => {
    const fixture = await signup(
      db,
      "admin@overdue-close.test",
      "연체 종결 조직",
    );
    await seedMember(db, {
      orgId: fixture.org.id,
      id: "close-office",
      role: "office",
      active: true,
    });
    const workOrderId = await seedBilledWork(db, {
      orgId: fixture.org.id,
      creatorId: fixture.user.id,
      suffix: "close",
      dueAt: "2026-07-22",
    });

    await materializeOverdueNotifications(db, {
      orgId: fixture.org.id,
      seoulToday: "2026-07-23",
    });
    const adminAlert = await db
      .prepare(
        `SELECT id
         FROM notifications
         WHERE type = 'billing_overdue' AND user_id = ?`,
      )
      .bind(fixture.user.id)
      .first<{ id: string }>();
    expect(adminAlert).not.toBeNull();

    const markedRead = await request(db, "/notifications/read", {
      method: "POST",
      token: fixture.token,
      body: JSON.stringify({ ids: [adminAlert!.id] }),
    });
    expect(markedRead.status).toBe(200);
    const readBeforeRefresh = await db
      .prepare("SELECT read_at FROM notifications WHERE id = ?")
      .bind(adminAlert!.id)
      .first<{ read_at: string | null }>();
    expect(readBeforeRefresh?.read_at).not.toBeNull();

    await request(db, "/notifications", { token: fixture.token });
    const afterRefresh = await db
      .prepare(
        `SELECT COUNT(*) AS count,
                SUM(CASE WHEN read_at IS NULL THEN 1 ELSE 0 END) AS unread
         FROM notifications
         WHERE org_id = ? AND work_order_id = ? AND type = 'billing_overdue'`,
      )
      .bind(fixture.org.id, workOrderId)
      .first<{ count: number; unread: number }>();
    expect(afterRefresh).toEqual({ count: 2, unread: 1 });

    const paid = await request(db, `/work-orders/${workOrderId}/billing`, {
      method: "PUT",
      token: fixture.token,
      body: JSON.stringify({ paidAt: "2026-07-23" }),
    });
    expect(paid.status).toBe(200);
    await expect(paid.json()).resolves.toMatchObject({
      billing: { status: "paid", paidAt: "2026-07-23" },
    });

    const afterPaid = await db
      .prepare(
        `SELECT COUNT(*) AS count,
                SUM(CASE WHEN read_at IS NULL THEN 1 ELSE 0 END) AS unread
         FROM notifications
         WHERE org_id = ? AND work_order_id = ? AND type = 'billing_overdue'`,
      )
      .bind(fixture.org.id, workOrderId)
      .first<{ count: number; unread: number }>();
    expect(afterPaid).toEqual({ count: 2, unread: 0 });

    await request(db, "/notifications", { token: fixture.token });
    const finalCount = await db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM notifications
         WHERE org_id = ? AND work_order_id = ? AND type = 'billing_overdue'`,
      )
      .bind(fixture.org.id, workOrderId)
      .first<{ count: number }>();
    expect(finalCount?.count).toBe(2);
  });
});
