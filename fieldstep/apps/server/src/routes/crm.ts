import { Hono } from "hono";
import { customerUpsertSchema, siteUpsertSchema, assetUpsertSchema } from "@fieldstep/shared";
import type { AppEnv } from "../db.js";
import { newId, nowIso, recordAudit } from "../db.js";
import { requireAuth, requireOfficeOrAdmin } from "../middleware.js";
import {
  MAX_PHOTO_BYTES,
  MediaValidationError,
  computeMediaRequestFingerprint,
  computeMediaRequestFingerprintFromChecksum,
  createImmutableAssetPhotoKey,
  decodeMediaBytes,
  deletePrivateMedia,
  getPrivateMediaResponse,
  putPrivateMedia,
  readBoundedMediaRequest,
  requestMediaMimeType,
} from "../media.js";
import {
  CrmCsvImportError,
  assertCsvContentType,
  computeCsvFingerprint,
  decodeUtf8Csv,
  executeCrmImport,
  parseCrmImportCsv,
  readBoundedCsvRequest,
  validateImportIdempotencyKey,
} from "../crm-csv-import.js";

export const crmRoutes = new Hono<AppEnv>();

type EntityType = "customer" | "site" | "asset";
type ActiveFilter = boolean | null;
const MAX_PHOTOS_PER_ASSET = 8;
const UPLOAD_IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{8,128}$/u;

function assetPhotoUrl(requestUrl: string, assetId: string, photoId: string): string {
  const origin = new URL(requestUrl).origin;
  return `${origin}/assets/${encodeURIComponent(assetId)}/photos/${encodeURIComponent(photoId)}/content`;
}

function mediaErrorResponse(error: unknown): { error: string } {
  return {
    error:
      error instanceof MediaValidationError
        ? error.message
        : "장비 사진을 처리하지 못했습니다",
  };
}

function parseActiveFilter(value: string | undefined): ActiveFilter | "invalid" {
  if (value === undefined || value === "" || value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  if (value === "all") return null;
  return "invalid";
}

function escapeLike(value: string): string {
  return value.replace(/[!%_]/g, "!$&");
}

async function setEntityActive(
  db: D1Database,
  args: {
    orgId: string;
    entityType: EntityType;
    entityId: string;
    active: boolean;
    userId: string;
    timestamp: string;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO master_entity_states
         (org_id, entity_type, entity_id, active, updated_at, updated_by)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(org_id, entity_type, entity_id) DO UPDATE SET
         active = excluded.active,
         updated_at = excluded.updated_at,
         updated_by = excluded.updated_by`,
    )
    .bind(
      args.orgId,
      args.entityType,
      args.entityId,
      args.active ? 1 : 0,
      args.timestamp,
      args.userId,
    )
    .run();
}

function auditEvent(entityType: EntityType, active: boolean | undefined): string {
  if (active === undefined) return `${entityType}_updated`;
  return `${entityType}_${active ? "activated" : "deactivated"}`;
}

type CustomerRow = {
  id: string;
  name: string;
  biz_no: string | null;
  address: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  memo: string | null;
  active: number;
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
    active: !!r.active,
  };
}

crmRoutes.post(
  "/crm/imports/csv",
  requireAuth,
  requireOfficeOrAdmin,
  async (c) => {
    try {
      assertCsvContentType(c.req.header("content-type") ?? null);
      const idempotencyKey = validateImportIdempotencyKey(
        c.req.header("idempotency-key"),
      );
      const bytes = await readBoundedCsvRequest(c.req.raw);
      const [fingerprint, parsed] = await Promise.all([
        computeCsvFingerprint(bytes),
        Promise.resolve(parseCrmImportCsv(decodeUtf8Csv(bytes))),
      ]);
      const result = await executeCrmImport(c.env.DB, {
        orgId: c.get("orgId"),
        userId: c.get("userId"),
        idempotencyKey,
        fingerprint,
        parsed,
      });
      return c.json({ import: result });
    } catch (error) {
      if (error instanceof CrmCsvImportError) {
        return c.json(
          { error: error.message, code: error.code },
          error.status,
        );
      }
      throw error;
    }
  },
);

crmRoutes.get("/customers", requireAuth, requireOfficeOrAdmin, async (c) => {
  const active = parseActiveFilter(c.req.query("active"));
  if (active === "invalid") return c.json({ error: "active 필터가 올바르지 않습니다" }, 400);

  const orgId = c.get("orgId");
  const q = c.req.query("q")?.trim();
  const where = ["c.org_id = ?"];
  const values: unknown[] = [orgId];

  if (active !== null) {
    where.push("COALESCE(ms.active, 1) = ?");
    values.push(active ? 1 : 0);
  }
  if (q) {
    const pattern = `%${escapeLike(q)}%`;
    where.push(
      `(c.name LIKE ? ESCAPE '!'
        OR COALESCE(c.contact_phone, '') LIKE ? ESCAPE '!'
        OR COALESCE(c.contact_name, '') LIKE ? ESCAPE '!')`,
    );
    values.push(pattern, pattern, pattern);
  }

  const rows = await c.env.DB.prepare(
    `SELECT c.id, c.name, c.biz_no, c.address, c.contact_name, c.contact_phone, c.memo,
            COALESCE(ms.active, 1) AS active
     FROM customers c
     LEFT JOIN master_entity_states ms
       ON ms.org_id = c.org_id AND ms.entity_type = 'customer' AND ms.entity_id = c.id
     WHERE ${where.join(" AND ")}
     ORDER BY c.name ASC`,
  )
    .bind(...values)
    .all<CustomerRow>();

  return c.json({ customers: (rows.results ?? []).map(mapCustomer) });
});

crmRoutes.post("/customers", requireAuth, requireOfficeOrAdmin, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = customerUpsertSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);

  const d = parsed.data;
  const orgId = c.get("orgId");
  const id = newId();
  const ts = nowIso();
  const active = d.active ?? true;

  await c.env.DB.batch([
    c.env.DB
      .prepare(
        `INSERT INTO customers
           (id, org_id, name, biz_no, address, contact_name, contact_phone, memo, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        orgId,
        d.name,
        d.bizNo ?? null,
        d.address ?? null,
        d.contactName ?? null,
        d.contactPhone ?? null,
        d.memo ?? null,
        ts,
        ts,
      ),
    c.env.DB
      .prepare(
        `INSERT INTO master_entity_states
           (org_id, entity_type, entity_id, active, updated_at, updated_by)
         VALUES (?, 'customer', ?, ?, ?, ?)`,
      )
      .bind(orgId, id, active ? 1 : 0, ts, c.get("userId")),
  ]);

  await recordAudit(c.env.DB, {
    orgId,
    actorUserId: c.get("userId"),
    event: "customer_created",
    target: id,
    detail: { active },
  });

  return c.json({
    customer: {
      id,
      name: d.name,
      bizNo: d.bizNo ?? null,
      address: d.address ?? null,
      contactName: d.contactName ?? null,
      contactPhone: d.contactPhone ?? null,
      memo: d.memo ?? null,
      active,
    },
  });
});

