import { beforeEach, describe, expect, it } from "vitest";
import app from "../worker.js";
import { createTestDb } from "./d1-shim.js";

type Role = "admin" | "office" | "field";

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
  orgName = "구성원 상태 테스트 조직",
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
    user: { id: string; email: string; name: string };
    org: { id: string };
    role: "admin";
  };
}

async function inviteAndAccept(
  db: D1Database,
  adminToken: string,
  email: string,
  role: Role,
) {
  const inviteResponse = await request(db, "/invites", {
    method: "POST",
    token: adminToken,
    body: JSON.stringify({ email, role }),
  });
  expect(inviteResponse.status).toBe(200);
  const invite = (
    (await inviteResponse.json()) as { invite: { token: string } }
  ).invite;

  const acceptResponse = await request(db, "/auth/accept-invite", {
    method: "POST",
    body: JSON.stringify({
      token: invite.token,
      name: role === "admin" ? "추가 관리자" : "사무 담당자",
      password: "password123",
    }),
  });
  expect(acceptResponse.status).toBe(200);
  return (await acceptResponse.json()) as {
    token: string;
    user: { id: string; email: string; name: string };
    org: { id: string };
    role: Role;
  };
}

function withTwoPartyBatchBarrier(db: D1Database): D1Database {
  let arrivals = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  return {
    prepare: (sql: string) => db.prepare(sql),
    exec: (sql: string) => db.exec(sql),
    batch: async (statements: D1PreparedStatement[]) => {
      arrivals += 1;
      if (arrivals === 2) release();
      else await gate;
      return db.batch(statements);
    },
  } as unknown as D1Database;
}

