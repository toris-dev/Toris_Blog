import { Hono } from "hono";
import { inviteCreateSchema, organizationUpdateSchema } from "@fieldstep/shared";
import { z } from "zod";
import type { AppEnv } from "../db.js";
import { newId, nowIso, recordAudit } from "../db.js";
import { requireAuth, requireAdmin, requireOfficeOrAdmin } from "../middleware.js";
import { generateToken, sha256Hex, addDaysIso } from "../auth.js";
import {
  MAX_PHOTO_BYTES,
  MediaValidationError,
  createImmutableOrganizationLogoKey,
  decodeMediaBytes,
  deletePrivateMedia,
  getPrivateMediaResponse,
  putPrivateMedia,
  readBoundedMediaRequest,
  requestMediaMimeType,
} from "../media.js";

const INVITE_TTL_DAYS = 7;
const memberIdSchema = z.string().uuid();
const memberActiveSchema = z.object({ active: z.boolean() }).strict();

export const orgRoutes = new Hono<AppEnv>();

type OrganizationRow = {
  id: string;
  name: string;
  logo_url: string | null;
  business_no: string | null;
  address: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  created_at: string;
  updated_at: string | null;
};

type OrganizationLogoRow = {
  id: string;
  org_id: string;
  storage_key: string;
  mime_type: "image/jpeg" | "image/png" | "image/webp";
  size_bytes: number;
  etag: string | null;
  checksum_sha256: string;
  created_at: string;
};

type MemberRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  active: number;
};

function mapMember(row: MemberRow) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    active: !!row.active,
  };
}

