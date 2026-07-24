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

async function signup(
  db: D1Database,
  email = "admin@org-crm.test",
  extra: Record<string, unknown> = {},
) {
  const response = await request(db, "/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: "password123",
      name: "관리자",
      orgName: "현장완료 산업서비스",
      ...extra,
    }),
  });
  expect(response.status).toBe(200);
  return (await response.json()) as {
    token: string;
    org: { id: string };
  };
}

async function createInvite(
  db: D1Database,
  token: string,
  email: string,
  role: "office" | "field" = "office",
) {
  const response = await request(db, "/invites", {
    method: "POST",
    token,
    body: JSON.stringify({ email, role }),
  });
  expect(response.status).toBe(200);
  return (
    (await response.json()) as {
      invite: { id: string; token: string; resendCount: number; status: string };
    }
  ).invite;
}

describe("organization profile and invite lifecycle", () => {
  let db: D1Database;

  beforeEach(() => {
    db = createTestDb();
  });

  it("stores, reads, and updates organization business/contact information", async () => {
    const admin = await signup(db, undefined, {
      orgLogoUrl: "https://cdn.example.test/logo.png",
      orgBusinessNo: "123-45-67890",
      orgAddress: "부산광역시 강서구 산업로 1",
      orgContactName: "김현장",
      orgContactPhone: "051-123-4567",
      orgContactEmail: "CONTACT@EXAMPLE.TEST",
    });

    const read = await request(db, "/organization", { token: admin.token });
    expect(read.status).toBe(200);
    const initial = (await read.json()) as {
      organization: Record<string, unknown>;
    };
    expect(initial.organization).toMatchObject({
      id: admin.org.id,
      name: "현장완료 산업서비스",
      logoUrl: "https://cdn.example.test/logo.png",
      businessNo: "123-45-67890",
      address: "부산광역시 강서구 산업로 1",
      contactName: "김현장",
      contactPhone: "051-123-4567",
      contactEmail: "contact@example.test",
    });

    const updated = await request(db, "/organization", {
      method: "PATCH",
      token: admin.token,
      body: JSON.stringify({
        name: "현장완료 엔지니어링",
        logoUrl: null,
        address: "울산광역시 산업로 2",
      }),
    });
    expect(updated.status).toBe(200);
    await expect(updated.json()).resolves.toMatchObject({
      organization: {
        name: "현장완료 엔지니어링",
        logoUrl: null,
        address: "울산광역시 산업로 2",
        businessNo: "123-45-67890",
      },
    });

    const audit = await db
      .prepare(
        "SELECT detail_json FROM audit_events WHERE org_id = ? AND event = 'organization_updated' ORDER BY created_at DESC LIMIT 1",
      )
      .bind(admin.org.id)
      .first<{ detail_json: string }>();
    expect(JSON.parse(audit!.detail_json)).toEqual({
      changedFields: ["name", "logoUrl", "address"],
    });
  });

  it("resends with a new token and invalidates the old token", async () => {
    const admin = await signup(db);
    const original = await createInvite(db, admin.token, "office@invite.test");

    const resentResponse = await request(db, `/invites/${original.id}/resend`, {
      method: "POST",
      token: admin.token,
    });
    expect(resentResponse.status).toBe(200);
    const resent = (
      (await resentResponse.json()) as {
        invite: { token: string; resendCount: number; status: string };
      }
    ).invite;
    expect(resent.token).not.toBe(original.token);
    expect(resent.resendCount).toBe(1);
    expect(resent.status).toBe("pending");

    const oldToken = await request(db, "/auth/accept-invite", {
      method: "POST",
      body: JSON.stringify({
        token: original.token,
        name: "사무 담당자",
        password: "password123",
      }),
    });
    expect(oldToken.status).toBe(404);

    const accepted = await request(db, "/auth/accept-invite", {
      method: "POST",
      body: JSON.stringify({
        token: resent.token,
        name: "사무 담당자",
        password: "password123",
      }),
    });
    expect(accepted.status).toBe(200);

    const list = await request(db, "/invites", { token: admin.token });
    const listed = (
      (await list.json()) as {
        invites: { id: string; status: string; resendCount: number; accepted: boolean }[];
      }
    ).invites.find((invite) => invite.id === original.id);
    expect(listed).toMatchObject({
      status: "accepted",
      resendCount: 1,
      accepted: true,
    });
  });

  it("cancels an invite, rejects its token, and permits a replacement invite", async () => {
    const admin = await signup(db);
    const original = await createInvite(db, admin.token, "field@invite.test", "field");

    const canceled = await request(db, `/invites/${original.id}`, {
      method: "DELETE",
      token: admin.token,
    });
    expect(canceled.status).toBe(200);
    await expect(canceled.json()).resolves.toMatchObject({
      ok: true,
      invite: { status: "canceled" },
    });

    const acceptCanceled = await request(db, "/auth/accept-invite", {
      method: "POST",
      body: JSON.stringify({
        token: original.token,
        name: "현장 담당자",
        password: "password123",
      }),
    });
    expect(acceptCanceled.status).toBe(410);

    const resendCanceled = await request(db, `/invites/${original.id}/resend`, {
      method: "POST",
      token: admin.token,
    });
    expect(resendCanceled.status).toBe(409);

    const replacement = await request(db, "/invites", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ email: "field@invite.test", role: "field" }),
    });
    expect(replacement.status).toBe(200);
  });

  it("does not expose or mutate another organization's invites", async () => {
    const first = await signup(db, "first@invite.test");
    const second = await signup(db, "second@invite.test");
    const invite = await createInvite(db, first.token, "worker@invite.test", "field");

    const resend = await request(db, `/invites/${invite.id}/resend`, {
      method: "POST",
      token: second.token,
    });
    const cancel = await request(db, `/invites/${invite.id}`, {
      method: "DELETE",
      token: second.token,
    });
    expect(resend.status).toBe(404);
    expect(cancel.status).toBe(404);
  });
});