crmRoutes.get("/customers/:id", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const customer = await c.env.DB.prepare(
    `SELECT c.id, c.name, c.biz_no, c.address, c.contact_name, c.contact_phone, c.memo,
            COALESCE(ms.active, 1) AS active
     FROM customers c
     LEFT JOIN master_entity_states ms
       ON ms.org_id = c.org_id AND ms.entity_type = 'customer' AND ms.entity_id = c.id
     WHERE c.org_id = ? AND c.id = ?`,
  )
    .bind(orgId, id)
    .first<CustomerRow>();
  if (!customer) return c.json({ error: "고객을 찾을 수 없습니다" }, 404);

  const siteRows = await c.env.DB.prepare(
    `SELECT s.id, s.customer_id, s.name, s.address, s.access_info, s.map_url,
            COALESCE(ms.active, 1) AS active
     FROM sites s
     LEFT JOIN master_entity_states ms
       ON ms.org_id = s.org_id AND ms.entity_type = 'site' AND ms.entity_id = s.id
     WHERE s.org_id = ? AND s.customer_id = ?
     ORDER BY s.name ASC`,
  )
    .bind(orgId, id)
    .all<SiteRow>();

  return c.json({
    customer: mapCustomer(customer),
    sites: (siteRows.results ?? []).map(mapSite),
  });
});

crmRoutes.patch("/customers/:id", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const current = await c.env.DB.prepare(
    `SELECT c.id, c.name, c.biz_no, c.address, c.contact_name, c.contact_phone, c.memo,
            COALESCE(ms.active, 1) AS active
     FROM customers c
     LEFT JOIN master_entity_states ms
       ON ms.org_id = c.org_id AND ms.entity_type = 'customer' AND ms.entity_id = c.id
     WHERE c.org_id = ? AND c.id = ?`,
  )
    .bind(orgId, id)
    .first<CustomerRow>();
  if (!current) return c.json({ error: "고객을 찾을 수 없습니다" }, 404);

  const body = await c.req.json().catch(() => null);
  const parsed = customerUpsertSchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const d = parsed.data;
  const ts = nowIso();
  const merged = {
    name: d.name !== undefined ? d.name : current.name,
    bizNo: d.bizNo !== undefined ? d.bizNo : current.biz_no,
    address: d.address !== undefined ? d.address : current.address,
    contactName: d.contactName !== undefined ? d.contactName : current.contact_name,
    contactPhone: d.contactPhone !== undefined ? d.contactPhone : current.contact_phone,
    memo: d.memo !== undefined ? d.memo : current.memo,
    active: d.active !== undefined ? d.active : !!current.active,
  };

  await c.env.DB.prepare(
    `UPDATE customers
     SET name = ?, biz_no = ?, address = ?, contact_name = ?, contact_phone = ?, memo = ?, updated_at = ?
     WHERE org_id = ? AND id = ?`,
  )
    .bind(
      merged.name,
      merged.bizNo,
      merged.address,
      merged.contactName,
      merged.contactPhone,
      merged.memo,
      ts,
      orgId,
      id,
    )
    .run();
  if (d.active !== undefined) {
    await setEntityActive(c.env.DB, {
      orgId,
      entityType: "customer",
      entityId: id,
      active: d.active,
      userId: c.get("userId"),
      timestamp: ts,
    });
  }

  await recordAudit(c.env.DB, {
    orgId,
    actorUserId: c.get("userId"),
    event: auditEvent("customer", d.active),
    target: id,
    detail: { changedFields: Object.keys(d), active: merged.active },
  });

  return c.json({ customer: { id, ...merged } });
});