function mapOrganization(row: OrganizationRow) {
  return {
    id: row.id,
    name: row.name,
    logoUrl: row.logo_url,
    businessNo: row.business_no,
    address: row.address,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

async function loadOrganization(db: D1Database, orgId: string): Promise<OrganizationRow | null> {
  return db
    .prepare(
      `SELECT o.id, o.name, o.created_at,
              p.logo_url, p.business_no, p.address, p.contact_name, p.contact_phone,
              p.contact_email, p.updated_at
       FROM organizations o
       LEFT JOIN organization_profiles p ON p.org_id = o.id
       WHERE o.id = ?`,
    )
    .bind(orgId)
    .first<OrganizationRow>();
}

async function loadActiveOrganizationLogo(
  db: D1Database,
  orgId: string,
): Promise<OrganizationLogoRow | null> {
  return db
    .prepare(
      `SELECT id, org_id, storage_key, mime_type, size_bytes, etag, checksum_sha256, created_at
       FROM organization_logo_assets
       WHERE org_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
    )
    .bind(orgId)
    .first<OrganizationLogoRow>();
}

function organizationLogoUrl(requestUrl: string, logoId: string): string {
  return `${new URL(requestUrl).origin}/organization/logo/${encodeURIComponent(logoId)}/content`;
}

function mediaErrorResponse(error: unknown): { error: string } {
  return {
    error:
      error instanceof MediaValidationError
        ? error.message
        : "조직 로고를 처리하지 못했습니다",
  };
}

orgRoutes.get("/organization", requireAuth, async (c) => {
  const organization = await loadOrganization(c.env.DB, c.get("orgId"));
  if (!organization) return c.json({ error: "조직을 찾을 수 없습니다" }, 404);
  return c.json({ organization: mapOrganization(organization) });
});

orgRoutes.patch("/organization", requireAuth, requireAdmin, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = organizationUpdateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);

  const orgId = c.get("orgId");
  const current = await loadOrganization(c.env.DB, orgId);
  if (!current) return c.json({ error: "조직을 찾을 수 없습니다" }, 404);

  const d = parsed.data;
  const storedLogoToReplace =
    d.logoUrl !== undefined && d.logoUrl !== current.logo_url
      ? await loadActiveOrganizationLogo(c.env.DB, orgId)
      : null;
  const ts = nowIso();
  const merged = {
    name: d.name !== undefined ? d.name : current.name,
    logoUrl: d.logoUrl !== undefined ? d.logoUrl : current.logo_url,
    businessNo: d.businessNo !== undefined ? d.businessNo : current.business_no,
    address: d.address !== undefined ? d.address : current.address,
    contactName: d.contactName !== undefined ? d.contactName : current.contact_name,
    contactPhone: d.contactPhone !== undefined ? d.contactPhone : current.contact_phone,
    contactEmail: d.contactEmail !== undefined ? d.contactEmail : current.contact_email,
  };

  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE organizations SET name = ? WHERE id = ?").bind(merged.name, orgId),
    c.env.DB
      .prepare(
        `INSERT INTO organization_profiles
           (org_id, logo_url, business_no, address, contact_name, contact_phone, contact_email, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(org_id) DO UPDATE SET
           logo_url = excluded.logo_url,
           business_no = excluded.business_no,
           address = excluded.address,
           contact_name = excluded.contact_name,
           contact_phone = excluded.contact_phone,
           contact_email = excluded.contact_email,
           updated_at = excluded.updated_at`,
      )
      .bind(
        orgId,
        merged.logoUrl,
        merged.businessNo,
        merged.address,
        merged.contactName,
        merged.contactPhone,
        merged.contactEmail,
        ts,
      ),
  ]);

  if (storedLogoToReplace) {
    // 확정 보고서가 과거 로고의 불변 R2 키를 참조할 수 있으므로 목록에서만
    // soft-delete한다. 객체 수명은 보고서 보존정책과 함께 관리한다.
    await c.env.DB.prepare(
      "UPDATE organization_logo_assets SET deleted_at = ? WHERE id = ? AND org_id = ? AND deleted_at IS NULL",
    )
      .bind(ts, storedLogoToReplace.id, orgId)
      .run();
  }

  await recordAudit(c.env.DB, {
    orgId,
    actorUserId: c.get("userId"),
    event: "organization_updated",
    target: orgId,
    detail: { changedFields: Object.keys(d) },
  });

  return c.json({
    organization: {
      id: orgId,
      ...merged,
      createdAt: current.created_at,
      updatedAt: ts,
    },
  });
});

orgRoutes.post("/organization/logo", requireAuth, requireAdmin, async (c) => {
  const orgId = c.get("orgId");
  const current = await loadOrganization(c.env.DB, orgId);
  if (!current) return c.json({ error: "조직을 찾을 수 없습니다" }, 404);
  if (!c.env.MEDIA) return c.json({ error: "R2 MEDIA 바인딩이 없습니다" }, 503);

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

  const previousLogo = await loadActiveOrganizationLogo(c.env.DB, orgId);
  const logoId = newId();
  const ts = nowIso();
  const logoUrl = organizationLogoUrl(c.req.url, logoId);
  const storageKey = createImmutableOrganizationLogoKey({
    orgId,
    logoId,
    mimeType: media.mimeType,
    createdAt: new Date(ts),
  });

  let stored;
  try {
    stored = await putPrivateMedia(c.env.MEDIA, {
      storageKey,
      media,
      assetId: logoId,
    });
  } catch (error) {
    return c.json(
      mediaErrorResponse(error),
      error instanceof MediaValidationError ? 400 : 503,
    );
  }

  try {
    await c.env.DB.batch([
      c.env.DB
        .prepare(
          `UPDATE organization_logo_assets
           SET deleted_at = ?
           WHERE org_id = ? AND deleted_at IS NULL`,
        )
        .bind(ts, orgId),
      c.env.DB
        .prepare(
          `INSERT INTO organization_logo_assets
             (id, org_id, storage_key, mime_type, size_bytes, etag, checksum_sha256, created_at, deleted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        )
        .bind(
          logoId,
          orgId,
          stored.storageKey,
          stored.mimeType,
          stored.sizeBytes,
          stored.etag,
          stored.checksumSha256,
          ts,
        ),
      c.env.DB
        .prepare(
          `INSERT INTO organization_profiles (org_id, logo_url, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(org_id) DO UPDATE SET
             logo_url = excluded.logo_url,
             updated_at = excluded.updated_at`,
        )
        .bind(orgId, logoUrl, ts),
    ]);
  } catch (error) {
    await deletePrivateMedia(c.env.MEDIA, stored.storageKey).catch(() => undefined);
    throw error;
  }

  // 비활성화한 과거 로고 객체는 확정 보고서 snapshot을 위해 R2에 그대로 보존한다.

  await recordAudit(c.env.DB, {
    orgId,
    actorUserId: c.get("userId"),
    event: "organization_logo_updated",
    target: logoId,
    detail: {
      previousLogoId: previousLogo?.id ?? null,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
    },
  });

  const organization = await loadOrganization(c.env.DB, orgId);
  return c.json({
    organization: mapOrganization(organization!),
    logo: {
      id: logoId,
      url: logoUrl,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      createdAt: ts,
    },
  });
});

