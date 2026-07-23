import { Hono } from "hono";
import { customerUpsertSchema, siteUpsertSchema, assetUpsertSchema } from "@fieldstep/shared";
import type { AppEnv } from "../db.js";
import { newId, nowIso } from "../db.js";
import { requireAuth, requireOfficeOrAdmin } from "../middleware.js";

export const crmRoutes = new Hono<AppEnv>();

type CustomerRow = {
  id: string;
  name: string;
  biz_no: string | null;
  address: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  memo: string | null;
};

function mapCustomer(r: CustomerRow) {
  return {
    id: r.id,
    name: r.name,
    bizNo: r.biz_no,
    address: r.address,
    contactName: r.contact_name,
    contactPhone: r.contact_phone,
    memo: r.memo,
  };
}

crmRoutes.get("/customers", requireAuth, async (c) => {
  const q = c.req.query("q");
  const orgId = c.get("orgId");
  const rows = q
    ? await c.env.DB.prepare(
        "SELECT id, name, biz_no, address, contact_name, contact_phone, memo FROM customers WHERE org_id = ? AND name LIKE ? ORDER BY name ASC",
      )
        .bind(orgId, `%${q}%`)
        .all<CustomerRow>()
    : await c.env.DB.prepare(
        "SELECT id, name, biz_no, address, contact_name, contact_phone, memo FROM customers WHERE org_id = ? ORDER BY name ASC",
      )
        .bind(orgId)
        .all<CustomerRow>();
  return c.json({ customers: (rows.results ?? []).map(mapCustomer) });
});