// ---------------------------------------------------------------------------
// Sites
// ---------------------------------------------------------------------------

type SiteRow = {
  id: string;
  customer_id: string;
  name: string;
  address: string | null;
  access_info: string | null;
  map_url: string | null;
  active: number;
};

function mapSite(r: SiteRow) {
  return {
    id: r.id,
    customerId: r.customer_id,
    name: r.name,
    address: r.address,
    accessInfo: r.access_info,
    mapUrl: r.map_url,
    active: !!r.active,
  };
}

crmRoutes.get("/sites", requireAuth, requireOfficeOrAdmin, async (c) => {
  const active = parseActiveFilter(c.req.query("active"));
  if (active === "invalid") return c.json({ error: "active 필터가 올바르지 않습니다" }, 400);

  const orgId = c.get("orgId");
  const customerId = c.req.query("customerId");
  const where = ["s.org_id = ?"];
  const values: unknown[] = [orgId];
  if (customerId) {
    where.push("s.customer_id = ?");
    values.push(customerId);
  }
  if (active !== null) {
    where.push("COALESCE(ms.active, 1) = ?");
    values.push(active ? 1 : 0);
  }

  const rows = await c.env.DB.prepare(
    `SELECT s.id, s.customer_id, s.name, s.address, s.access_info, s.map_url,
            COALESCE(ms.active, 1) AS active
     FROM sites s
     LEFT JOIN master_entity_states ms
       ON ms.org_id = s.org_id AND ms.entity_type = 'site' AND ms.entity_id = s.id
     WHERE ${where.join(" AND ")}
     ORDER BY s.name ASC`,
  )
    .bind(...values)
    .all<SiteRow>();

  return c.json({ sites: (rows.results ?? []).map(mapSite) });
});

