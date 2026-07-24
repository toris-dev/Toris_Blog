-- 업로드 멱등성 본문 결합, 역할 fail-closed, 조직 로고 단일 활성 행 보장.
-- request_fingerprint는 정규화된 메타데이터와 원본 바이트 SHA-256을 함께 해시한다.

ALTER TABLE photos ADD COLUMN request_fingerprint TEXT;
ALTER TABLE media_assets ADD COLUMN request_fingerprint TEXT;
ALTER TABLE asset_photos ADD COLUMN idempotency_key TEXT;
ALTER TABLE asset_photos ADD COLUMN request_fingerprint TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS asset_photos_upload_idempotency_uq
  ON asset_photos (org_id, asset_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL AND deleted_at IS NULL;

-- 과거 경합으로 활성 로고가 여러 개라면 프로필 URL이 가리키는 행을 우선 보존하고,
-- 그렇지 않으면 가장 최근 행 하나만 활성 상태로 남긴다. R2 객체는 삭제하지 않는다.
UPDATE organization_logo_assets
SET deleted_at = COALESCE(deleted_at, created_at)
WHERE deleted_at IS NULL
  AND id <> (
    SELECT candidate.id
    FROM organization_logo_assets AS candidate
    LEFT JOIN organization_profiles AS profile
      ON profile.org_id = candidate.org_id
    WHERE candidate.org_id = organization_logo_assets.org_id
      AND candidate.deleted_at IS NULL
    ORDER BY
      CASE
        WHEN profile.logo_url LIKE '%/organization/logo/' || candidate.id || '/content'
          THEN 0
        ELSE 1
      END,
      candidate.created_at DESC,
      candidate.id DESC
    LIMIT 1
  );

CREATE UNIQUE INDEX IF NOT EXISTS organization_logo_assets_active_org_uq
  ON organization_logo_assets (org_id)
  WHERE deleted_at IS NULL;
