import {
  addCalendarDays,
  toSeoulDateString,
} from "@fieldstep/shared";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../worker.js";
import { createTestDb } from "./d1-shim.js";

type Session = {
  token: string;
  user: { id: string };
  org: { id: string };
};

type Hierarchy = {
  customerId: string;
  siteId: string;
  assetId: string | null;
};

type RecurrenceResponse = {
  workOrder: { id: string };
  maintenanceSchedule: {
    id: string;
    status: string;
    nextOccurrenceDate: string | null;
  };
  replayed?: boolean;
};

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

function withBindLimit(db: D1Database, maximum: number): D1Database {
  return {
    prepare: (sql: string) => {
      const statement = db.prepare(sql);
      return new Proxy(statement, {
        get(target, property) {
          if (property === "bind") {
            return (...values: unknown[]) => {
              if (values.length > maximum) {
                throw new Error(
                  `test bind limit exceeded: ${values.length} > ${maximum}`,
                );
              }
              return target.bind(...values);
            };
          }
          const value = Reflect.get(target, property);
          return typeof value === "function" ? value.bind(target) : value;
        },
      });
    },
    exec: (sql: string) => db.exec(sql),
    batch: (statements: D1PreparedStatement[]) => db.batch(statements),
  } as unknown as D1Database;
}

function withBeforeFirstBatch(
  db: D1Database,
  beforeBatch: () => Promise<void>,
): D1Database {
  let pending = true;
  return {
    prepare: (sql: string) => db.prepare(sql),
    exec: (sql: string) => db.exec(sql),
    batch: async (statements: D1PreparedStatement[]) => {
      if (pending) {
        pending = false;
        await beforeBatch();
      }
      return db.batch(statements);
    },
  } as unknown as D1Database;
}

async function signup(
  db: D1Database,
  email: string,
  orgName: string,
): Promise<Session> {
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
  return (await response.json()) as Session;
}

async function inviteMember(
  db: D1Database,
  adminToken: string,
  email: string,
  role: "office" | "field" = "field",
): Promise<Session> {
  const inviteResponse = await request(db, "/invites", {
    method: "POST",
    token: adminToken,
    body: JSON.stringify({ email, role }),
  });
  expect(inviteResponse.status).toBe(200);
  const invite = (await inviteResponse.json()) as {
    invite: { token: string };
  };
  const acceptResponse = await request(db, "/auth/accept-invite", {
    method: "POST",
    body: JSON.stringify({
      token: invite.invite.token,
      name: email,
      password: "password123",
    }),
  });
  expect(acceptResponse.status).toBe(200);
  return (await acceptResponse.json()) as Session;
}

async function createHierarchy(
  db: D1Database,
  token: string,
  suffix: string,
  withAsset = false,
): Promise<Hierarchy> {
  const customerResponse = await request(db, "/customers", {
    method: "POST",
    token,
    body: JSON.stringify({ name: `고객-${suffix}` }),
  });
  const customer = (await customerResponse.json()) as {
    customer: { id: string };
  };
  const siteResponse = await request(db, "/sites", {
    method: "POST",
    token,
    body: JSON.stringify({
      customerId: customer.customer.id,
      name: `현장-${suffix}`,
    }),
  });
  const site = (await siteResponse.json()) as { site: { id: string } };
  if (!withAsset) {
    return {
      customerId: customer.customer.id,
      siteId: site.site.id,
      assetId: null,
    };
  }
  const assetResponse = await request(db, "/assets", {
    method: "POST",
    token,
    body: JSON.stringify({
      siteId: site.site.id,
      name: `장비-${suffix}`,
    }),
  });
  const asset = (await assetResponse.json()) as { asset: { id: string } };
  return {
    customerId: customer.customer.id,
    siteId: site.site.id,
    assetId: asset.asset.id,
  };
}

function recurrenceBody(
  hierarchy: Hierarchy,
  assigneeIds: string[],
  scheduledDate: string,
  options: {
    frequency?: "weekly" | "monthly";
    intervalCount?: number;
    endDate?: string;
    workType?: string;
    sourceReportVersionId?: string;
  } = {},
) {
  return {
    scheduledDate,
    workType: options.workType ?? "정기점검",
    customerId: hierarchy.customerId,
    siteId: hierarchy.siteId,
    assetId: hierarchy.assetId ?? undefined,
    assigneeIds,
    intent: "schedule",
    recurrence: {
      frequency: options.frequency ?? "weekly",
      intervalCount: options.intervalCount ?? 1,
      endDate: options.endDate,
    },
    sourceReportVersionId: options.sourceReportVersionId,
  };
}

