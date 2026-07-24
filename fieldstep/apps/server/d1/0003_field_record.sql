-- 현장기록 P0: 체크리스트와 미디어 업로드 멱등성.
-- 새 DB와 기존 DB 모두 Wrangler migration ledger를 통해 이 파일을 정확히 한 번 적용한다.

ALTER TABLE field_records ADD COLUMN checklist_json TEXT;
ALTER TABLE photos ADD COLUMN idempotency_key TEXT;
ALTER TABLE media_assets ADD COLUMN idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS photos_wo_idempotency_uq
  ON photos (work_order_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS media_assets_upload_idempotency_uq
  ON media_assets (org_id, work_order_id, media_type, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
