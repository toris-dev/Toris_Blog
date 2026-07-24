import { beforeEach, describe, expect, it } from "vitest";
import app from "../worker.js";
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

function pauseFirstQueryContaining(
  db: D1Database,
  sqlFragment: string,
  onPaused: () => void,
  resume: Promise<void>,
): D1Database {
  let shouldPause = true;
  return new Proxy(db, {
    get(target, property) {
      if (property !== "prepare") {
        const value = Reflect.get(target, property);
        return typeof value === "function" ? value.bind(target) : value;
      }
      return (sql: string) => {
        const statement = target.prepare(sql);
        if (!sql.includes(sqlFragment)) return statement;
        const wrap = (current: D1PreparedStatement): D1PreparedStatement =>
          new Proxy(current, {
            get(statementTarget, statementProperty) {
              if (statementProperty === "bind") {
                return (...values: unknown[]) =>
                  wrap(statementTarget.bind(...values));
              }
              if (statementProperty === "first") {
                return async <T>(columnName?: string) => {
                  const row =
                    columnName === undefined
                      ? await statementTarget.first<T>()
                      : await statementTarget.first<T>(columnName);
                  if (shouldPause) {
                    shouldPause = false;
                    onPaused();
                    await resume;
                  }
                  return row;
                };
              }
              const value = Reflect.get(statementTarget, statementProperty);
              return typeof value === "function"
                ? value.bind(statementTarget)
                : value;
            },
          });
        return wrap(statement);
      };
    },
  });
}

async function signup(db: D1Database) {
  const response = await request(db, "/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      email: "admin@billing.test",
      password: "password123",
      name: "관리자",
      orgName: "청구 테스트 조직",
    }),
  });
  expect(response.status).toBe(200);
  return (await response.json()) as {
    token: string;
    user: { id: string };
    org: { id: string };
  };
}