crmRoutes.post("/sites", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const body = await c.req.json().catch(() => null);
  const parsed = siteUpsertSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const d = parsed.data;

  const customer = await c.env.DB.prepare(
    `SELECT c.id, COALESCE(ms.active, 1) AS active
     FROM customers c
     LEFT JOIN master_entity_states ms
       ON ms.org_id = c.org_id AND ms.entity_type = 'customer' AND ms.entity_id = c.id
     WHERE c.org_id = ? AND c.id = ?`,
  )
    .bind(orgId, d.customerId)
    .first<{ id: string; active: number }>();
  if (!customer) return c.json({ error: "고객을 찾을 수 없습니다" }, 400);
  if (!customer.active) return c.json({ error: "비활성 고객에는 현장을 등록할 수 없습니다" }, 409);

  const id = newId();
  const ts = nowIso();
  const active = d.active ?? true;
  await c.env.DB.batch([
    c.env.DB
      .prepare(
        `INSERT INTO sites
           (id, org_id, customer_id, name, address, access_info, map_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        orgId,
        d.customerId,
        d.name,
        d.address ?? null,
        d.accessInfo ?? null,
        d.mapUrl ?? null,
        ts,
        ts,
      ),
    c.env.DB
      .prepare(
        `INSERT INTO master_entity_states
           (org_id, entity_type, entity_id, active, updated_at, updated_by)
         VALUES (?, 'site', ?, ?, ?, ?)`,
      )
      .bind(orgId, id, active ? 1 : 0, ts, c.get("userId")),
  ]);

  await recordAudit(c.env.DB, {
    orgId,
    actorUserId: c.get("userId"),
    event: "site_created",
    target: id,
    detail: { customerId: d.customerId, active },
  });

  return c.json({
    site: {
      id,
      customerId: d.customerId,
      name: d.name,
      address: d.address ?? null,
      accessInfo: d.accessInfo ?? null,
      mapUrl: d.mapUrl ?? null,
      active,
    },
  });
});

crmRoutes.patch("/sites/:id", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const current = await c.env.DB.prepare(
    `SELECT s.id, s.customer_id, s.name, s.address, s.access_info, s.map_url,
            COALESCE(ms.active, 1) AS active
     FROM sites s
     LEFT JOIN master_entity_states ms
       ON ms.org_id = s.org_id AND ms.entity_type = 'site' AND ms.entity_id = s.id
     WHERE s.org_id = ? AND s.id = ?`,
  )
    .bind(orgId, id)
    .first<SiteRow>();
  if (!current) return c.json({ error: "현장을 찾을 수 없습니다" }, 404);

  const body = await c.req.json().catch(() => null);
  const parsed = siteUpsertSchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const d = parsed.data;
  const targetCustomerId = d.customerId !== undefined ? d.customerId : current.customer_id;
  if (d.customerId !== undefined) {
    const customer = await c.env.DB.prepare(
      `SELECT c.id, COALESCE(ms.active, 1) AS active
       FROM customers c
       LEFT JOIN master_entity_states ms
         ON ms.org_id = c.org_id AND ms.entity_type = 'customer' AND ms.entity_id = c.id
       WHERE c.org_id = ? AND c.id = ?`,
    )
      .bind(orgId, targetCustomerId)
      .first<{ id: string; active: number }>();
    if (!customer) return c.json({ error: "고객을 찾을 수 없습니다" }, 400);
    if (!customer.active) return c.json({ error: "비활성 고객으로 현장을 이동할 수 없습니다" }, 409);
  }

  const ts = nowIso();
  const merged = {
    customerId: targetCustomerId,
    name: d.name !== undefined ? d.name : current.name,
    address: d.address !== undefined ? d.address : current.address,
    accessInfo: d.accessInfo !== undefined ? d.accessInfo : current.access_info,
    mapUrl: d.mapUrl !== undefined ? d.mapUrl : current.map_url,
    active: d.active !== undefined ? d.active : !!current.active,
  };
  await c.env.DB.prepare(
    `UPDATE sites
     SET customer_id = ?, name = ?, address = ?, access_info = ?, map_url = ?, updated_at = ?
     WHERE org_id = ? AND id = ?`,
  )
    .bind(
      merged.customerId,
      merged.name,
      merged.address,
      merged.accessInfo,
      merged.mapUrl,
      ts,
      orgId,
      id,
    )
    .run();
  if (d.active !== undefined) {
    await setEntityActive(c.env.DB, {
      orgId,
      entityType: "site",
      entityId: id,
      active: d.active,
      userId: c.get("userId"),
      timestamp: ts,
    });
  }

  await recordAudit(c.env.DB, {
    orgId,
    actorUserId: c.get("userId"),
    event: auditEvent("site", d.active),
    target: id,
    detail: { changedFields: Object.keys(d), active: merged.active },
  });

  return c.json({ site: { id, ...merged } });
});

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

type AssetRow = {
  id: string;
  site_id: string;
  name: string;
  model: string | null;
  serial_no: string | null;
  installed_at: string | null;
  active: number;
};

type AssetOwnerRow = {
  id: string;
  site_id: string;
  active: number;
};

type AssetPhotoRow = {
  id: string;
  site_id: string;
  asset_id: string;
  storage_key: string;
  mime_type: "image/jpeg" | "image/png" | "image/webp";
  size_bytes: number;
  etag: string | null;
  checksum_sha256: string;
  caption: string | null;
  request_fingerprint?: string | null;
  created_at: string;
};

function mapAsset(r: AssetRow) {
  return {
    id: r.id,
    siteId: r.site_id,
    name: r.name,
    model: r.model,
    serialNo: r.serial_no,
    installedAt: r.installed_at,
    active: !!r.active,
  };
}

function mapAssetPhoto(r: AssetPhotoRow, requestUrl: string) {
  return {
    id: r.id,
    assetId: r.asset_id,
    siteId: r.site_id,
    url: assetPhotoUrl(requestUrl, r.asset_id, r.id),
    mimeType: r.mime_type,
    sizeBytes: r.size_bytes,
    caption: r.caption,
    createdAt: r.created_at,
  };
}

async function loadIdempotentAssetPhoto(
  db: D1Database,
  args: {
    orgId: string;
    siteId: string;
    assetId: string;
    idempotencyKey: string;
    expectedFingerprint: string;
    requestUrl: string;
  },
): Promise<
  | { kind: "miss" }
  | { kind: "conflict" }
  | { kind: "replay"; photo: ReturnType<typeof mapAssetPhoto> }
> {
  const row = await db
    .prepare(
      `SELECT id, site_id, asset_id, storage_key, mime_type, size_bytes, etag,
              checksum_sha256, caption, request_fingerprint, created_at
       FROM asset_photos
       WHERE org_id = ? AND site_id = ? AND asset_id = ?
         AND idempotency_key = ? AND deleted_at IS NULL`,
    )
    .bind(args.orgId, args.siteId, args.assetId, args.idempotencyKey)
    .first<AssetPhotoRow>();
  if (!row) return { kind: "miss" };

  const storedFingerprint =
    row.request_fingerprint ??
    (await computeMediaRequestFingerprintFromChecksum({
      mediaType: "photo",
      mimeType: row.mime_type,
      checksumSha256: row.checksum_sha256,
      metadata: { caption: row.caption },
    }));
  if (storedFingerprint !== args.expectedFingerprint) {
    return { kind: "conflict" };
  }
  return {
    kind: "replay",
    photo: mapAssetPhoto(row, args.requestUrl),
  };
}

async function loadAssetOwner(
  db: D1Database,
  orgId: string,
  assetId: string,
): Promise<AssetOwnerRow | null> {
  return db
    .prepare(
      `SELECT a.id, a.site_id, COALESCE(ms.active, 1) AS active
       FROM assets a
       LEFT JOIN master_entity_states ms
         ON ms.org_id = a.org_id AND ms.entity_type = 'asset' AND ms.entity_id = a.id
       WHERE a.org_id = ? AND a.id = ?`,
    )
    .bind(orgId, assetId)
    .first<AssetOwnerRow>();
}

crmRoutes.get("/assets", requireAuth, requireOfficeOrAdmin, async (c) => {
  const active = parseActiveFilter(c.req.query("active"));
  if (active === "invalid") return c.json({ error: "active 필터가 올바르지 않습니다" }, 400);

  const orgId = c.get("orgId");
  const siteId = c.req.query("siteId");
  const where = ["a.org_id = ?"];
  const values: unknown[] = [orgId];
  if (siteId) {
    where.push("a.site_id = ?");
    values.push(siteId);
  }
  if (active !== null) {
    where.push("COALESCE(ms.active, 1) = ?");
    values.push(active ? 1 : 0);
  }

  const rows = await c.env.DB.prepare(
    `SELECT a.id, a.site_id, a.name, a.model, a.serial_no, a.installed_at,
            COALESCE(ms.active, 1) AS active
     FROM assets a
     LEFT JOIN master_entity_states ms
       ON ms.org_id = a.org_id AND ms.entity_type = 'asset' AND ms.entity_id = a.id
     WHERE ${where.join(" AND ")}
     ORDER BY a.name ASC`,
  )
    .bind(...values)
    .all<AssetRow>();

  return c.json({ assets: (rows.results ?? []).map(mapAsset) });
});

crmRoutes.get("/assets/:id", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const asset = await c.env.DB.prepare(
    `SELECT a.id, a.site_id, a.name, a.model, a.serial_no, a.installed_at,
            COALESCE(ms.active, 1) AS active
     FROM assets a
     LEFT JOIN master_entity_states ms
       ON ms.org_id = a.org_id AND ms.entity_type = 'asset' AND ms.entity_id = a.id
     WHERE a.org_id = ? AND a.id = ?`,
  )
    .bind(orgId, id)
    .first<AssetRow>();
  if (!asset) return c.json({ error: "자산을 찾을 수 없습니다" }, 404);

  const rows = await c.env.DB.prepare(
    `SELECT id, site_id, asset_id, storage_key, mime_type, size_bytes, etag,
            checksum_sha256, caption, created_at
     FROM asset_photos
     WHERE org_id = ? AND site_id = ? AND asset_id = ? AND deleted_at IS NULL
     ORDER BY created_at ASC`,
  )
    .bind(orgId, asset.site_id, id)
    .all<AssetPhotoRow>();

  return c.json({
    asset: mapAsset(asset),
    photos: (rows.results ?? []).map((row) => mapAssetPhoto(row, c.req.url)),
  });
});

crmRoutes.post("/assets", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const body = await c.req.json().catch(() => null);
  const parsed = assetUpsertSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const d = parsed.data;

  const site = await c.env.DB.prepare(
    `SELECT s.id, COALESCE(ms.active, 1) AS active
     FROM sites s
     LEFT JOIN master_entity_states ms
       ON ms.org_id = s.org_id AND ms.entity_type = 'site' AND ms.entity_id = s.id
     WHERE s.org_id = ? AND s.id = ?`,
  )
    .bind(orgId, d.siteId)
    .first<{ id: string; active: number }>();
  if (!site) return c.json({ error: "현장을 찾을 수 없습니다" }, 400);
  if (!site.active) return c.json({ error: "비활성 현장에는 장비를 등록할 수 없습니다" }, 409);

  const id = newId();
  const ts = nowIso();
  const active = d.active ?? true;
  await c.env.DB.batch([
    c.env.DB
      .prepare(
        `INSERT INTO assets
           (id, org_id, site_id, name, model, serial_no, installed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        orgId,
        d.siteId,
        d.name,
        d.model ?? null,
        d.serialNo ?? null,
        d.installedAt ?? null,
        ts,
        ts,
      ),
    c.env.DB
      .prepare(
        `INSERT INTO master_entity_states
           (org_id, entity_type, entity_id, active, updated_at, updated_by)
         VALUES (?, 'asset', ?, ?, ?, ?)`,
      )
      .bind(orgId, id, active ? 1 : 0, ts, c.get("userId")),
  ]);

  await recordAudit(c.env.DB, {
    orgId,
    actorUserId: c.get("userId"),
    event: "asset_created",
    target: id,
    detail: { siteId: d.siteId, active },
  });

  return c.json({
    asset: {
      id,
      siteId: d.siteId,
      name: d.name,
      model: d.model ?? null,
      serialNo: d.serialNo ?? null,
      installedAt: d.installedAt ?? null,
      active,
    },
  });
});