async function createRecurrence(
  db: D1Database,
  token: string,
  idempotencyKey: string,
  body: ReturnType<typeof recurrenceBody>,
): Promise<{ response: Response; json: RecurrenceResponse }> {
  const response = await request(db, "/work-orders", {
    method: "POST",
    token,
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as RecurrenceResponse;
  return { response, json };
}

describe("maintenance schedules", () => {
  let db: D1Database;

  beforeEach(() => {
    db = createTestDb();
  });

  it("creates once per idempotency key, respects inclusive end date, permissions, and org isolation", async () => {
    const admin = await signup(
      db,
      "maintenance-admin-a@example.com",
      "정기점검-A",
    );
    const field = await inviteMember(
      db,
      admin.token,
      "maintenance-field-a@example.com",
    );
    const other = await signup(
      db,
      "maintenance-admin-b@example.com",
      "정기점검-B",
    );
    const hierarchy = await createHierarchy(db, admin.token, "idempotency");
    const firstDate = addCalendarDays(toSeoulDateString(), 1);
    const endDate = addCalendarDays(firstDate, 7);
    const body = recurrenceBody(
      hierarchy,
      [admin.user.id],
      firstDate,
      { endDate },
    );

    const concurrentDb = withTwoPartyBatchBarrier(db);
    const [first, concurrentReplay] = await Promise.all([
      createRecurrence(
        concurrentDb,
        admin.token,
        "maintenance-create-stable-a",
        body,
      ),
      createRecurrence(
        concurrentDb,
        admin.token,
        "maintenance-create-stable-a",
        body,
      ),
    ]);
    expect([first.response.status, concurrentReplay.response.status]).toEqual([
      200,
      200,
    ]);
    expect(concurrentReplay.json.workOrder.id).toBe(first.json.workOrder.id);
    const replay = await createRecurrence(
      db,
      admin.token,
      "maintenance-create-stable-a",
      body,
    );
    expect(replay.response.status).toBe(200);
    expect(replay.json.replayed).toBe(true);
    expect(replay.json.workOrder.id).toBe(first.json.workOrder.id);
    expect(replay.json.maintenanceSchedule.id).toBe(
      first.json.maintenanceSchedule.id,
    );

    const conflict = await createRecurrence(
      db,
      admin.token,
      "maintenance-create-stable-a",
      { ...body, workType: "다른 점검" },
    );
    expect(conflict.response.status).toBe(409);

    const counts = await db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM maintenance_schedules) AS schedules,
           (SELECT COUNT(*) FROM work_orders) AS work_orders`,
      )
      .first<{ schedules: number; work_orders: number }>();
    expect(counts).toEqual({ schedules: 1, work_orders: 1 });

    expect(
      (await request(db, "/maintenance-schedules", { token: field.token }))
        .status,
    ).toBe(403);
    expect(
      (
        await request(db, "/maintenance-schedules/sync", {
          method: "POST",
          token: field.token,
          body: JSON.stringify({}),
        })
      ).status,
    ).toBe(403);

    const otherList = await request(db, "/maintenance-schedules", {
      token: other.token,
    });
    expect(otherList.status).toBe(200);
    await expect(otherList.json()).resolves.toEqual({ schedules: [] });
    expect(
      (
        await request(
          db,
          `/maintenance-schedules/${first.json.maintenanceSchedule.id}`,
          {
            method: "PATCH",
            token: other.token,
            body: JSON.stringify({ action: "pause" }),
          },
        )
      ).status,
    ).toBe(404);

    const sync = await request(db, "/maintenance-schedules/sync", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ horizonDays: 30, rowCap: 10 }),
    });
    expect(sync.status).toBe(200);
    const syncJson = (await sync.json()) as {
      generated: number;
      processed: number;
      blockedCount: number;
    };
    expect(syncJson).toMatchObject({
      generated: 1,
      processed: 1,
      blockedCount: 0,
    });

    const list = await request(db, "/maintenance-schedules", {
      token: admin.token,
    });
    const listJson = (await list.json()) as {
      schedules: {
        status: string;
        nextOccurrenceDate: string | null;
        occurrences: { occurrenceDate: string }[];
      }[];
    };
    expect(listJson.schedules[0]).toMatchObject({
      status: "completed",
      nextOccurrenceDate: null,
    });
    expect(
      listJson.schedules[0]!.occurrences.map(
        (occurrence) => occurrence.occurrenceDate,
      ),
    ).toEqual([endDate, firstDate]);
  });

  it("copies only active assignees and pauses without advancing when none remain", async () => {
    const admin = await signup(
      db,
      "maintenance-active-admin@example.com",
      "정기점검-담당자",
    );
    const partialMember = await inviteMember(
      db,
      admin.token,
      "maintenance-partial@example.com",
    );
    const blockedMember = await inviteMember(
      db,
      admin.token,
      "maintenance-blocked@example.com",
    );
    const hierarchy = await createHierarchy(db, admin.token, "assignees");
    const firstDate = addCalendarDays(toSeoulDateString(), 1);
    const nextDate = addCalendarDays(firstDate, 7);

    const partial = await createRecurrence(
      db,
      admin.token,
      "maintenance-partial-assignees",
      recurrenceBody(
        hierarchy,
        [admin.user.id, partialMember.user.id],
        firstDate,
        { endDate: nextDate, workType: "부분 담당자 점검" },
      ),
    );
    const blocked = await createRecurrence(
      db,
      admin.token,
      "maintenance-no-assignees",
      recurrenceBody(
        hierarchy,
        [blockedMember.user.id],
        firstDate,
        { endDate: nextDate, workType: "담당자 중지 점검" },
      ),
    );
    expect(partial.response.status).toBe(200);
    expect(blocked.response.status).toBe(200);

    for (const memberId of [
      partialMember.user.id,
      blockedMember.user.id,
    ]) {
      const deactivate = await request(db, `/users/${memberId}/active`, {
        method: "PATCH",
        token: admin.token,
        body: JSON.stringify({ active: false }),
      });
      expect(deactivate.status).toBe(200);
    }

    const sync = await request(db, "/maintenance-schedules/sync", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ horizonDays: 30, rowCap: 10 }),
    });
    const syncJson = (await sync.json()) as {
      generated: number;
      blockedCount: number;
      blockedSchedules: { scheduleId: string; code: string }[];
    };
    expect(syncJson.generated).toBe(1);
    expect(syncJson.blockedCount).toBe(1);
    expect(syncJson.blockedSchedules).toContainEqual(
      expect.objectContaining({
        scheduleId: blocked.json.maintenanceSchedule.id,
        code: "no_active_assignees",
      }),
    );

    const generatedOccurrence = await db
      .prepare(
        `SELECT work_order_id
         FROM maintenance_occurrences
         WHERE schedule_id = ? AND occurrence_date = ?`,
      )
      .bind(partial.json.maintenanceSchedule.id, nextDate)
      .first<{ work_order_id: string }>();
    const copiedAssignments = await db
      .prepare(
        "SELECT user_id FROM assignments WHERE work_order_id = ?",
      )
      .bind(generatedOccurrence!.work_order_id)
      .all<{ user_id: string }>();
    expect((copiedAssignments.results ?? []).map((row) => row.user_id)).toEqual([
      admin.user.id,
    ]);

    const paused = await db
      .prepare(
        `SELECT status, next_occurrence_date, last_error_code
         FROM maintenance_schedules WHERE id = ?`,
      )
      .bind(blocked.json.maintenanceSchedule.id)
      .first<{
        status: string;
        next_occurrence_date: string;
        last_error_code: string;
      }>();
    expect(paused).toEqual({
      status: "paused",
      next_occurrence_date: nextDate,
      last_error_code: "no_active_assignees",
    });
    const resume = await request(
      db,
      `/maintenance-schedules/${blocked.json.maintenanceSchedule.id}`,
      {
        method: "PATCH",
        token: admin.token,
        body: JSON.stringify({ action: "resume" }),
      },
    );
    expect(resume.status).toBe(409);
  });

  it("rechecks the active assignee set inside the generation transaction", async () => {
    const admin = await signup(
      db,
      "maintenance-assignee-race@example.com",
      "정기점검-담당경쟁",
    );
    const firstMember = await inviteMember(
      db,
      admin.token,
      "maintenance-assignee-race-first@example.com",
    );
    const secondMember = await inviteMember(
      db,
      admin.token,
      "maintenance-assignee-race-second@example.com",
    );
    const hierarchy = await createHierarchy(db, admin.token, "assignee-race");
    const firstDate = addCalendarDays(toSeoulDateString(), 1);
    const nextDate = addCalendarDays(firstDate, 7);
    const created = await createRecurrence(
      db,
      admin.token,
      "maintenance-assignee-swap",
      recurrenceBody(
        hierarchy,
        [firstMember.user.id, secondMember.user.id],
        firstDate,
        { endDate: nextDate },
      ),
    );
    await db
      .prepare(
        "UPDATE memberships SET active = 0 WHERE org_id = ? AND user_id = ?",
      )
      .bind(admin.org.id, secondMember.user.id)
      .run();

    const racingDb = withBeforeFirstBatch(db, async () => {
      await db
        .prepare(
          `UPDATE memberships
           SET active = CASE
             WHEN user_id = ? THEN 0
             WHEN user_id = ? THEN 1
             ELSE active
           END
           WHERE org_id = ? AND user_id IN (?, ?)`,
        )
        .bind(
          firstMember.user.id,
          secondMember.user.id,
          admin.org.id,
          firstMember.user.id,
          secondMember.user.id,
        )
        .run();
    });
    const sync = await request(racingDb, "/maintenance-schedules/sync", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ horizonDays: 30, rowCap: 1 }),
    });
    expect(sync.status).toBe(200);
    const syncJson = (await sync.json()) as {
      generated: number;
      assignedCount: number;
    };
    expect(syncJson).toMatchObject({ generated: 1, assignedCount: 1 });

    const occurrence = await db
      .prepare(
        `SELECT work_order_id FROM maintenance_occurrences
         WHERE schedule_id = ? AND occurrence_date = ?`,
      )
      .bind(created.json.maintenanceSchedule.id, nextDate)
      .first<{ work_order_id: string }>();
    const assignments = await db
      .prepare("SELECT user_id FROM assignments WHERE work_order_id = ?")
      .bind(occurrence!.work_order_id)
      .all<{ user_id: string }>();
    expect((assignments.results ?? []).map((row) => row.user_id)).toEqual([
      secondMember.user.id,
    ]);
  });

  it("pauses on inactive hierarchy, then clears the error only after a valid resume", async () => {
    const admin = await signup(
      db,
      "maintenance-hierarchy@example.com",
      "정기점검-기준정보",
    );
    const hierarchy = await createHierarchy(
      db,
      admin.token,
      "hierarchy",
      true,
    );
    const firstDate = addCalendarDays(toSeoulDateString(), 1);
    const nextDate = addCalendarDays(firstDate, 7);
    const created = await createRecurrence(
      db,
      admin.token,
      "maintenance-inactive-hierarchy",
      recurrenceBody(hierarchy, [admin.user.id], firstDate, {
        endDate: nextDate,
      }),
    );
    expect(created.response.status).toBe(200);

    const deactivate = await request(db, `/assets/${hierarchy.assetId}`, {
      method: "PATCH",
      token: admin.token,
      body: JSON.stringify({ active: false }),
    });
    expect(deactivate.status).toBe(200);
    const blockedSync = await request(db, "/maintenance-schedules/sync", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ horizonDays: 30, rowCap: 10 }),
    });
    const blockedJson = (await blockedSync.json()) as {
      generated: number;
      blockedSchedules: { code: string }[];
    };
    expect(blockedJson.generated).toBe(0);
    expect(blockedJson.blockedSchedules[0]?.code).toBe(
      "inactive_hierarchy",
    );

    const blockedRow = await db
      .prepare(
        `SELECT status, next_occurrence_date, last_error_code
         FROM maintenance_schedules WHERE id = ?`,
      )
      .bind(created.json.maintenanceSchedule.id)
      .first<{
        status: string;
        next_occurrence_date: string;
        last_error_code: string;
      }>();
    expect(blockedRow).toEqual({
      status: "paused",
      next_occurrence_date: nextDate,
      last_error_code: "inactive_hierarchy",
    });

    const invalidResume = await request(
      db,
      `/maintenance-schedules/${created.json.maintenanceSchedule.id}`,
      {
        method: "PATCH",
        token: admin.token,
        body: JSON.stringify({ action: "resume" }),
      },
    );
    expect(invalidResume.status).toBe(409);

    const reactivate = await request(db, `/assets/${hierarchy.assetId}`, {
      method: "PATCH",
      token: admin.token,
      body: JSON.stringify({ active: true }),
    });
    expect(reactivate.status).toBe(200);
    const resume = await request(
      db,
      `/maintenance-schedules/${created.json.maintenanceSchedule.id}`,
      {
        method: "PATCH",
        token: admin.token,
        body: JSON.stringify({ action: "resume" }),
      },
    );
    expect(resume.status).toBe(200);
    const resumedRow = await db
      .prepare(
        `SELECT status, next_occurrence_date, last_error_code,
                last_error_message, last_error_at
         FROM maintenance_schedules WHERE id = ?`,
      )
      .bind(created.json.maintenanceSchedule.id)
      .first<{
        status: string;
        next_occurrence_date: string;
        last_error_code: string | null;
        last_error_message: string | null;
        last_error_at: string | null;
      }>();
    expect(resumedRow).toEqual({
      status: "active",
      next_occurrence_date: nextDate,
      last_error_code: null,
      last_error_message: null,
      last_error_at: null,
    });
  });

  it("does not create any recurrence row when hierarchy validity changes before the atomic batch", async () => {
    const admin = await signup(
      db,
      "maintenance-create-race@example.com",
      "정기점검-등록경쟁",
    );
    const hierarchy = await createHierarchy(
      db,
      admin.token,
      "create-race",
      true,
    );
    const racingDb = withBeforeFirstBatch(db, async () => {
      await db
        .prepare(
          `UPDATE master_entity_states
           SET active = 0
           WHERE org_id = ? AND entity_type = 'asset' AND entity_id = ?`,
        )
        .bind(admin.org.id, hierarchy.assetId)
        .run();
    });
    const firstDate = addCalendarDays(toSeoulDateString(), 1);
    const result = await createRecurrence(
      racingDb,
      admin.token,
      "maintenance-create-hierarchy-race",
      recurrenceBody(hierarchy, [admin.user.id], firstDate, {
        endDate: addCalendarDays(firstDate, 7),
      }),
    );
    expect(result.response.status).toBe(409);
    const counts = await db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM maintenance_schedules) AS schedules,
           (SELECT COUNT(*) FROM work_orders) AS work_orders`,
      )
      .first<{ schedules: number; work_orders: number }>();
    expect(counts).toEqual({ schedules: 0, work_orders: 0 });
  });

  it("anchors month-end dates and keeps concurrent sync/retry idempotent", async () => {
    const admin = await signup(
      db,
      "maintenance-concurrency@example.com",
      "정기점검-동시성",
    );
    const hierarchy = await createHierarchy(db, admin.token, "concurrency");
    const monthly = await createRecurrence(
      db,
      admin.token,
      "maintenance-month-end",
      recurrenceBody(hierarchy, [admin.user.id], "2026-01-31", {
        frequency: "monthly",
        endDate: "2026-03-31",
      }),
    );
    expect(monthly.response.status).toBe(200);
    const monthSync = await request(db, "/maintenance-schedules/sync", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ horizonDays: 366, rowCap: 10 }),
    });
    expect(monthSync.status).toBe(200);
    const monthRows = await db
      .prepare(
        `SELECT occurrence_date
         FROM maintenance_occurrences
         WHERE schedule_id = ?
         ORDER BY occurrence_date ASC`,
      )
      .bind(monthly.json.maintenanceSchedule.id)
      .all<{ occurrence_date: string }>();
    expect((monthRows.results ?? []).map((row) => row.occurrence_date)).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
    ]);

    const firstDate = addCalendarDays(toSeoulDateString(), 1);
    const nextDate = addCalendarDays(firstDate, 7);
    const weekly = await createRecurrence(
      db,
      admin.token,
      "maintenance-concurrent-weekly",
      recurrenceBody(hierarchy, [admin.user.id], firstDate, {
        endDate: nextDate,
      }),
    );
    const concurrentDb = withTwoPartyBatchBarrier(db);
    const responses = await Promise.all([
      request(concurrentDb, "/maintenance-schedules/sync", {
        method: "POST",
        token: admin.token,
        body: JSON.stringify({ horizonDays: 30, rowCap: 1 }),
      }),
      request(concurrentDb, "/maintenance-schedules/sync", {
        method: "POST",
        token: admin.token,
        body: JSON.stringify({ horizonDays: 30, rowCap: 1 }),
      }),
    ]);
    expect(responses.map((response) => response.status)).toEqual([200, 200]);

    const generated = await db
      .prepare(
        `SELECT work_order_id
         FROM maintenance_occurrences
         WHERE schedule_id = ? AND occurrence_date = ?`,
      )
      .bind(weekly.json.maintenanceSchedule.id, nextDate)
      .all<{ work_order_id: string }>();
    expect(generated.results ?? []).toHaveLength(1);
    const generatedWorkOrderId = generated.results![0]!.work_order_id;

    await db
      .prepare(
        `UPDATE maintenance_schedules
         SET status = 'active', next_occurrence_date = ?,
             revision = revision + 1
         WHERE id = ?`,
      )
      .bind(nextDate, weekly.json.maintenanceSchedule.id)
      .run();
    const retry = await request(db, "/maintenance-schedules/sync", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ horizonDays: 30, rowCap: 1 }),
    });
    const retryJson = (await retry.json()) as {
      generated: number;
      processed: number;
    };
    expect(retryJson).toMatchObject({ generated: 0, processed: 1 });

    const childCounts = await db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM assignments WHERE work_order_id = ?) AS assignments,
           (SELECT COUNT(*) FROM assignment_events WHERE work_order_id = ?) AS events,
           (SELECT COUNT(*) FROM notifications WHERE work_order_id = ?) AS notifications,
           (SELECT COUNT(*) FROM audit_events
              WHERE target = ? AND event = 'maintenance_work_generated') AS audits`,
      )
      .bind(
        generatedWorkOrderId,
        generatedWorkOrderId,
        generatedWorkOrderId,
        generatedWorkOrderId,
      )
      .first<{
        assignments: number;
        events: number;
        notifications: number;
        audits: number;
      }>();
    expect(childCounts).toEqual({
      assignments: 1,
      events: 1,
      notifications: 1,
      audits: 1,
    });
  });

  it("fences concurrent manual and automatic pauses to one state audit", async () => {
    const admin = await signup(
      db,
      "maintenance-pause-race@example.com",
      "정기점검-중지경쟁",
    );
    const blockedMember = await inviteMember(
      db,
      admin.token,
      "maintenance-pause-race-field@example.com",
    );
    const hierarchy = await createHierarchy(db, admin.token, "pause-race");
    const firstDate = addCalendarDays(toSeoulDateString(), 1);
    const nextDate = addCalendarDays(firstDate, 7);

    const manual = await createRecurrence(
      db,
      admin.token,
      "maintenance-manual-pause-race",
      recurrenceBody(hierarchy, [admin.user.id], firstDate, {
        endDate: nextDate,
      }),
    );
    const manualDb = withTwoPartyBatchBarrier(db);
    const manualResponses = await Promise.all([
      request(
        manualDb,
        `/maintenance-schedules/${manual.json.maintenanceSchedule.id}`,
        {
          method: "PATCH",
          token: admin.token,
          body: JSON.stringify({ action: "pause" }),
        },
      ),
      request(
        manualDb,
        `/maintenance-schedules/${manual.json.maintenanceSchedule.id}`,
        {
          method: "PATCH",
          token: admin.token,
          body: JSON.stringify({ action: "pause" }),
        },
      ),
    ]);
    expect(
      manualResponses.map((response) => response.status).sort(),
    ).toEqual([200, 409]);
    const manualAudits = await db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM audit_events
         WHERE target = ? AND event = 'maintenance_schedule_status_changed'`,
      )
      .bind(manual.json.maintenanceSchedule.id)
      .first<{ count: number }>();
    expect(manualAudits?.count).toBe(1);

    const automatic = await createRecurrence(
      db,
      admin.token,
      "maintenance-automatic-pause-race",
      recurrenceBody(hierarchy, [blockedMember.user.id], firstDate, {
        endDate: nextDate,
      }),
    );
    await request(db, `/users/${blockedMember.user.id}/active`, {
      method: "PATCH",
      token: admin.token,
      body: JSON.stringify({ active: false }),
    });
    const automaticDb = withTwoPartyBatchBarrier(db);
    const automaticResponses = await Promise.all([
      request(automaticDb, "/maintenance-schedules/sync", {
        method: "POST",
        token: admin.token,
        body: JSON.stringify({ horizonDays: 30, rowCap: 1 }),
      }),
      request(automaticDb, "/maintenance-schedules/sync", {
        method: "POST",
        token: admin.token,
        body: JSON.stringify({ horizonDays: 30, rowCap: 1 }),
      }),
    ]);
    expect(automaticResponses.map((response) => response.status)).toEqual([
      200,
      200,
    ]);
    const automaticAudits = await db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM audit_events
         WHERE target = ? AND event = 'maintenance_schedule_blocked'`,
      )
      .bind(automatic.json.maintenanceSchedule.id)
      .first<{ count: number }>();
    expect(automaticAudits?.count).toBe(1);
  });

  it("does not publish a phantom manual audit when blocked and manual pauses race", async () => {
    const admin = await signup(
      db,
      "maintenance-mixed-pause@example.com",
      "정기점검-혼합중지경쟁",
    );
    const blockedMember = await inviteMember(
      db,
      admin.token,
      "maintenance-mixed-pause-field@example.com",
    );
    const hierarchy = await createHierarchy(db, admin.token, "mixed-pause");
    const firstDate = addCalendarDays(toSeoulDateString(), 1);
    const created = await createRecurrence(
      db,
      admin.token,
      "maintenance-mixed-pause-race",
      recurrenceBody(hierarchy, [blockedMember.user.id], firstDate, {
        endDate: addCalendarDays(firstDate, 7),
      }),
    );
    await request(db, `/users/${blockedMember.user.id}/active`, {
      method: "PATCH",
      token: admin.token,
      body: JSON.stringify({ active: false }),
    });

    const racingDb = withTwoPartyBatchBarrier(db);
    const [manualResponse, syncResponse] = await Promise.all([
      request(
        racingDb,
        `/maintenance-schedules/${created.json.maintenanceSchedule.id}`,
        {
          method: "PATCH",
          token: admin.token,
          body: JSON.stringify({ action: "pause" }),
        },
      ),
      request(racingDb, "/maintenance-schedules/sync", {
        method: "POST",
        token: admin.token,
        body: JSON.stringify({ horizonDays: 30, rowCap: 1 }),
      }),
    ]);
    expect([200, 409]).toContain(manualResponse.status);
    expect(syncResponse.status).toBe(200);

    const auditCounts = await db
      .prepare(
        `SELECT event, COUNT(*) AS count
         FROM audit_events
         WHERE target = ?
           AND event IN (
             'maintenance_schedule_status_changed',
             'maintenance_schedule_blocked'
           )
         GROUP BY event`,
      )
      .bind(created.json.maintenanceSchedule.id)
      .all<{ event: string; count: number }>();
    const counts = new Map(
      (auditCounts.results ?? []).map((row) => [row.event, row.count]),
    );
    expect(
      (counts.get("maintenance_schedule_status_changed") ?? 0) +
        (counts.get("maintenance_schedule_blocked") ?? 0),
    ).toBe(1);
    if (manualResponse.status === 409) {
      expect(counts.get("maintenance_schedule_status_changed") ?? 0).toBe(0);
      expect(counts.get("maintenance_schedule_blocked")).toBe(1);
    }
  });

  it("lists more than 100 schedules without exceeding the D1 bind budget", async () => {
    const admin = await signup(
      db,
      "maintenance-bind-limit@example.com",
      "정기점검-목록한도",
    );
    const hierarchy = await createHierarchy(db, admin.token, "bind-limit");
    const now = new Date().toISOString();
    for (let index = 0; index < 101; index += 1) {
      const workOrderId = `maintenance-bind-work-${index}`;
      const scheduleId = `maintenance-bind-schedule-${index}`;
      await db.batch([
        db
          .prepare(
            `INSERT INTO work_orders
               (id, org_id, customer_id, site_id, asset_id, scheduled_date,
                scheduled_time, work_type, request, work_status,
                approval_status, billing_status, ai_status, created_by,
                created_at, updated_at)
             VALUES (?, ?, ?, ?, NULL, '2026-01-01', NULL, '목록 점검',
                     NULL, 'scheduled', 'not_sent', 'none', 'idle', ?, ?, ?)`,
          )
          .bind(
            workOrderId,
            admin.org.id,
            hierarchy.customerId,
            hierarchy.siteId,
            admin.user.id,
            now,
            now,
          ),
        db
          .prepare(
            `INSERT INTO maintenance_schedules
               (id, org_id, source_work_order_id, customer_id, site_id,
                asset_id, scheduled_time, work_type, request, idempotency_key,
                request_fingerprint, assignee_ids_json, frequency,
                interval_count, anchor_date, next_occurrence_date, end_date,
                status, revision, created_by, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, NULL, NULL, '목록 점검', NULL, ?, ?,
                     ?, 'monthly', 1, '2026-01-01', NULL, '2026-01-01',
                     'completed', 0, ?, ?, ?)`,
          )
          .bind(
            scheduleId,
            admin.org.id,
            workOrderId,
            hierarchy.customerId,
            hierarchy.siteId,
            `maintenance-bind-key-${index}`,
            String(index).padStart(64, "0"),
            JSON.stringify([admin.user.id]),
            admin.user.id,
            now,
            now,
          ),
      ]);
    }

    const limitedDb = withBindLimit(db, 100);
    const response = await request(limitedDb, "/maintenance-schedules", {
      token: admin.token,
    });
    expect(response.status).toBe(200);
    const json = (await response.json()) as { schedules: unknown[] };
    expect(json.schedules).toHaveLength(101);
  });

  it("consumes one immutable report candidate across different idempotency keys", async () => {
    const admin = await signup(
      db,
      "maintenance-report-source@example.com",
      "정기점검-보고서연결",
    );
    const hierarchy = await createHierarchy(
      db,
      admin.token,
      "report-source",
    );
    const sourceResponse = await request(db, "/work-orders", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({
        scheduledDate: toSeoulDateString(),
        workType: "정기점검",
        customerId: hierarchy.customerId,
        siteId: hierarchy.siteId,
        assigneeIds: [admin.user.id],
        intent: "schedule",
      }),
    });
    expect(sourceResponse.status).toBe(200);
    const source = (await sourceResponse.json()) as {
      workOrder: { id: string };
    };
    const reportVersionId = "maintenance-report-source-version";
    const nextInspectionDate = addCalendarDays(toSeoulDateString(), 30);
    const now = new Date().toISOString();
    await db
      .prepare(
        `INSERT INTO report_versions
           (id, work_order_id, version, report_number, structured_json,
            photos_json, template_version, created_by, created_at, locked_at)
         VALUES (?, ?, 1, ?, ?, '[]', 1, ?, ?, NULL)`,
      )
      .bind(
        reportVersionId,
        source.workOrder.id,
        "FS-MAINTENANCE-SOURCE-001",
        JSON.stringify({
          workSummary: "확정된 정기점검",
          actions: [],
          usedParts: [],
          issues: [],
          recommendations: [],
          nextInspectionDate,
          uncertainFields: [],
        }),
        admin.user.id,
        now,
      )
      .run();
    const body = recurrenceBody(
      hierarchy,
      [admin.user.id],
      nextInspectionDate,
      {
        frequency: "monthly",
        sourceReportVersionId: reportVersionId,
      },
    );

    const concurrentDb = withTwoPartyBatchBarrier(db);
    const [first, second] = await Promise.all([
      createRecurrence(
        concurrentDb,
        admin.token,
        "maintenance-report-source-key-a",
        body,
      ),
      createRecurrence(
        concurrentDb,
        admin.token,
        "maintenance-report-source-key-b",
        body,
      ),
    ]);
    expect(first.response.status).toBe(200);
    expect(second.response.status).toBe(200);
    expect(second.json.maintenanceSchedule.id).toBe(
      first.json.maintenanceSchedule.id,
    );
    expect(second.json.workOrder.id).toBe(first.json.workOrder.id);

    const counts = await db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM maintenance_schedules
            WHERE org_id = ? AND source_report_version_id = ?) AS schedules,
           (SELECT COUNT(*) FROM work_orders WHERE org_id = ?) AS work_orders,
           (SELECT COUNT(*) FROM maintenance_occurrences
            WHERE org_id = ?) AS occurrences`,
      )
      .bind(admin.org.id, reportVersionId, admin.org.id, admin.org.id)
      .first<{
        schedules: number;
        work_orders: number;
        occurrences: number;
      }>();
    expect(counts).toEqual({
      schedules: 1,
      work_orders: 2,
      occurrences: 1,
    });

    const conflict = await createRecurrence(
      db,
      admin.token,
      "maintenance-report-source-key-c",
      recurrenceBody(
        hierarchy,
        [admin.user.id],
        nextInspectionDate,
        {
          frequency: "monthly",
          intervalCount: 2,
          sourceReportVersionId: reportVersionId,
        },
      ),
    );
    expect(conflict.response.status).toBe(409);
  });

  it("exposes the next visit only from the latest immutable report version", async () => {
    const admin = await signup(
      db,
      "maintenance-candidate@example.com",
      "정기점검-다음방문",
    );
    const hierarchy = await createHierarchy(db, admin.token, "candidate");
    const sourceResponse = await request(db, "/work-orders", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({
        scheduledDate: toSeoulDateString(),
        workType: "완료된 점검",
        customerId: hierarchy.customerId,
        siteId: hierarchy.siteId,
        assigneeIds: [admin.user.id],
        intent: "schedule",
      }),
    });
    const source = (await sourceResponse.json()) as {
      workOrder: { id: string };
    };
    const immutableDate = addCalendarDays(toSeoulDateString(), 30);
    const mutableDate = addCalendarDays(toSeoulDateString(), 60);
    const now = new Date().toISOString();
    await db
      .prepare(
        `INSERT INTO report_versions
           (id, work_order_id, version, report_number, structured_json,
            photos_json, template_version, created_by, created_at, locked_at)
         VALUES (?, ?, 1, ?, ?, '[]', 1, ?, ?, NULL)`,
      )
      .bind(
        "maintenance-candidate-version",
        source.workOrder.id,
        "FS-CANDIDATE-001",
        JSON.stringify({
          workSummary: "확정된 점검",
          actions: [],
          usedParts: [],
          issues: [],
          recommendations: [],
          nextInspectionDate: immutableDate,
          uncertainFields: [],
        }),
        admin.user.id,
        now,
      )
      .run();
    await db
      .prepare(
        `INSERT INTO field_records
           (id, work_order_id, transcript, parts_json, checklist_json,
            next_inspection_date, updated_at)
         VALUES (?, ?, '수정 가능한 현장 기록', '[]', '[]', ?, ?)`,
      )
      .bind(
        "maintenance-candidate-field-record",
        source.workOrder.id,
        mutableDate,
        now,
      )
      .run();

    const detail = await request(
      db,
      `/work-orders/${source.workOrder.id}`,
      { token: admin.token },
    );
    expect(detail.status).toBe(200);
    const detailJson = (await detail.json()) as {
      fieldRecord: { nextInspectionDate: string };
      nextVisitCandidate: {
        scheduledDate: string;
        reportVersionId: string;
      };
    };
    expect(detailJson.fieldRecord.nextInspectionDate).toBe(mutableDate);
    expect(detailJson.nextVisitCandidate).toMatchObject({
      scheduledDate: immutableDate,
      reportVersionId: "maintenance-candidate-version",
    });

    await db.batch([
      db
        .prepare(
          `INSERT INTO work_orders
             (id, org_id, customer_id, site_id, asset_id, scheduled_date,
              scheduled_time, work_type, request, work_status,
              approval_status, billing_status, ai_status, canceled_at,
              created_by, created_at, updated_at)
           VALUES ('maintenance-canceled-next-work', ?, ?, ?, NULL, ?, NULL,
                   '취소된 다음 점검', NULL, 'canceled', 'not_sent', 'none',
                   'idle', ?, ?, ?, ?)`,
        )
        .bind(
          admin.org.id,
          hierarchy.customerId,
          hierarchy.siteId,
          immutableDate,
          now,
          admin.user.id,
          now,
          now,
        ),
      db
        .prepare(
          `INSERT INTO maintenance_schedules
             (id, org_id, source_work_order_id, customer_id, site_id, asset_id,
              scheduled_time, work_type, request, idempotency_key,
              request_fingerprint, assignee_ids_json, frequency,
              interval_count, anchor_date, next_occurrence_date, end_date,
              status, revision, created_by, created_at, updated_at)
           VALUES ('maintenance-canceled-candidate-schedule', ?, ?, ?, ?, NULL,
                   NULL, '취소된 반복', NULL, 'maintenance-canceled-candidate',
                   ?, ?, 'monthly', 1, ?, ?, NULL, 'canceled', 1, ?, ?, ?)`,
        )
        .bind(
          admin.org.id,
          source.workOrder.id,
          hierarchy.customerId,
          hierarchy.siteId,
          "c".repeat(64),
          JSON.stringify([admin.user.id]),
          toSeoulDateString(),
          immutableDate,
          admin.user.id,
          now,
          now,
        ),
      db
        .prepare(
          `INSERT INTO maintenance_occurrences
             (id, org_id, schedule_id, occurrence_date, work_order_id, created_at)
           VALUES ('maintenance-canceled-candidate-occurrence', ?,
                   'maintenance-canceled-candidate-schedule', ?, ?, ?)`,
        )
        .bind(
          admin.org.id,
          toSeoulDateString(),
          source.workOrder.id,
          now,
        ),
    ]);
    const afterCanceledRows = await request(
      db,
      `/work-orders/${source.workOrder.id}`,
      { token: admin.token },
    );
    const afterCanceledJson = (await afterCanceledRows.json()) as {
      nextVisitCandidate: {
        managedByScheduleId: string | null;
        existingWorkOrderId: string | null;
      };
    };
    expect(afterCanceledJson.nextVisitCandidate).toMatchObject({
      managedByScheduleId: null,
      existingWorkOrderId: null,
    });
  });
});
