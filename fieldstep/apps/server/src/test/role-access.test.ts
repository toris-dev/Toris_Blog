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

async function signup(db: D1Database) {
  const response = await request(db, "/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      email: "admin@roles.test",
      password: "password123",
      name: "관리자",
      orgName: "역할 테스트 조직",
    }),
  });
  expect(response.status).toBe(200);
  return (await response.json()) as {
    token: string;
    user: { id: string };
    org: { id: string };
  };
}

async function inviteAndAccept(
  db: D1Database,
  adminToken: string,
  email: string,
  role: Exclude<Role, "admin">,
) {
  const inviteResponse = await request(db, "/invites", {
    method: "POST",
    token: adminToken,
    body: JSON.stringify({ email, role }),
  });
  expect(inviteResponse.status).toBe(200);
  const { invite } = (await inviteResponse.json()) as {
    invite: { token: string };
  };

  const acceptResponse = await request(db, "/auth/accept-invite", {
    method: "POST",
    body: JSON.stringify({
      token: invite.token,
      name: role === "office" ? "사무 담당자" : "현장 담당자",
      password: "password123",
    }),
  });
  expect(acceptResponse.status).toBe(200);
  return ((await acceptResponse.json()) as { token: string }).token;
}

async function createCrmFixture(db: D1Database, token: string) {
  const customerResponse = await request(db, "/customers", {
    method: "POST",
    token,
    body: JSON.stringify({ name: "테스트 고객" }),
  });
  expect(customerResponse.status).toBe(200);
  const customer = (
    (await customerResponse.json()) as { customer: { id: string } }
  ).customer;

  const siteResponse = await request(db, "/sites", {
    method: "POST",
    token,
    body: JSON.stringify({ customerId: customer.id, name: "테스트 현장" }),
  });
  expect(siteResponse.status).toBe(200);
  const site = ((await siteResponse.json()) as { site: { id: string } }).site;

  const assetResponse = await request(db, "/assets", {
    method: "POST",
    token,
    body: JSON.stringify({ siteId: site.id, name: "테스트 장비" }),
  });
  expect(assetResponse.status).toBe(200);
  const asset = ((await assetResponse.json()) as { asset: { id: string } })
    .asset;

  return { customer, site, asset };
}