crmRoutes.patch("/assets/:id", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const current = await c.env.DB.prepare(
    `SELECT a.id, a.site_id, a.name, a.model, a.serial_no, a.installed_at,
            COALESCE(ms.active, 1) AS active
     FROM assets a
     LEFT JOIN master_entity_states ms
       ON ms.org_id = a.org_id AND ms.entity_type = 'asset' AND ms.entity_id = a.id
     WHERE a.org_id = ? AND a.id = ?`,
  )
    .bind(orgId, id)
    .first<AssetRow>();
  if (!current) return c.json({ error: "자산을 찾을 수 없습니다" }, 404);

  const body = await c.req.json().catch(() => null);
  const parsed = assetUpsertSchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const d = parsed.data;
  const targetSiteId = d.siteId !== undefined ? d.siteId : current.site_id;
  if (d.siteId !== undefined) {
    const site = await c.env.DB.prepare(
      `SELECT s.id, COALESCE(ms.active, 1) AS active
       FROM sites s
       LEFT JOIN master_entity_states ms
         ON ms.org_id = s.org_id AND ms.entity_type = 'site' AND ms.entity_id = s.id
       WHERE s.org_id = ? AND s.id = ?`,
    )
      .bind(orgId, targetSiteId)
      .first<{ id: string; active: number }>();
    if (!site) return c.json({ error: "현장을 찾을 수 없습니다" }, 400);
    if (!site.active) return c.json({ error: "비활성 현장으로 장비를 이동할 수 없습니다" }, 409);
  }

  const ts = nowIso();
  const merged = {
    siteId: targetSiteId,
    name: d.name !== undefined ? d.name : current.name,
    model: d.model !== undefined ? d.model : current.model,
    serialNo: d.serialNo !== undefined ? d.serialNo : current.serial_no,
    installedAt: d.installedAt !== undefined ? d.installedAt : current.installed_at,
    active: d.active !== undefined ? d.active : !!current.active,
  };
  const updateStatements = [
    c.env.DB
      .prepare(
        `UPDATE assets
         SET site_id = ?, name = ?, model = ?, serial_no = ?, installed_at = ?, updated_at = ?
         WHERE org_id = ? AND id = ?`,
      )
      .bind(
        merged.siteId,
        merged.name,
        merged.model,
        merged.serialNo,
        merged.installedAt,
        ts,
        orgId,
        id,
      ),
  ];
  if (d.siteId !== undefined && d.siteId !== current.site_id) {
    updateStatements.push(
      c.env.DB
        .prepare("UPDATE asset_photos SET site_id = ? WHERE org_id = ? AND asset_id = ?")
        .bind(merged.siteId, orgId, id),
    );
  }
  await c.env.DB.batch(updateStatements);
  if (d.active !== undefined) {
    await setEntityActive(c.env.DB, {
      orgId,
      entityType: "asset",
      entityId: id,
      active: d.active,
      userId: c.get("userId"),
      timestamp: ts,
    });
  }

  await recordAudit(c.env.DB, {
    orgId,
    actorUserId: c.get("userId"),
    event: auditEvent("asset", d.active),
    target: id,
    detail: { changedFields: Object.keys(d), active: merged.active },
  });

  return c.json({ asset: { id, ...merged } });
});

