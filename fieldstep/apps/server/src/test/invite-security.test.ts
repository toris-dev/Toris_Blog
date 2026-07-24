import { describe, expect, it } from "vitest";
import app from "../worker.js";
import { createTestDb } from "./d1-shim.js";

const req = (db: D1Database, path: string, init: RequestInit & { token?: string } = {}) => {
  const { token, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (rest.body) headers.set("Content-Type", "application/json");
  return app.request(path, { ...rest, headers }, { DB: db });
};

async function signup(db: D1Database) {
  const res = await req(db, "/auth/signup", { method: "POST", body: JSON.stringify({ email: "admin@example.com", password: "password123", name: "Admin", orgName: "Org" }) });
  return (await res.json()) as {
    token: string;
    user: { id: string };
    org: { id: string };
  };
}

async function createInvite(
  db: D1Database,
  token: string,
  email: string,
  role: "admin" | "office" | "field" = "field",
) {
  const response = await req(db, "/invites", {
    method: "POST",
    token,
    body: JSON.stringify({ email, role }),
  });
  expect(response.status).toBe(200);
  return (
    (await response.json()) as {
      invite: { id: string; token: string };
    }
  ).invite;
}

describe("invite ownership and lifecycle", () => {
  it("does not link an existing account without its password", async () => {
    const db = createTestDb();
    const { token } = await signup(db);
    const created = await req(db, "/invites", { method: "POST", token, body: JSON.stringify({ email: "admin@example.com", role: "field" }) });
    const { invite } = (await created.json()) as { invite: { token: string } };
    const accepted = await req(db, "/auth/accept-invite", { method: "POST", body: JSON.stringify({ token: invite.token, name: "Admin", password: "wrongpass" }) });
    expect(accepted.status).toBe(409);
  });

  it("normalizes email and rejects duplicate pending invites", async () => {
    const db = createTestDb();
    const { token } = await signup(db);
    const first = await req(db, "/invites", { method: "POST", token, body: JSON.stringify({ email: "  Worker@Example.COM ", role: "field" }) });
    expect(first.status).toBe(200);
    const second = await req(db, "/invites", { method: "POST", token, body: JSON.stringify({ email: "worker@example.com", role: "field" }) });
    expect(second.status).toBe(409);
  });

  it("atomically admits only one concurrent pending invite per organization and email", async () => {
    const db = createTestDb();
    const { token, org } = await signup(db);
    const create = () =>
      req(db, "/invites", {
        method: "POST",
        token,
        body: JSON.stringify({ email: "race@example.com", role: "field" }),
      });

    const responses = await Promise.all([create(), create()]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);

    const count = await db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM invites i
         LEFT JOIN invite_lifecycle il ON il.invite_id = i.id
         WHERE i.org_id = ? AND i.email = ?
           AND i.accepted_at IS NULL AND il.canceled_at IS NULL`,
      )
      .bind(org.id, "race@example.com")
      .first<{ count: number }>();
    expect(count?.count).toBe(1);
  });

  it("lets only one concurrent resend rotate the token", async () => {
    const db = createTestDb();
    const { token } = await signup(db);
    const original = await createInvite(db, token, "resend-race@example.com");
    const resend = () =>
      req(db, `/invites/${original.id}/resend`, {
        method: "POST",
        token,
      });

    const responses = await Promise.all([resend(), resend()]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    const winner = responses.find((response) => response.status === 200)!;
    const winnerBody = (await winner.json()) as {
      invite: { token: string; resendCount: number };
    };
    expect(winnerBody.invite.resendCount).toBe(1);

    const oldToken = await req(db, "/auth/accept-invite", {
      method: "POST",
      body: JSON.stringify({
        token: original.token,
        name: "Worker",
        password: "password123",
      }),
    });
    expect(oldToken.status).toBe(404);

    const accepted = await req(db, "/auth/accept-invite", {
      method: "POST",
      body: JSON.stringify({
        token: winnerBody.invite.token,
        name: "Worker",
        password: "password123",
      }),
    });
    expect(accepted.status).toBe(200);
  });

  it("allows only acceptance or resend to win for the same token", async () => {
    const db = createTestDb();
    const { token, org } = await signup(db);
    const invite = await createInvite(db, token, "accept-resend-race@example.com");

    const [accepted, resent] = await Promise.all([
      req(db, "/auth/accept-invite", {
        method: "POST",
        body: JSON.stringify({
          token: invite.token,
          name: "Worker",
          password: "password123",
        }),
      }),
      req(db, `/invites/${invite.id}/resend`, {
        method: "POST",
        token,
      }),
    ]);

    expect([accepted.status, resent.status].filter((status) => status === 200)).toHaveLength(1);
    expect([200, 404, 409]).toContain(accepted.status);
    expect([200, 409]).toContain(resent.status);

    const state = await db
      .prepare("SELECT accepted_at FROM invites WHERE id = ? AND org_id = ?")
      .bind(invite.id, org.id)
      .first<{ accepted_at: string | null }>();
    const membership = await db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM memberships m
         JOIN users u ON u.id = m.user_id
         WHERE m.org_id = ? AND u.email = ?`,
      )
      .bind(org.id, "accept-resend-race@example.com")
      .first<{ count: number }>();
    const sessions = await db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.org_id = ? AND u.email = ?`,
      )
      .bind(org.id, "accept-resend-race@example.com")
      .first<{ count: number }>();

    expect(membership?.count).toBe(state?.accepted_at ? 1 : 0);
    expect(sessions?.count).toBe(state?.accepted_at ? 1 : 0);

    if (resent.status === 200) {
      const resentBody = (await resent.json()) as { invite: { token: string } };
      const acceptedWithNewToken = await req(db, "/auth/accept-invite", {
        method: "POST",
        body: JSON.stringify({
          token: resentBody.invite.token,
          name: "Worker",
          password: "password123",
        }),
      });
      expect(acceptedWithNewToken.status).toBe(200);
    }
  });

  it("allows exactly one winner when acceptance races cancellation", async () => {
    const db = createTestDb();
    const { token, org } = await signup(db);
    const invite = await createInvite(db, token, "cancel-race@example.com");

    const [accepted, canceled] = await Promise.all([
      req(db, "/auth/accept-invite", {
        method: "POST",
        body: JSON.stringify({
          token: invite.token,
          name: "Worker",
          password: "password123",
        }),
      }),
      req(db, `/invites/${invite.id}`, { method: "DELETE", token }),
    ]);

    expect([accepted.status, canceled.status].filter((status) => status === 200)).toHaveLength(1);
    expect([200, 409, 410]).toContain(accepted.status);
    expect([200, 409]).toContain(canceled.status);

    const state = await db
      .prepare(
        `SELECT i.accepted_at, il.canceled_at
         FROM invites i
         LEFT JOIN invite_lifecycle il ON il.invite_id = i.id
         WHERE i.id = ? AND i.org_id = ?`,
      )
      .bind(invite.id, org.id)
      .first<{ accepted_at: string | null; canceled_at: string | null }>();
    expect(Boolean(state?.accepted_at)).not.toBe(Boolean(state?.canceled_at));

    const membership = await db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM memberships m
         JOIN users u ON u.id = m.user_id
         WHERE m.org_id = ? AND u.email = ?`,
      )
      .bind(org.id, "cancel-race@example.com")
      .first<{ count: number }>();
    expect(membership?.count).toBe(state?.accepted_at ? 1 : 0);
  });

  it("claims a token once under concurrent acceptance", async () => {
    const db = createTestDb();
    const { token, org } = await signup(db);
    const invite = await createInvite(db, token, "accept-race@example.com");
    const accept = () =>
      req(db, "/auth/accept-invite", {
        method: "POST",
        body: JSON.stringify({
          token: invite.token,
          name: "Worker",
          password: "password123",
        }),
      });

    const responses = await Promise.all([accept(), accept()]);
    expect(responses.filter((response) => response.status === 200)).toHaveLength(1);
    expect(responses.every((response) => [200, 404, 409].includes(response.status))).toBe(true);

    const sessions = await db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.org_id = ? AND u.email = ?`,
      )
      .bind(org.id, "accept-race@example.com")
      .first<{ count: number }>();
    expect(sessions?.count).toBe(1);
  });

  it("re-authenticates an existing account and preserves its existing membership role", async () => {
    const db = createTestDb();
    const { token } = await signup(db);
    const invite = await createInvite(db, token, "admin@example.com", "field");

    const accepted = await req(db, "/auth/accept-invite", {
      method: "POST",
      body: JSON.stringify({
        token: invite.token,
        name: "Ignored",
        password: "password123",
      }),
    });
    expect(accepted.status).toBe(200);
    const body = (await accepted.json()) as { token: string; role: string };
    expect(body.role).toBe("admin");

    const me = await req(db, "/me", { token: body.token });
    await expect(me.json()).resolves.toMatchObject({ role: "admin" });
  });
});