async function seedApprovedWorkOrder(
  db: D1Database,
  fixture: Awaited<ReturnType<typeof signup>>,
  billingStatus: "billable" | "paid" = "billable",
) {
  const id = `work-order-${billingStatus}`;
  const ts = "2026-07-23T00:00:00.000Z";
  await db.batch([
    db
      .prepare(
        "INSERT INTO customers (id, org_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      )
      .bind("customer-1", fixture.org.id, "청구 고객", ts, ts),
    db
      .prepare(
        "INSERT INTO sites (id, org_id, customer_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind("site-1", fixture.org.id, "customer-1", "청구 현장", ts, ts),
    db
      .prepare(
        `INSERT INTO work_orders
           (id, org_id, customer_id, site_id, scheduled_date, work_type,
            work_status, approval_status, billing_status, ai_status,
            created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'completed', 'approved', ?, 'idle', ?, ?, ?)`,
      )
      .bind(
        id,
        fixture.org.id,
        "customer-1",
        "site-1",
        "2026-07-23",
        "정기점검",
        billingStatus,
        fixture.user.id,
        ts,
        ts,
      ),
  ]);
  return id;
}

describe("billing record and status consistency", () => {
  let db: D1Database;

  beforeEach(() => {
    db = createTestDb();
  });

  it("moves billable directly to paid when one request contains billedAt and paidAt", async () => {
    const fixture = await signup(db);
    const workOrderId = await seedApprovedWorkOrder(db, fixture);

    const response = await request(db, `/work-orders/${workOrderId}/billing`, {
      method: "PUT",
      token: fixture.token,
      body: JSON.stringify({
        amount: 150000,
        billedAt: "2026-07-23",
        dueAt: "2026-08-23",
        paidAt: "2026-07-24",
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      billing: {
        workOrderId,
        status: "paid",
        amount: 150000,
        billedAt: "2026-07-23",
        dueAt: "2026-08-23",
        paidAt: "2026-07-24",
      },
    });

    const storedWorkOrder = await db
      .prepare("SELECT billing_status FROM work_orders WHERE id = ?")
      .bind(workOrderId)
      .first<{ billing_status: string }>();
    expect(storedWorkOrder?.billing_status).toBe("paid");

    const listResponse = await request(db, "/billing", { token: fixture.token });
    expect(listResponse.status).toBe(200);
    const list = (await listResponse.json()) as {
      rows: Array<{
        workOrder: { billingStatus: string };
        billing: { status: string };
      }>;
    };
    expect(list.rows[0]?.workOrder.billingStatus).toBe("paid");
    expect(list.rows[0]?.billing.status).toBe("paid");

    const clearPaidAt = await request(db, `/work-orders/${workOrderId}/billing`, {
      method: "PUT",
      token: fixture.token,
      body: JSON.stringify({ paidAt: null }),
    });
    expect(clearPaidAt.status).toBe(409);
    await expect(clearPaidAt.json()).resolves.toEqual({
      error: "입금완료 상태는 이전 상태로 되돌릴 수 없습니다",
    });

    const paidState = await db
      .prepare(
        `SELECT br.paid_at, wo.billing_status
         FROM billing_records br
         JOIN work_orders wo ON wo.id = br.work_order_id
         WHERE br.work_order_id = ?`,
      )
      .bind(workOrderId)
      .first<{ paid_at: string | null; billing_status: string }>();
    expect(paidState).toEqual({
      paid_at: "2026-07-24",
      billing_status: "paid",
    });
  });

  it("preserves omitted fields and persists explicitly cleared fields as null", async () => {
    const fixture = await signup(db);
    const workOrderId = await seedApprovedWorkOrder(db, fixture);

    const stored = await request(db, `/work-orders/${workOrderId}/billing`, {
      method: "PUT",
      token: fixture.token,
      body: JSON.stringify({
        amount: 175000,
        billedAt: "2026-07-23",
        dueAt: "2026-08-23",
        memo: "세금계산서 발행",
      }),
    });
    expect(stored.status).toBe(200);

    const partial = await request(db, `/work-orders/${workOrderId}/billing`, {
      method: "PUT",
      token: fixture.token,
      body: JSON.stringify({ memo: "담당자 확인 완료" }),
    });
    expect(partial.status).toBe(200);
    await expect(partial.json()).resolves.toMatchObject({
      billing: {
        amount: 175000,
        billedAt: "2026-07-23",
        dueAt: "2026-08-23",
        paidAt: null,
        memo: "담당자 확인 완료",
      },
    });

    const cleared = await request(db, `/work-orders/${workOrderId}/billing`, {
      method: "PUT",
      token: fixture.token,
      body: JSON.stringify({
        amount: null,
        billedAt: null,
        dueAt: null,
        paidAt: null,
        memo: null,
      }),
    });
    expect(cleared.status).toBe(200);
    await expect(cleared.json()).resolves.toMatchObject({
      billing: {
        status: "billable",
        amount: null,
        billedAt: null,
        dueAt: null,
        paidAt: null,
        memo: null,
      },
    });

    const row = await db
      .prepare(
        `SELECT br.amount, br.billed_at, br.due_at, br.paid_at, br.memo,
                wo.billing_status
         FROM billing_records br
         JOIN work_orders wo ON wo.id = br.work_order_id
         WHERE br.work_order_id = ?`,
      )
      .bind(workOrderId)
      .first<{
        amount: number | null;
        billed_at: string | null;
        due_at: string | null;
        paid_at: string | null;
        memo: string | null;
        billing_status: string;
      }>();
    expect(row).toEqual({
      amount: null,
      billed_at: null,
      due_at: null,
      paid_at: null,
      memo: null,
      billing_status: "billable",
    });

    const listed = await request(db, "/billing", { token: fixture.token });
    expect(listed.status).toBe(200);
    const listedBody = (await listed.json()) as {
      rows: Array<{
        workOrder: { id: string; billingStatus: string };
        billing: {
          status: string;
          amount: number | null;
          billedAt: string | null;
          dueAt: string | null;
          paidAt: string | null;
          memo: string | null;
        };
      }>;
    };
    expect(
      listedBody.rows.find((entry) => entry.workOrder.id === workOrderId)?.billing,
    ).toMatchObject({
      amount: null,
      billedAt: null,
      dueAt: null,
      paidAt: null,
      memo: null,
      status: "billable",
    });
    expect(
      listedBody.rows.find((entry) => entry.workOrder.id === workOrderId)
        ?.workOrder.billingStatus,
    ).toBe("billable");
  });

  it.each([
    [
      "rejects a due date without a billed date",
      { dueAt: "2026-08-23" },
      "납기일과 입금일을 입력하려면 청구일이 필요합니다",
    ],
    [
      "rejects a paid date without a billed date",
      { paidAt: "2026-07-24" },
      "납기일과 입금일을 입력하려면 청구일이 필요합니다",
    ],
    [
      "rejects a negative amount",
      { amount: -1 },
      "청구 금액은 0 이상의 유한한 숫자여야 합니다",
    ],
    [
      "rejects an invalid calendar date",
      { billedAt: "2026-02-30" },
      "청구일은 YYYY-MM-DD 형식의 유효한 날짜여야 합니다",
    ],
    [
      "rejects a due date before the billed date",
      { billedAt: "2026-07-23", dueAt: "2026-07-22" },
      "납기일은 청구일보다 빠를 수 없습니다",
    ],
    [
      "rejects a paid date before the billed date",
      { billedAt: "2026-07-23", paidAt: "2026-07-22" },
      "입금일은 청구일보다 빠를 수 없습니다",
    ],
    [
      "rejects billed state without an amount",
      { billedAt: "2026-07-23" },
      "청구완료 처리에는 0원보다 큰 청구 금액과 청구일이 필요합니다",
    ],
    [
      "rejects billed state with a zero amount",
      { amount: 0, billedAt: "2026-07-23" },
      "청구완료 처리에는 0원보다 큰 청구 금액과 청구일이 필요합니다",
    ],
  ])("%s", async (_name, body, error) => {
    const fixture = await signup(db);
    const workOrderId = await seedApprovedWorkOrder(db, fixture);

    const response = await request(db, `/work-orders/${workOrderId}/billing`, {
      method: "PUT",
      token: fixture.token,
      body: JSON.stringify(body),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error });
    const record = await db
      .prepare("SELECT id FROM billing_records WHERE work_order_id = ?")
      .bind(workOrderId)
      .first();
    expect(record).toBeNull();
  });

  it("rejects a non-finite amount", async () => {
    const fixture = await signup(db);
    const workOrderId = await seedApprovedWorkOrder(db, fixture);
    const response = await request(db, `/work-orders/${workOrderId}/billing`, {
      method: "PUT",
      token: fixture.token,
      body: '{"amount":1e999}',
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "청구 금액은 0 이상의 유한한 숫자여야 합니다",
    });
  });

  it("returns 409 instead of regressing a paid work order with inconsistent legacy data", async () => {
    const fixture = await signup(db);
    const workOrderId = await seedApprovedWorkOrder(db, fixture, "paid");
    await db
      .prepare(
        `INSERT INTO billing_records
           (id, work_order_id, amount, billed_at, due_at, paid_at, memo, updated_at)
         VALUES (?, ?, ?, ?, ?, NULL, NULL, ?)`,
      )
      .bind(
        "billing-paid-legacy",
        workOrderId,
        150000,
        "2026-07-23",
        "2026-08-23",
        "2026-07-23T00:00:00.000Z",
      )
      .run();

    const response = await request(db, `/work-orders/${workOrderId}/billing`, {
      method: "PUT",
      token: fixture.token,
      body: JSON.stringify({ amount: 160000 }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "입금완료 상태는 이전 상태로 되돌릴 수 없습니다",
    });
    const stored = await db
      .prepare("SELECT billing_status FROM work_orders WHERE id = ?")
      .bind(workOrderId)
      .first<{ billing_status: string }>();
    expect(stored?.billing_status).toBe("paid");
  });

  it("uses billing row CAS so a stale concurrent write returns 409 without overwriting the winner", async () => {
    const fixture = await signup(db);
    const workOrderId = await seedApprovedWorkOrder(db, fixture);

    const initial = await request(db, `/work-orders/${workOrderId}/billing`, {
      method: "PUT",
      token: fixture.token,
      body: JSON.stringify({ amount: 100000 }),
    });
    expect(initial.status).toBe(200);

    let signalPaused!: () => void;
    const paused = new Promise<void>((resolve) => {
      signalPaused = resolve;
    });
    let signalResume!: () => void;
    const resume = new Promise<void>((resolve) => {
      signalResume = resolve;
    });
    const racingDb = pauseFirstQueryContaining(
      db,
      "FROM billing_records WHERE work_order_id = ?",
      signalPaused,
      resume,
    );

    const stalePromise = request(
      racingDb,
      `/work-orders/${workOrderId}/billing`,
      {
        method: "PUT",
        token: fixture.token,
        body: JSON.stringify({
          amount: 300000,
          billedAt: "2026-07-23",
        }),
      },
    );
    await paused;

    const winner = await request(db, `/work-orders/${workOrderId}/billing`, {
      method: "PUT",
      token: fixture.token,
      body: JSON.stringify({
        amount: 200000,
        billedAt: "2026-07-23",
      }),
    });
    expect(winner.status).toBe(200);
    signalResume();

    const stale = await stalePromise;
    expect(stale.status).toBe(409);
    await expect(stale.json()).resolves.toEqual({
      error: "청구 정보가 다른 요청에서 변경되었습니다. 새로고침 후 다시 시도해주세요",
    });

    const stored = await db
      .prepare(
        `SELECT br.amount, br.billed_at, br.revision, wo.billing_status
         FROM billing_records br
         JOIN work_orders wo ON wo.id = br.work_order_id
         WHERE br.work_order_id = ?`,
      )
      .bind(workOrderId)
      .first<{
        amount: number;
        billed_at: string;
        revision: number;
        billing_status: string;
      }>();
    expect(stored).toMatchObject({
      amount: 200000,
      billed_at: "2026-07-23",
      revision: 2,
      billing_status: "billed",
    });
  });
});