describe("CRM search, active state, and audit events", () => {
  let db: D1Database;

  beforeEach(() => {
    db = createTestDb();
  });

  it("searches customers by name, phone, and contact name", async () => {
    const admin = await signup(db);
    const fixtures = [
      { name: "동해플랜트", contactName: "박기술", contactPhone: "010-1234-5678" },
      { name: "서부산기계", contactName: "이정비", contactPhone: "010-9999-0000" },
    ];
    for (const fixture of fixtures) {
      const created = await request(db, "/customers", {
        method: "POST",
        token: admin.token,
        body: JSON.stringify(fixture),
      });
      expect(created.status).toBe(200);
    }

    for (const [query, expected] of [
      ["동해", "동해플랜트"],
      ["9999", "서부산기계"],
      ["박기술", "동해플랜트"],
    ] as const) {
      const response = await request(db, `/customers?q=${encodeURIComponent(query)}`, {
        token: admin.token,
      });
      const body = (await response.json()) as {
        customers: { name: string }[];
      };
      expect(body.customers.map((customer) => customer.name)).toEqual([expected]);
    }
  });

  it("deactivates and reactivates customer, site, and asset while preserving rows", async () => {
    const admin = await signup(db);
    const customerResponse = await request(db, "/customers", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ name: "보존 고객" }),
    });
    const customer = (
      (await customerResponse.json()) as { customer: { id: string } }
    ).customer;
    const siteResponse = await request(db, "/sites", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ customerId: customer.id, name: "보존 현장" }),
    });
    const site = ((await siteResponse.json()) as { site: { id: string } }).site;
    const assetResponse = await request(db, "/assets", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ siteId: site.id, name: "보존 장비" }),
    });
    const asset = ((await assetResponse.json()) as { asset: { id: string } }).asset;

    for (const [path, entityKey] of [
      [`/customers/${customer.id}`, "customer"],
      [`/sites/${site.id}`, "site"],
      [`/assets/${asset.id}`, "asset"],
    ] as const) {
      const response = await request(db, path, {
        method: "PATCH",
        token: admin.token,
        body: JSON.stringify({ active: false }),
      });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        [entityKey]: { active: false },
      });
    }

    for (const [path, key] of [
      ["/customers", "customers"],
      ["/sites", "sites"],
      ["/assets", "assets"],
    ] as const) {
      const activeOnly = (await (
        await request(db, path, { token: admin.token })
      ).json()) as Record<string, { id: string }[]>;
      expect(activeOnly[key]).toEqual([]);

      const inactiveOnly = (await (
        await request(db, `${path}?active=false`, { token: admin.token })
      ).json()) as Record<string, { id: string; active: boolean }[]>;
      expect(inactiveOnly[key]).toHaveLength(1);
      expect(inactiveOnly[key]![0]).toMatchObject({ active: false });

      const all = (await (
        await request(db, `${path}?active=all`, { token: admin.token })
      ).json()) as Record<string, { id: string; active: boolean }[]>;
      expect(all[key]).toHaveLength(1);
      expect(all[key]![0]).toMatchObject({ active: false });
    }

    for (const path of [
      `/customers/${customer.id}`,
      `/sites/${site.id}`,
      `/assets/${asset.id}`,
    ]) {
      const response = await request(db, path, {
        method: "PATCH",
        token: admin.token,
        body: JSON.stringify({ active: true }),
      });
      expect(response.status).toBe(200);
    }

    const events = await db
      .prepare(
        "SELECT event FROM audit_events WHERE org_id = ? AND event LIKE '%activated' OR org_id = ? AND event LIKE '%deactivated' ORDER BY event",
      )
      .bind(admin.org.id, admin.org.id)
      .all<{ event: string }>();
    expect((events.results ?? []).map((row) => row.event)).toEqual([
      "asset_activated",
      "asset_deactivated",
      "customer_activated",
      "customer_deactivated",
      "site_activated",
      "site_deactivated",
    ]);
  });

  it("rejects inactive customer, site, and asset IDs when creating or patching work orders", async () => {
    const admin = await signup(db);
    const customerResponse = await request(db, "/customers", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ name: "비활성 검증 고객" }),
    });
    const customer = (
      (await customerResponse.json()) as { customer: { id: string } }
    ).customer;
    const siteResponse = await request(db, "/sites", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ customerId: customer.id, name: "비활성 검증 현장" }),
    });
    const site = ((await siteResponse.json()) as { site: { id: string } }).site;
    const assetResponse = await request(db, "/assets", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify({ siteId: site.id, name: "비활성 검증 장비" }),
    });
    const asset = ((await assetResponse.json()) as { asset: { id: string } }).asset;
    const workOrderPayload = {
      scheduledDate: "2026-08-01",
      workType: "비활성 기준정보 검증",
      customerId: customer.id,
      siteId: site.id,
      assetId: asset.id,
      assigneeIds: [],
      intent: "draft",
    };
    const workOrderResponse = await request(db, "/work-orders", {
      method: "POST",
      token: admin.token,
      body: JSON.stringify(workOrderPayload),
    });
    expect(workOrderResponse.status).toBe(200);
    const workOrder = (
      (await workOrderResponse.json()) as { workOrder: { id: string } }
    ).workOrder;

    for (const scenario of [
      {
        path: `/customers/${customer.id}`,
        patch: { customerId: customer.id },
      },
      {
        path: `/sites/${site.id}`,
        patch: { siteId: site.id },
      },
      {
        path: `/assets/${asset.id}`,
        patch: { assetId: asset.id },
      },
    ]) {
      const deactivateResponse = await request(db, scenario.path, {
        method: "PATCH",
        token: admin.token,
        body: JSON.stringify({ active: false }),
      });
      expect(deactivateResponse.status).toBe(200);

      const createResponse = await request(db, "/work-orders", {
        method: "POST",
        token: admin.token,
        body: JSON.stringify(workOrderPayload),
      });
      expect(createResponse.status).toBe(400);

      const patchResponse = await request(
        db,
        `/work-orders/${workOrder.id}`,
        {
          method: "PATCH",
          token: admin.token,
          body: JSON.stringify(scenario.patch),
        },
      );
      expect(patchResponse.status).toBe(400);

      const reactivateResponse = await request(db, scenario.path, {
        method: "PATCH",
        token: admin.token,
        body: JSON.stringify({ active: true }),
      });
      expect(reactivateResponse.status).toBe(200);
    }
  });

  it("rejects an invalid active filter", async () => {
    const admin = await signup(db);
    const response = await request(db, "/customers?active=maybe", {
      token: admin.token,
    });
    expect(response.status).toBe(400);
  });
});