describe("organization-wide route role access", () => {
  let db: D1Database;

  beforeEach(() => {
    db = createTestDb();
  });

  it("fails closed for a nonstandard membership role on sessions and login", async () => {
    const admin = await signup(db);
    await db
      .prepare(
        "UPDATE memberships SET role = 'supervisor' WHERE org_id = ? AND user_id = ?",
      )
      .bind(admin.org.id, admin.user.id)
      .run();

    for (const path of ["/me", "/customers", "/work-orders"]) {
      const response = await request(db, path, { token: admin.token });
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({
        error: "조직 멤버십이 유효하지 않습니다",
      });
    }

    const sessionsBefore = await db
      .prepare("SELECT COUNT(*) AS count FROM sessions WHERE user_id = ?")
      .bind(admin.user.id)
      .first<{ count: number }>();
    const login = await request(db, "/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "admin@roles.test",
        password: "password123",
      }),
    });
    expect(login.status).toBe(401);
    await expect(login.json()).resolves.toEqual({
      error: "조직 멤버십이 유효하지 않습니다",
    });
    const sessionsAfter = await db
      .prepare("SELECT COUNT(*) AS count FROM sessions WHERE user_id = ?")
      .bind(admin.user.id)
      .first<{ count: number }>();
    expect(sessionsAfter?.count).toBe(sessionsBefore?.count);
  });

  it("rejects a corrupted invite role before creating a membership or session", async () => {
    const admin = await signup(db);
    const inviteResponse = await request(db, "/invites", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ email: "corrupt-role@roles.test", role: "field" }),
    });
    expect(inviteResponse.status).toBe(200);
    const invite = (await inviteResponse.json()) as {
      invite: { id: string; token: string };
    };
    await db
      .prepare("UPDATE invites SET role = 'supervisor' WHERE id = ?")
      .bind(invite.invite.id)
      .run();

    const accepted = await request(db, "/auth/accept-invite", {
      method: "POST",
      body: JSON.stringify({
        token: invite.invite.token,
        name: "비표준 역할",
        password: "password123",
      }),
    });
    expect(accepted.status).toBe(409);
    await expect(accepted.json()).resolves.toEqual({
      error: "초대 역할이 유효하지 않습니다",
    });
    const user = await db
      .prepare("SELECT id FROM users WHERE email = ?")
      .bind("corrupt-role@roles.test")
      .first();
    expect(user).toBeNull();
  });

  it("field cannot read organization-wide CRM, billing, or dashboard data", async () => {
    const admin = await signup(db);
    const fieldToken = await inviteAndAccept(
      db,
      admin.token,
      "field@roles.test",
      "field",
    );
    const fixture = await createCrmFixture(db, admin.token);

    const paths = [
      "/customers",
      `/customers/${fixture.customer.id}`,
      "/sites",
      "/assets",
      `/assets/${fixture.asset.id}/history`,
      "/billing",
      "/dashboard",
    ];

    for (const path of paths) {
      const response = await request(db, path, { token: fieldToken });
      expect(response.status, `${path} should reject field`).toBe(403);
      await expect(response.json()).resolves.toEqual({
        error: "권한이 없습니다",
      });
    }
  });

  it("field cannot mutate CRM or billing data", async () => {
    const admin = await signup(db);
    const fieldToken = await inviteAndAccept(
      db,
      admin.token,
      "field@roles.test",
      "field",
    );
    const fixture = await createCrmFixture(db, admin.token);
    const requests = [
      request(db, "/customers", {
        method: "POST",
        token: fieldToken,
        body: JSON.stringify({ name: "차단 고객" }),
      }),
      request(db, `/customers/${fixture.customer.id}`, {
        method: "PATCH",
        token: fieldToken,
        body: JSON.stringify({ name: "차단 고객" }),
      }),
      request(db, "/sites", {
        method: "POST",
        token: fieldToken,
        body: JSON.stringify({
          customerId: fixture.customer.id,
          name: "차단 현장",
        }),
      }),
      request(db, `/sites/${fixture.site.id}`, {
        method: "PATCH",
        token: fieldToken,
        body: JSON.stringify({ name: "차단 현장" }),
      }),
      request(db, "/assets", {
        method: "POST",
        token: fieldToken,
        body: JSON.stringify({
          siteId: fixture.site.id,
          name: "차단 장비",
        }),
      }),
      request(db, `/assets/${fixture.asset.id}`, {
        method: "PATCH",
        token: fieldToken,
        body: JSON.stringify({ name: "차단 장비" }),
      }),
      request(db, "/work-orders/missing/billing", {
        method: "PUT",
        token: fieldToken,
        body: JSON.stringify({ amount: 1000 }),
      }),
    ];

    for (const responsePromise of requests) {
      const response = await responsePromise;
      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({
        error: "권한이 없습니다",
      });
    }
  });

  it.each(["admin", "office"] as const)(
    "%s retains access to organization-wide reads",
    async (role) => {
      const admin = await signup(db);
      const token =
        role === "admin"
          ? admin.token
          : await inviteAndAccept(
              db,
              admin.token,
              "office@roles.test",
              "office",
            );
      const fixture = await createCrmFixture(db, admin.token);

      const paths = [
        "/customers",
        `/customers/${fixture.customer.id}`,
        "/sites",
        "/assets",
        `/assets/${fixture.asset.id}/history`,
        "/billing",
        "/dashboard",
      ];

      for (const path of paths) {
        const response = await request(db, path, { token });
        expect(response.status, `${path} should allow ${role}`).toBe(200);
      }
    },
  );
});