crmRoutes.get("/assets/:id/photos", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const asset = await loadAssetOwner(c.env.DB, orgId, id);
  if (!asset) return c.json({ error: "자산을 찾을 수 없습니다" }, 404);

  const rows = await c.env.DB.prepare(
    `SELECT id, site_id, asset_id, storage_key, mime_type, size_bytes, etag,
            checksum_sha256, caption, created_at
     FROM asset_photos
     WHERE org_id = ? AND site_id = ? AND asset_id = ? AND deleted_at IS NULL
     ORDER BY created_at ASC`,
  )
    .bind(orgId, asset.site_id, id)
    .all<AssetPhotoRow>();

  return c.json({
    photos: (rows.results ?? []).map((row) => mapAssetPhoto(row, c.req.url)),
  });
});

crmRoutes.post("/assets/:id/photos", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const asset = await loadAssetOwner(c.env.DB, orgId, id);
  if (!asset) return c.json({ error: "자산을 찾을 수 없습니다" }, 404);
  if (!asset.active) return c.json({ error: "비활성 장비에는 사진을 추가할 수 없습니다" }, 409);
  if (!c.env.MEDIA) return c.json({ error: "R2 MEDIA 바인딩이 없습니다" }, 503);

  const rawIdempotencyKey = c.req.header("Idempotency-Key");
  const idempotencyKey =
    rawIdempotencyKey === undefined ? null : rawIdempotencyKey.trim();
  if (
    idempotencyKey !== null &&
    !UPLOAD_IDEMPOTENCY_KEY.test(idempotencyKey)
  ) {
    return c.json({ error: "업로드 멱등성 키가 올바르지 않습니다" }, 400);
  }
  const captionValue = c.req.query("caption")?.trim();
  if (captionValue && captionValue.length > 200) {
    return c.json({ error: "사진 설명은 200자 이하여야 합니다" }, 400);
  }
  const caption = captionValue || null;

  let media;
  try {
    media = decodeMediaBytes(
      "photo",
      requestMediaMimeType(c.req.raw),
      await readBoundedMediaRequest(c.req.raw, MAX_PHOTO_BYTES),
    );
  } catch (error) {
    return c.json(
      mediaErrorResponse(error),
      error instanceof MediaValidationError && error.code === "media_too_large" ? 413 : 400,
    );
  }

  const requestFingerprint = await computeMediaRequestFingerprint({
    media,
    metadata: { caption },
  });
  if (idempotencyKey) {
    const replay = await loadIdempotentAssetPhoto(c.env.DB, {
      orgId,
      siteId: asset.site_id,
      assetId: id,
      idempotencyKey,
      expectedFingerprint: requestFingerprint,
      requestUrl: c.req.url,
    });
    if (replay.kind === "conflict") {
      return c.json(
        { error: "같은 멱등성 키가 다른 장비 사진 또는 메타데이터에 사용되었습니다" },
        409,
      );
    }
    if (replay.kind === "replay") {
      return c.json({ photo: replay.photo, idempotentReplay: true });
    }
  }

  const count = await c.env.DB.prepare(
    "SELECT COUNT(*) AS count FROM asset_photos WHERE org_id = ? AND site_id = ? AND asset_id = ? AND deleted_at IS NULL",
  )
    .bind(orgId, asset.site_id, id)
    .first<{ count: number }>();
  if ((count?.count ?? 0) >= MAX_PHOTOS_PER_ASSET) {
    return c.json({ error: `장비 사진은 최대 ${MAX_PHOTOS_PER_ASSET}장까지 등록할 수 있습니다` }, 409);
  }

  const photoId = newId();
  const ts = nowIso();
  const storageKey = createImmutableAssetPhotoKey({
    orgId,
    siteId: asset.site_id,
    assetId: id,
    photoId,
    mimeType: media.mimeType,
    createdAt: new Date(ts),
  });

  let stored;
  try {
    stored = await putPrivateMedia(c.env.MEDIA, {
      storageKey,
      media,
      assetId: photoId,
    });
  } catch (error) {
    return c.json(
      mediaErrorResponse(error),
      error instanceof MediaValidationError ? 400 : 503,
    );
  }

  try {
    const inserted = await c.env.DB.prepare(
      `INSERT INTO asset_photos
         (id, org_id, site_id, asset_id, storage_key, mime_type, size_bytes,
          etag, checksum_sha256, caption, idempotency_key, request_fingerprint,
          created_at, deleted_at)
       SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL
       WHERE EXISTS (
         SELECT 1
         FROM assets a
         LEFT JOIN master_entity_states ms
           ON ms.org_id = a.org_id AND ms.entity_type = 'asset' AND ms.entity_id = a.id
         WHERE a.id = ? AND a.org_id = ? AND a.site_id = ? AND COALESCE(ms.active, 1) = 1
       )
       AND (
         SELECT COUNT(*)
         FROM asset_photos
         WHERE org_id = ? AND site_id = ? AND asset_id = ? AND deleted_at IS NULL
       ) < ?`,
    )
      .bind(
        photoId,
        orgId,
        asset.site_id,
        id,
        stored.storageKey,
        stored.mimeType,
        stored.sizeBytes,
        stored.etag,
        stored.checksumSha256,
        caption,
        idempotencyKey,
        requestFingerprint,
        ts,
        id,
        orgId,
        asset.site_id,
        orgId,
        asset.site_id,
        id,
        MAX_PHOTOS_PER_ASSET,
      )
      .run();

    if (inserted.meta.changes !== 1) {
      await deletePrivateMedia(c.env.MEDIA, stored.storageKey);
      return c.json(
        { error: "장비 상태가 변경되었거나 사진 등록 한도에 도달했습니다" },
        409,
      );
    }
  } catch (error) {
    await deletePrivateMedia(c.env.MEDIA, stored.storageKey).catch(() => undefined);
    if (idempotencyKey) {
      const replay = await loadIdempotentAssetPhoto(c.env.DB, {
        orgId,
        siteId: asset.site_id,
        assetId: id,
        idempotencyKey,
        expectedFingerprint: requestFingerprint,
        requestUrl: c.req.url,
      });
      if (replay.kind === "conflict") {
        return c.json(
          { error: "같은 멱등성 키가 다른 장비 사진 또는 메타데이터에 사용되었습니다" },
          409,
        );
      }
      if (replay.kind === "replay") {
        return c.json({ photo: replay.photo, idempotentReplay: true });
      }
    }
    throw error;
  }

  await recordAudit(c.env.DB, {
    orgId,
    actorUserId: c.get("userId"),
    event: "asset_photo_created",
    target: photoId,
    detail: {
      assetId: id,
      siteId: asset.site_id,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
    },
  });

  return c.json({
    photo: {
      id: photoId,
      assetId: id,
      siteId: asset.site_id,
      url: assetPhotoUrl(c.req.url, id, photoId),
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      caption,
      createdAt: ts,
    },
  });
});

