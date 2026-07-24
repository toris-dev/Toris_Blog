-- 통합관리자(서비스 운영자) 콘솔 — PRD §14.3 운영자 도구.
-- 조직을 넘나드는 내부 운영 전용. 조직 멤버십과 분리된 별도 인증(operator_sessions)과
-- 조직별 보고서 템플릿 버전(org_templates)을 저장한다.

-- 운영자 세션: 조직 격리(sessions.org_id)와 무관한 전사 운영 토큰.
-- 운영자 자격은 런타임에 PLATFORM_OPERATOR_EMAILS allowlist로 재확인하므로,
-- 여기에는 어떤 사용자에게 발급된 토큰인지만 저장한다.
CREATE TABLE IF NOT EXISTS operator_sessions (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users (id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS operator_sessions_token_hash_uq
  ON operator_sessions (token_hash);
CREATE INDEX IF NOT EXISTS operator_sessions_user_idx
  ON operator_sessions (user_id);

-- 조직별 보고서 템플릿 버전. 운영자가 버전을 업로드하고 활성 버전을 지정한다.
-- config_json 은 렌더러가 읽는 슬롯/머리말 설정(자유형 편집기는 범위 밖 — PRD OUT).
CREATE TABLE IF NOT EXISTS org_templates (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations (id),
  version INTEGER NOT NULL CHECK (version > 0),
  name TEXT NOT NULL,
  config_json TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 0 CHECK (active IN (0, 1)),
  uploaded_by TEXT REFERENCES users (id),
  uploaded_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS org_templates_org_version_uq
  ON org_templates (org_id, version);
-- 조직당 활성 템플릿은 최대 하나.
CREATE UNIQUE INDEX IF NOT EXISTS org_templates_active_org_uq
  ON org_templates (org_id) WHERE active = 1;