orgRoutes.get("/organization/logo/:logoId/content", requireAuth, async (c) => {
  const logo = await c.env.DB.prepare(
    `SELECT id, org_id, storage_key, mime_type, size_bytes, etag, checksum_sha256, created_at
     FROM organization_logo_assets
     WHERE id = ? AND org_id = ? AND deleted_at IS NULL`,
  )
    .bind(c.req.param("logoId"), c.get("orgId"))
    .first<OrganizationLogoRow>();
  if (!logo) return c.json({ error: "조직 로고를 찾을 수 없습니다" }, 404);
  if (!c.env.MEDIA) return c.json({ error: "R2 MEDIA 바인딩이 없습니다" }, 503);

  const response = await getPrivateMediaResponse(c.env.MEDIA, {
    storageKey: logo.storage_key,
    mimeType: logo.mime_type,
    checksumSha256: logo.checksum_sha256,
  });
  return response ?? c.json({ error: "조직 로고를 찾을 수 없습니다" }, 404);
});

orgRoutes.delete("/organization/logo", requireAuth, requireAdmin, async (c) => {
  const orgId = c.get("orgId");
  const current = await loadOrganization(c.env.DB, orgId);
  if (!current) return c.json({ error: "조직을 찾을 수 없습니다" }, 404);

  const logo = await loadActiveOrganizationLogo(c.env.DB, orgId);
  const ts = nowIso();
  if (!logo) {
    await c.env.DB.prepare(
      `INSERT INTO organization_profiles (org_id, logo_url, updated_at)
       VALUES (?, NULL, ?)
       ON CONFLICT(org_id) DO UPDATE SET logo_url = NULL, updated_at = excluded.updated_at`,
    )
      .bind(orgId, ts)
      .run();
  } else {
    await c.env.DB.batch([
      c.env.DB
        .prepare(
          "UPDATE organization_logo_assets SET deleted_at = ? WHERE id = ? AND org_id = ? AND deleted_at IS NULL",
        )
        .bind(ts, logo.id, orgId),
      c.env.DB
        .prepare("UPDATE organization_profiles SET logo_url = NULL, updated_at = ? WHERE org_id = ?")
        .bind(ts, orgId),
    ]);
    // 과거 확정 보고서의 로고 snapshot이 참조할 수 있도록 R2 객체는 보존한다.
  }

  await recordAudit(c.env.DB, {
    orgId,
    actorUserId: c.get("userId"),
    event: "organization_logo_deleted",
    target: logo?.id ?? orgId,
  });
  const organization = await loadOrganization(c.env.DB, orgId);
  return c.json({ ok: true, organization: mapOrganization(organization!) });
});