crmRoutes.get(
  "/assets/:id/photos/:photoId/content",
  requireAuth,
  requireOfficeOrAdmin,
  async (c) => {
    const orgId = c.get("orgId");
    const id = c.req.param("id");
    const asset = await loadAssetOwner(c.env.DB, orgId, id);
    if (!asset) return c.json({ error: "자산을 찾을 수 없습니다" }, 404);

    const photo = await c.env.DB.prepare(
      `SELECT id, site_id, asset_id, storage_key, mime_type, size_bytes, etag,
              checksum_sha256, caption, created_at
       FROM asset_photos
       WHERE id = ? AND org_id = ? AND site_id = ? AND asset_id = ? AND deleted_at IS NULL`,
    )
      .bind(c.req.param("photoId"), orgId, asset.site_id, id)
      .first<AssetPhotoRow>();
    if (!photo) return c.json({ error: "장비 사진을 찾을 수 없습니다" }, 404);
    if (!c.env.MEDIA) return c.json({ error: "R2 MEDIA 바인딩이 없습니다" }, 503);

    const response = await getPrivateMediaResponse(c.env.MEDIA, {
      storageKey: photo.storage_key,
      mimeType: photo.mime_type,
      checksumSha256: photo.checksum_sha256,
    });
    return response ?? c.json({ error: "장비 사진을 찾을 수 없습니다" }, 404);
  },
);