crmRoutes.post("/customers", requireAuth, requireOfficeOrAdmin, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = customerUpsertSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const d = parsed.data;
  const id = newId();
  const ts = nowIso();
  await c.env.DB.prepare(
    `INSERT INTO customers (id, org_id, name, biz_no, address, contact_name, contact_phone, memo, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      c.get("orgId"),
      d.name,
      d.bizNo ?? null,
      d.address ?? null,
      d.contactName ?? null,
      d.contactPhone ?? null,
      d.memo ?? null,
      ts,
      ts,
    )
    .run();
  return c.json({
    customer: { id, name: d.name, bizNo: d.bizNo ?? null, address: d.address ?? null, contactName: d.contactName ?? null, contactPhone: d.contactPhone ?? null, memo: d.memo ?? null },
  });
});

crmRoutes.get("/customers/:id", requireAuth, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const customer = await c.env.DB.prepare(
    "SELECT id, name, biz_no, address, contact_name, contact_phone, memo FROM customers WHERE org_id = ? AND id = ?",
  )
    .bind(orgId, id)
    .first<CustomerRow>();
  if (!customer) return c.json({ error: "고객을 찾을 수 없습니다" }, 404);

  const siteRows = await c.env.DB.prepare(
    "SELECT id, customer_id, name, address, access_info, map_url FROM sites WHERE org_id = ? AND customer_id = ? ORDER BY name ASC",
  )
    .bind(orgId, id)
    .all<{ id: string; customer_id: string; name: string; address: string | null; access_info: string | null; map_url: string | null }>();

  return c.json({
    customer: mapCustomer(customer),
    sites: (siteRows.results ?? []).map((s) => ({
      id: s.id,
      customerId: s.customer_id,
      name: s.name,
      address: s.address,
      accessInfo: s.access_info,
      mapUrl: s.map_url,
    })),
  });
});

crmRoutes.patch("/customers/:id", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const existing = await c.env.DB.prepare("SELECT id FROM customers WHERE org_id = ? AND id = ?")
    .bind(orgId, id)
    .first();
  if (!existing) return c.json({ error: "고객을 찾을 수 없습니다" }, 404);

  const body = await c.req.json().catch(() => null);
  const parsed = customerUpsertSchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const d = parsed.data;

  const current = await c.env.DB.prepare(
    "SELECT id, name, biz_no, address, contact_name, contact_phone, memo FROM customers WHERE id = ?",
  )
    .bind(id)
    .first<CustomerRow>();
  const merged = {
    name: d.name ?? current!.name,
    bizNo: d.bizNo ?? current!.biz_no,
    address: d.address ?? current!.address,
    contactName: d.contactName ?? current!.contact_name,
    contactPhone: d.contactPhone ?? current!.contact_phone,
    memo: d.memo ?? current!.memo,
  };
  await c.env.DB.prepare(
    "UPDATE customers SET name = ?, biz_no = ?, address = ?, contact_name = ?, contact_phone = ?, memo = ?, updated_at = ? WHERE id = ?",
  )
    .bind(merged.name, merged.bizNo, merged.address, merged.contactName, merged.contactPhone, merged.memo, nowIso(), id)
    .run();

  return c.json({ customer: { id, ...merged } });
});

// ---------------------------------------------------------------------------
// Sites
// ---------------------------------------------------------------------------

type SiteRow = { id: string; customer_id: string; name: string; address: string | null; access_info: string | null; map_url: string | null };
function mapSite(r: SiteRow) {
  return { id: r.id, customerId: r.customer_id, name: r.name, address: r.address, accessInfo: r.access_info, mapUrl: r.map_url };
}

crmRoutes.get("/sites", requireAuth, async (c) => {
  const orgId = c.get("orgId");
  const customerId = c.req.query("customerId");
  const rows = customerId
    ? await c.env.DB.prepare(
        "SELECT id, customer_id, name, address, access_info, map_url FROM sites WHERE org_id = ? AND customer_id = ? ORDER BY name ASC",
      )
        .bind(orgId, customerId)
        .all<SiteRow>()
    : await c.env.DB.prepare(
        "SELECT id, customer_id, name, address, access_info, map_url FROM sites WHERE org_id = ? ORDER BY name ASC",
      )
        .bind(orgId)
        .all<SiteRow>();
  return c.json({ sites: (rows.results ?? []).map(mapSite) });
});

crmRoutes.post("/sites", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const body = await c.req.json().catch(() => null);
  const parsed = siteUpsertSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const d = parsed.data;

  const customer = await c.env.DB.prepare("SELECT id FROM customers WHERE org_id = ? AND id = ?")
    .bind(orgId, d.customerId)
    .first();
  if (!customer) return c.json({ error: "고객을 찾을 수 없습니다" }, 400);

  const id = newId();
  const ts = nowIso();
  await c.env.DB.prepare(
    "INSERT INTO sites (id, org_id, customer_id, name, address, access_info, map_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(id, orgId, d.customerId, d.name, d.address ?? null, d.accessInfo ?? null, d.mapUrl ?? null, ts, ts)
    .run();
  return c.json({ site: { id, customerId: d.customerId, name: d.name, address: d.address ?? null, accessInfo: d.accessInfo ?? null, mapUrl: d.mapUrl ?? null } });
});

crmRoutes.patch("/sites/:id", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const current = await c.env.DB.prepare(
    "SELECT id, customer_id, name, address, access_info, map_url FROM sites WHERE org_id = ? AND id = ?",
  )
    .bind(orgId, id)
    .first<SiteRow>();
  if (!current) return c.json({ error: "현장을 찾을 수 없습니다" }, 404);

  const body = await c.req.json().catch(() => null);
  const parsed = siteUpsertSchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const d = parsed.data;
  if (d.customerId) {
    const customer = await c.env.DB.prepare("SELECT id FROM customers WHERE org_id = ? AND id = ?")
      .bind(orgId, d.customerId)
      .first();
    if (!customer) return c.json({ error: "고객을 찾을 수 없습니다" }, 400);
  }
  const merged = {
    customerId: d.customerId ?? current.customer_id,
    name: d.name ?? current.name,
    address: d.address ?? current.address,
    accessInfo: d.accessInfo ?? current.access_info,
    mapUrl: d.mapUrl ?? current.map_url,
  };
  await c.env.DB.prepare(
    "UPDATE sites SET customer_id = ?, name = ?, address = ?, access_info = ?, map_url = ?, updated_at = ? WHERE id = ?",
  )
    .bind(merged.customerId, merged.name, merged.address, merged.accessInfo, merged.mapUrl, nowIso(), id)
    .run();
  return c.json({ site: { id, ...merged } });
});

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

type AssetRow = { id: string; site_id: string; name: string; model: string | null; serial_no: string | null; installed_at: string | null };
function mapAsset(r: AssetRow) {
  return { id: r.id, siteId: r.site_id, name: r.name, model: r.model, serialNo: r.serial_no, installedAt: r.installed_at };
}

crmRoutes.get("/assets", requireAuth, async (c) => {
  const orgId = c.get("orgId");
  const siteId = c.req.query("siteId");
  const rows = siteId
    ? await c.env.DB.prepare(
        "SELECT id, site_id, name, model, serial_no, installed_at FROM assets WHERE org_id = ? AND site_id = ? ORDER BY name ASC",
      )
        .bind(orgId, siteId)
        .all<AssetRow>()
    : await c.env.DB.prepare(
        "SELECT id, site_id, name, model, serial_no, installed_at FROM assets WHERE org_id = ? ORDER BY name ASC",
      )
        .bind(orgId)
        .all<AssetRow>();
  return c.json({ assets: (rows.results ?? []).map(mapAsset) });
});

crmRoutes.post("/assets", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const body = await c.req.json().catch(() => null);
  const parsed = assetUpsertSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const d = parsed.data;

  const site = await c.env.DB.prepare("SELECT id FROM sites WHERE org_id = ? AND id = ?")
    .bind(orgId, d.siteId)
    .first();
  if (!site) return c.json({ error: "현장을 찾을 수 없습니다" }, 400);

  const id = newId();
  const ts = nowIso();
  await c.env.DB.prepare(
    "INSERT INTO assets (id, org_id, site_id, name, model, serial_no, installed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(id, orgId, d.siteId, d.name, d.model ?? null, d.serialNo ?? null, d.installedAt ?? null, ts, ts)
    .run();
  return c.json({ asset: { id, siteId: d.siteId, name: d.name, model: d.model ?? null, serialNo: d.serialNo ?? null, installedAt: d.installedAt ?? null } });
});

crmRoutes.patch("/assets/:id", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const current = await c.env.DB.prepare(
    "SELECT id, site_id, name, model, serial_no, installed_at FROM assets WHERE org_id = ? AND id = ?",
  )
    .bind(orgId, id)
    .first<AssetRow>();
  if (!current) return c.json({ error: "자산을 찾을 수 없습니다" }, 404);

  const body = await c.req.json().catch(() => null);
  const parsed = assetUpsertSchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const d = parsed.data;
  if (d.siteId) {
    const site = await c.env.DB.prepare("SELECT id FROM sites WHERE org_id = ? AND id = ?")
      .bind(orgId, d.siteId)
      .first();
    if (!site) return c.json({ error: "현장을 찾을 수 없습니다" }, 400);
  }
  const merged = {
    siteId: d.siteId ?? current.site_id,
    name: d.name ?? current.name,
    model: d.model ?? current.model,
    serialNo: d.serialNo ?? current.serial_no,
    installedAt: d.installedAt ?? current.installed_at,
  };
  await c.env.DB.prepare(
    "UPDATE assets SET site_id = ?, name = ?, model = ?, serial_no = ?, installed_at = ?, updated_at = ? WHERE id = ?",
  )
    .bind(merged.siteId, merged.name, merged.model, merged.serialNo, merged.installedAt, nowIso(), id)
    .run();
  return c.json({ asset: { id, ...merged } });
});

crmRoutes.get("/assets/:id/history", requireAuth, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const asset = await c.env.DB.prepare("SELECT id FROM assets WHERE org_id = ? AND id = ?").bind(orgId, id).first();
  if (!asset) return c.json({ error: "자산을 찾을 수 없습니다" }, 404);

  const rows = await c.env.DB.prepare(
    `SELECT wo.id, wo.work_status, wo.approval_status, wo.billing_status, wo.scheduled_date, wo.scheduled_time,
            wo.work_type, c.name AS customer_name, s.name AS site_name
     FROM work_orders wo
     JOIN customers c ON c.id = wo.customer_id
     JOIN sites s ON s.id = wo.site_id
     WHERE wo.org_id = ? AND wo.asset_id = ?
     ORDER BY wo.scheduled_date DESC`,
  )
    .bind(orgId, id)
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
    }>();

  const workOrders = await Promise.all(
    (rows.results ?? []).map(async (r) => {
      const assignees = await c.env.DB.prepare(
        "SELECT u.name FROM assignments a JOIN users u ON u.id = a.user_id WHERE a.work_order_id = ?",
      )
        .bind(r.id)
        .all<{ name: string }>();
      return {
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
      };
    }),
  );

  return c.json({ workOrders });
});
