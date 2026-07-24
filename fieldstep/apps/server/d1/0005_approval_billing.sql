-- 승인·정정·청구 P0 증빙 보강.
-- 기존 승인본/서명은 그대로 두고, 승인 요청 행에 수정 사유와 사무실 정정 개시를 기록한다.

ALTER TABLE approval_requests ADD COLUMN revision_comment TEXT;
ALTER TABLE approval_requests ADD COLUMN correction_requested_at TEXT;
ALTER TABLE approval_requests ADD COLUMN correction_requested_by TEXT REFERENCES users (id);

ALTER TABLE signatures ADD COLUMN agreed INTEGER NOT NULL DEFAULT 1 CHECK (agreed IN (0, 1));
ALTER TABLE signatures ADD COLUMN consented_at TEXT;
ALTER TABLE signatures ADD COLUMN consent_version TEXT NOT NULL DEFAULT 'approval-consent-v1';

UPDATE signatures
SET consented_at = approved_at
WHERE consented_at IS NULL;

-- billing_records 한 행을 낙관적 잠금(CAS)으로 갱신하고, 같은 batch의
-- work_orders 상태 변경이 정확히 그 쓰기에만 연결되도록 내부 표식을 둔다.
ALTER TABLE billing_records ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE billing_records ADD COLUMN write_token TEXT;