crmRoutes.delete("/assets/:id/photos/:photoId", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const asset = await loadAssetOwner(c.env.DB, orgId, id);
  if (!asset) return c.json({ error: "자산을 찾을 수 없습니다" }, 404);
  if (!c.env.MEDIA) return c.json({ error: "R2 MEDIA 바인딩이 없습니다" }, 503);

  const photo = await c.env.DB.prepare(
    `SELECT id, site_id, asset_id, storage_key, mime_type, size_bytes, etag,
            checksum_sha256, caption, created_at
     FROM asset_photos
     WHERE id = ? AND org_id = ? AND site_id = ? AND asset_id = ? AND deleted_at IS NULL`,
  )
    .bind(c.req.param("photoId"), orgId, asset.site_id, id)
    .first<AssetPhotoRow>();
  if (!photo) return c.json({ error: "장비 사진을 찾을 수 없습니다" }, 404);

  const ts = nowIso();
  const marked = await c.env.DB.prepare(
    `UPDATE asset_photos
     SET deleted_at = ?
     WHERE id = ? AND org_id = ? AND site_id = ? AND asset_id = ? AND deleted_at IS NULL`,
  )
    .bind(ts, photo.id, orgId, asset.site_id, id)
    .run();
  if (marked.meta.changes !== 1) {
    return c.json({ error: "장비 사진을 찾을 수 없습니다" }, 404);
  }

  try {
    await deletePrivateMedia(c.env.MEDIA, photo.storage_key);
  } catch {
    await c.env.DB.prepare(
      "UPDATE asset_photos SET deleted_at = NULL WHERE id = ? AND deleted_at = ?",
    )
      .bind(photo.id, ts)
      .run();
    return c.json({ error: "사진 저장소 삭제에 실패해 변경을 되돌렸습니다" }, 503);
  }

  await recordAudit(c.env.DB, {
    orgId,
    actorUserId: c.get("userId"),
    event: "asset_photo_deleted",
    target: photo.id,
    detail: { assetId: id, siteId: asset.site_id },
  });

  return c.json({ ok: true });
});

crmRoutes.get("/assets/:id/history", requireAuth, requireOfficeOrAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const asset = await c.env.DB.prepare("SELECT id FROM assets WHERE org_id = ? AND id = ?")
    .bind(orgId, id)
    .first();
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