orgRoutes.get("/users", requireAuth, requireOfficeOrAdmin, async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT u.id, u.email, u.name, m.role, m.active
     FROM memberships m JOIN users u ON u.id = m.user_id
     WHERE m.org_id = ? ORDER BY u.name ASC`,
  )
    .bind(c.get("orgId"))
    .all<MemberRow>();

  const members = (rows.results ?? []).map(mapMember);
  return c.json({ members });
});

orgRoutes.patch("/users/:id/active", requireAuth, requireAdmin, async (c) => {
  const parsedId = memberIdSchema.safeParse(c.req.param("id"));
  const parsedBody = memberActiveSchema.safeParse(
    await c.req.json().catch(() => null),
  );
  if (!parsedId.success || !parsedBody.success) {
    return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  }

  const orgId = c.get("orgId");
  const actorUserId = c.get("userId");
  const memberId = parsedId.data;
  const active = parsedBody.data.active;
  const target = await c.env.DB
    .prepare(
      `SELECT u.id, u.email, u.name, m.role, m.active
       FROM memberships m
       JOIN users u ON u.id = m.user_id
       WHERE m.org_id = ? AND m.user_id = ?`,
    )
    .bind(orgId, memberId)
    .first<MemberRow>();
  if (!target) return c.json({ error: "구성원을 찾을 수 없습니다" }, 404);
  if (!active && memberId === actorUserId) {
    return c.json({ error: "자기 자신은 비활성화할 수 없습니다" }, 409);
  }

  const desiredActive = active ? 1 : 0;
  if (target.active === desiredActive) {
    if (!active) {
      await c.env.DB
        .prepare(
          `DELETE FROM sessions
           WHERE org_id = ? AND user_id = ?
             AND EXISTS (
               SELECT 1 FROM memberships
               WHERE org_id = ? AND user_id = ? AND active = 0
             )`,
        )
        .bind(orgId, memberId, orgId, memberId)
        .run();
    }
    return c.json({ member: mapMember(target), changed: false });
  }

  const event = active ? "member_activated" : "member_deactivated";
  const ts = nowIso();
  const auditId = newId();
  const auditDetail = JSON.stringify({
    role: target.role,
    previousActive: !!target.active,
    active,
  });
  const guard = `
    org_id = ? AND user_id = ? AND active = ?
    AND EXISTS (
      SELECT 1
      FROM memberships AS acting_admin
      WHERE acting_admin.org_id = memberships.org_id
        AND acting_admin.user_id = ?
        AND acting_admin.role = 'admin'
        AND acting_admin.active = 1
    )
    AND (
      ? = 1
      OR role <> 'admin'
      OR EXISTS (
        SELECT 1
        FROM memberships AS other_admin
        WHERE other_admin.org_id = memberships.org_id
          AND other_admin.user_id <> memberships.user_id
          AND other_admin.role = 'admin'
          AND other_admin.active = 1
      )
    )`;
  const transition = await c.env.DB.batch([
    c.env.DB
      .prepare(
        `INSERT INTO audit_events
           (id, org_id, actor_user_id, event, target, detail_json, created_at)
         SELECT ?, ?, ?, ?, ?, ?, ?
         FROM memberships
         WHERE ${guard}`,
      )
      .bind(
        auditId,
        orgId,
        actorUserId,
        event,
        memberId,
        auditDetail,
        ts,
        orgId,
        memberId,
        target.active,
        actorUserId,
        desiredActive,
      ),
    c.env.DB
      .prepare(
        `UPDATE memberships
         SET active = ?
         WHERE ${guard}`,
      )
      .bind(
        desiredActive,
        orgId,
        memberId,
        target.active,
        actorUserId,
        desiredActive,
      ),
    c.env.DB
      .prepare(
        `DELETE FROM sessions
         WHERE org_id = ? AND user_id = ? AND ? = 0
           AND EXISTS (
             SELECT 1 FROM memberships
             WHERE org_id = ? AND user_id = ? AND active = 0
           )`,
      )
      .bind(orgId, memberId, desiredActive, orgId, memberId),
  ]);

  const auditChanges = transition[0]?.meta.changes ?? 0;
  const membershipChanges = transition[1]?.meta.changes ?? 0;
  if (membershipChanges !== 1) {
    const latest = await c.env.DB
      .prepare(
        `SELECT u.id, u.email, u.name, m.role, m.active
         FROM memberships m
         JOIN users u ON u.id = m.user_id
         WHERE m.org_id = ? AND m.user_id = ?`,
      )
      .bind(orgId, memberId)
      .first<MemberRow>();
    if (latest?.active === desiredActive) {
      return c.json({ member: mapMember(latest), changed: false });
    }
    if (!active && target.role === "admin") {
      return c.json(
        { error: "조직에는 활성 관리자가 한 명 이상 필요합니다" },
        409,
      );
    }
    return c.json({ error: "구성원 상태가 변경되어 처리하지 못했습니다" }, 409);
  }
  if (auditChanges !== 1) {
    throw new Error("구성원 상태 변경 감사 이벤트를 기록하지 못했습니다");
  }

  return c.json({
    member: mapMember({ ...target, active: desiredActive }),
    changed: true,
  });
});

orgRoutes.post("/invites", requireAuth, requireAdmin, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = inviteCreateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "입력값이 올바르지 않습니다" }, 400);
  const { email, role } = parsed.data;

  const pending = await c.env.DB.prepare(
    `SELECT i.id
     FROM invites i
     LEFT JOIN invite_lifecycle il ON il.invite_id = i.id
     WHERE i.org_id = ?
       AND i.email = ?
       AND i.accepted_at IS NULL
       AND il.canceled_at IS NULL
       AND i.expires_at > ?
     LIMIT 1`,
  )
    .bind(c.get("orgId"), email, nowIso())
    .first<{ id: string }>();
  if (pending) return c.json({ error: "해당 이메일로 보낸 대기 중인 초대가 이미 있습니다" }, 409);

  const token = generateToken();
  const tokenHash = await sha256Hex(token);
  const id = newId();
  const expiresAt = addDaysIso(INVITE_TTL_DAYS);
  const ts = nowIso();

  const orgId = c.get("orgId");
  const created = await c.env.DB.batch([
    c.env.DB
      .prepare(
        `INSERT INTO invites
           (id, org_id, email, role, token_hash, expires_at, accepted_at, created_at)
         SELECT ?, ?, ?, ?, ?, ?, NULL, ?
         WHERE NOT EXISTS (
           SELECT 1
           FROM invites i
           LEFT JOIN invite_lifecycle il ON il.invite_id = i.id
           WHERE i.org_id = ? AND i.email = ?
             AND i.accepted_at IS NULL
             AND il.canceled_at IS NULL
             AND i.expires_at > ?
         )`,
      )
      .bind(
        id,
        orgId,
        email,
        role,
        tokenHash,
        expiresAt,
        ts,
        orgId,
        email,
        ts,
      ),
    c.env.DB
      .prepare(
        `INSERT INTO invite_lifecycle (invite_id, canceled_at, resend_count, updated_at)
         SELECT ?, NULL, 0, ?
         WHERE EXISTS (
           SELECT 1 FROM invites
           WHERE id = ? AND org_id = ? AND token_hash = ?
         )`,
      )
      .bind(id, ts, id, orgId, tokenHash),
  ]);
  if (created[0]?.meta.changes !== 1) {
    return c.json({ error: "해당 이메일로 보낸 대기 중인 초대가 이미 있습니다" }, 409);
  }

  await recordAudit(c.env.DB, {
    orgId,
    actorUserId: c.get("userId"),
    event: "invite_created",
    target: id,
  });

  return c.json({
    invite: {
      id,
      email,
      role,
      token,
      expiresAt,
      accepted: false,
      acceptedAt: null,
      canceledAt: null,
      resendCount: 0,
      status: "pending",
    },
  });
});

orgRoutes.get("/invites", requireAuth, requireAdmin, async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT i.id, i.email, i.role, i.expires_at, i.accepted_at, i.created_at,
            il.canceled_at, COALESCE(il.resend_count, 0) AS resend_count
     FROM invites i
     LEFT JOIN invite_lifecycle il ON il.invite_id = i.id
     WHERE i.org_id = ?
     ORDER BY i.created_at DESC`,
  )
    .bind(c.get("orgId"))
    .all<{
      id: string;
      email: string;
      role: string;
      expires_at: string;
      accepted_at: string | null;
      created_at: string;
      canceled_at: string | null;
      resend_count: number;
    }>();

  const now = Date.now();
  const invites = (rows.results ?? []).map((r) => {
    const status = r.accepted_at
      ? "accepted"
      : r.canceled_at
        ? "canceled"
        : new Date(r.expires_at).getTime() <= now
          ? "expired"
          : "pending";
    return {
      id: r.id,
      email: r.email,
      role: r.role,
      expiresAt: r.expires_at,
      createdAt: r.created_at,
      accepted: !!r.accepted_at,
      acceptedAt: r.accepted_at,
      canceledAt: r.canceled_at,
      resendCount: r.resend_count,
      status,
    };
  });
  return c.json({ invites });
});