describe("organization member activation lifecycle", () => {
  let db: D1Database;

  beforeEach(() => {
    db = createTestDb();
  });

  it("invalidates every organization session while preserving authorship and assignments", async () => {
    const admin = await signup(db, "admin@member-lifecycle.test");
    const office = await inviteAndAccept(
      db,
      admin.token,
      "office@member-lifecycle.test",
      "office",
    );
    const secondLoginResponse = await request(db, "/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: office.user.email,
        password: "password123",
      }),
    });
    expect(secondLoginResponse.status).toBe(200);
    const secondOfficeToken = (
      (await secondLoginResponse.json()) as { token: string }
    ).token;

    const customerResponse = await request(db, "/customers", {
      method: "POST",
      token: office.token,
      body: JSON.stringify({ name: "이력 보존 고객" }),
    });
    expect(customerResponse.status).toBe(200);
    const customer = (
      (await customerResponse.json()) as { customer: { id: string } }
    ).customer;
    const siteResponse = await request(db, "/sites", {
      method: "POST",
      token: office.token,
      body: JSON.stringify({
        customerId: customer.id,
        name: "이력 보존 현장",
      }),
    });
    expect(siteResponse.status).toBe(200);
    const site = ((await siteResponse.json()) as { site: { id: string } }).site;
    const workOrderResponse = await request(db, "/work-orders", {
      method: "POST",
      token: office.token,
      body: JSON.stringify({
        scheduledDate: "2026-08-04",
        workType: "구성원 이력 보존 점검",
        customerId: customer.id,
        siteId: site.id,
        assigneeIds: [office.user.id],
        intent: "schedule",
      }),
    });
    expect(workOrderResponse.status).toBe(200);
    const workOrder = (
      (await workOrderResponse.json()) as { workOrder: { id: string } }
    ).workOrder;

    const deactivate = await request(
      db,
      `/users/${office.user.id}/active`,
      {
        method: "PATCH",
        token: admin.token,
        body: JSON.stringify({ active: false }),
      },
    );
    expect(deactivate.status).toBe(200);
    await expect(deactivate.json()).resolves.toMatchObject({
      changed: true,
      member: { id: office.user.id, active: false, role: "office" },
    });

    const sessions = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM sessions WHERE org_id = ? AND user_id = ?",
      )
      .bind(admin.org.id, office.user.id)
      .first<{ count: number }>();
    expect(sessions?.count).toBe(0);
    for (const token of [office.token, secondOfficeToken]) {
      const me = await request(db, "/me", { token });
      expect(me.status).toBe(401);
    }

    const history = await db
      .prepare(
        `SELECT w.created_by, COUNT(a.user_id) AS assignment_count
         FROM work_orders w
         LEFT JOIN assignments a
           ON a.work_order_id = w.id AND a.user_id = ?
         WHERE w.id = ?
         GROUP BY w.id`,
      )
      .bind(office.user.id, workOrder.id)
      .first<{ created_by: string; assignment_count: number }>();
    expect(history).toEqual({
      created_by: office.user.id,
      assignment_count: 1,
    });

    const retryDeactivate = await request(
      db,
      `/users/${office.user.id}/active`,
      {
        method: "PATCH",
        token: admin.token,
        body: JSON.stringify({ active: false }),
      },
    );
    expect(retryDeactivate.status).toBe(200);
    await expect(retryDeactivate.json()).resolves.toMatchObject({
      changed: false,
      member: { active: false },
    });

    const reactivate = await request(
      db,
      `/users/${office.user.id}/active`,
      {
        method: "PATCH",
        token: admin.token,
        body: JSON.stringify({ active: true }),
      },
    );
    expect(reactivate.status).toBe(200);
    await expect(reactivate.json()).resolves.toMatchObject({
      changed: true,
      member: { active: true },
    });
    const retryReactivate = await request(
      db,
      `/users/${office.user.id}/active`,
      {
        method: "PATCH",
        token: admin.token,
        body: JSON.stringify({ active: true }),
      },
    );
    expect(retryReactivate.status).toBe(200);
    await expect(retryReactivate.json()).resolves.toMatchObject({
      changed: false,
      member: { active: true },
    });

    const loginAfterReactivation = await request(db, "/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: office.user.email,
        password: "password123",
      }),
    });
    expect(loginAfterReactivation.status).toBe(200);

    const audit = await db
      .prepare(
        `SELECT event, detail_json
         FROM audit_events
         WHERE org_id = ? AND target = ?
           AND event IN ('member_deactivated', 'member_activated')
         ORDER BY rowid`,
      )
      .bind(admin.org.id, office.user.id)
      .all<{ event: string; detail_json: string }>();
    expect((audit.results ?? []).map((row) => row.event)).toEqual([
      "member_deactivated",
      "member_activated",
    ]);
    expect(JSON.parse(audit.results![0]!.detail_json)).toMatchObject({
      role: "office",
      previousActive: true,
      active: false,
    });
  });

  it("allows only admins and isolates exact member IDs to the current organization", async () => {
    const first = await signup(
      db,
      "first-admin@member-access.test",
      "첫 번째 조직",
    );
    const office = await inviteAndAccept(
      db,
      first.token,
      "office@member-access.test",
      "office",
    );
    const second = await signup(
      db,
      "second-admin@member-access.test",
      "두 번째 조직",
    );

    const officeDenied = await request(
      db,
      `/users/${first.user.id}/active`,
      {
        method: "PATCH",
        token: office.token,
        body: JSON.stringify({ active: false }),
      },
    );
    expect(officeDenied.status).toBe(403);

    const crossOrg = await request(
      db,
      `/users/${second.user.id}/active`,
      {
        method: "PATCH",
        token: first.token,
        body: JSON.stringify({ active: false }),
      },
    );
    expect(crossOrg.status).toBe(404);

    const invalidId = await request(db, "/users/not-a-uuid/active", {
      method: "PATCH",
      token: first.token,
      body: JSON.stringify({ active: false }),
    });
    expect(invalidId.status).toBe(400);

    const extraBodyField = await request(
      db,
      `/users/${office.user.id}/active`,
      {
        method: "PATCH",
        token: first.token,
        body: JSON.stringify({ active: false, role: "admin" }),
      },
    );
    expect(extraBodyField.status).toBe(400);
    const membership = await db
      .prepare(
        "SELECT active, role FROM memberships WHERE org_id = ? AND user_id = ?",
      )
      .bind(first.org.id, office.user.id)
      .first<{ active: number; role: string }>();
    expect(membership).toEqual({ active: 1, role: "office" });
  });

  it("prevents self-deactivation", async () => {
    const admin = await signup(db, "self-admin@member-lifecycle.test");
    const response = await request(
      db,
      `/users/${admin.user.id}/active`,
      {
        method: "PATCH",
        token: admin.token,
        body: JSON.stringify({ active: false }),
      },
    );
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "자기 자신은 비활성화할 수 없습니다",
    });
  });

  it("atomically keeps one active admin when two admins deactivate each other", async () => {
    const first = await signup(db, "first-admin@member-race.test");
    const second = await inviteAndAccept(
      db,
      first.token,
      "second-admin@member-race.test",
      "admin",
    );
    const concurrentDb = withTwoPartyBatchBarrier(db);

    const responses = await Promise.all([
      request(concurrentDb, `/users/${second.user.id}/active`, {
        method: "PATCH",
        token: first.token,
        body: JSON.stringify({ active: false }),
      }),
      request(concurrentDb, `/users/${first.user.id}/active`, {
        method: "PATCH",
        token: second.token,
        body: JSON.stringify({ active: false }),
      }),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([
      200,
      409,
    ]);

    const activeAdmins = await db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM memberships
         WHERE org_id = ? AND role = 'admin' AND active = 1`,
      )
      .bind(first.org.id)
      .first<{ count: number }>();
    expect(activeAdmins?.count).toBe(1);

    const activeAdminSessions = await db
      .prepare(
        `SELECT m.active, COUNT(s.id) AS session_count
         FROM memberships m
         LEFT JOIN sessions s
           ON s.org_id = m.org_id AND s.user_id = m.user_id
         WHERE m.org_id = ? AND m.role = 'admin'
         GROUP BY m.user_id, m.active
         ORDER BY m.active`,
      )
      .bind(first.org.id)
      .all<{ active: number; session_count: number }>();
    expect(activeAdminSessions.results).toEqual([
      { active: 0, session_count: 0 },
      { active: 1, session_count: 1 },
    ]);
  });
});