orgRoutes.post("/invites/:id/resend", requireAuth, requireAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const invite = await c.env.DB.prepare(
    `SELECT i.id, i.email, i.role, i.token_hash, i.accepted_at, il.canceled_at,
            COALESCE(il.resend_count, 0) AS resend_count
     FROM invites i
     LEFT JOIN invite_lifecycle il ON il.invite_id = i.id
     WHERE i.org_id = ? AND i.id = ?`,
  )
    .bind(orgId, id)
    .first<{
      id: string;
      email: string;
      role: string;
      token_hash: string;
      accepted_at: string | null;
      canceled_at: string | null;
      resend_count: number;
    }>();

  if (!invite) return c.json({ error: "초대를 찾을 수 없습니다" }, 404);
  if (invite.accepted_at) return c.json({ error: "이미 수락된 초대는 다시 보낼 수 없습니다" }, 409);
  if (invite.canceled_at) return c.json({ error: "취소된 초대는 다시 보낼 수 없습니다" }, 409);

  const token = generateToken();
  const tokenHash = await sha256Hex(token);
  const expiresAt = addDaysIso(INVITE_TTL_DAYS);
  const ts = nowIso();

  const resent = await c.env.DB.batch([
    c.env.DB
      .prepare(
        `UPDATE invites
         SET token_hash = ?, expires_at = ?
         WHERE id = ? AND org_id = ? AND token_hash = ? AND accepted_at IS NULL
           AND NOT EXISTS (
             SELECT 1 FROM invite_lifecycle
             WHERE invite_id = ? AND canceled_at IS NOT NULL
           )`,
      )
      .bind(tokenHash, expiresAt, id, orgId, invite.token_hash, id),
    c.env.DB
      .prepare(
        `INSERT INTO invite_lifecycle (invite_id, canceled_at, resend_count, updated_at)
         SELECT ?, NULL, 1, ?
         WHERE EXISTS (
           SELECT 1 FROM invites
           WHERE id = ? AND org_id = ? AND token_hash = ? AND accepted_at IS NULL
         )
         ON CONFLICT(invite_id) DO UPDATE SET
           resend_count = invite_lifecycle.resend_count + 1,
           updated_at = excluded.updated_at
         WHERE invite_lifecycle.canceled_at IS NULL`,
      )
      .bind(id, ts, id, orgId, tokenHash),
  ]);
  if (resent[0]?.meta.changes !== 1) {
    return c.json(
      { error: "초대 상태가 변경되어 다시 보낼 수 없습니다" },
      409,
    );
  }

  await recordAudit(c.env.DB, {
    orgId,
    actorUserId: c.get("userId"),
    event: "invite_resent",
    target: id,
  });

  return c.json({
    invite: {
      id,
      email: invite.email,
      role: invite.role,
      token,
      expiresAt,
      accepted: false,
      acceptedAt: null,
      canceledAt: null,
      resendCount: invite.resend_count + 1,
      status: "pending",
    },
  });
});

orgRoutes.delete("/invites/:id", requireAuth, requireAdmin, async (c) => {
  const orgId = c.get("orgId");
  const id = c.req.param("id");
  const invite = await c.env.DB.prepare(
    `SELECT i.id, i.token_hash, i.accepted_at, il.canceled_at
     FROM invites i
     LEFT JOIN invite_lifecycle il ON il.invite_id = i.id
     WHERE i.org_id = ? AND i.id = ?`,
  )
    .bind(orgId, id)
    .first<{
      id: string;
      token_hash: string;
      accepted_at: string | null;
      canceled_at: string | null;
    }>();

  if (!invite) return c.json({ error: "초대를 찾을 수 없습니다" }, 404);
  if (invite.accepted_at) return c.json({ error: "이미 수락된 초대는 취소할 수 없습니다" }, 409);
  if (invite.canceled_at) {
    return c.json({
      ok: true,
      invite: { id, status: "canceled", canceledAt: invite.canceled_at },
    });
  }

  const ts = nowIso();
  const canceled = await c.env.DB.prepare(
    `INSERT INTO invite_lifecycle (invite_id, canceled_at, resend_count, updated_at)
     SELECT ?, ?, 0, ?
     WHERE EXISTS (
       SELECT 1 FROM invites
       WHERE id = ? AND org_id = ? AND token_hash = ? AND accepted_at IS NULL
     )
     ON CONFLICT(invite_id) DO UPDATE SET
       canceled_at = excluded.canceled_at,
       updated_at = excluded.updated_at
     WHERE invite_lifecycle.canceled_at IS NULL`,
  )
    .bind(id, ts, ts, id, orgId, invite.token_hash)
    .run();
  if (canceled.meta.changes !== 1) {
    const latest = await c.env.DB.prepare(
      `SELECT i.accepted_at, il.canceled_at
       FROM invites i
       LEFT JOIN invite_lifecycle il ON il.invite_id = i.id
       WHERE i.id = ? AND i.org_id = ?`,
    )
      .bind(id, orgId)
      .first<{ accepted_at: string | null; canceled_at: string | null }>();
    if (latest?.canceled_at) {
      return c.json({
        ok: true,
        invite: { id, status: "canceled", canceledAt: latest.canceled_at },
      });
    }
    return c.json(
      { error: "초대 상태가 변경되어 취소할 수 없습니다" },
      409,
    );
  }

  await recordAudit(c.env.DB, {
    orgId,
    actorUserId: c.get("userId"),
    event: "invite_canceled",
    target: id,
  });

  return c.json({
    ok: true,
    invite: { id, status: "canceled", canceledAt: ts },
  });
});
