-- 작업지시·보고서 초안의 낙관적 잠금과 batch 소유권 표식.
-- D1 batch는 changes=0을 오류로 취급하지 않으므로 후속 쓰기는 write_token으로
-- 성공한 work_orders CAS와 명시적으로 연결한다.

ALTER TABLE work_orders ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE work_orders ADD COLUMN write_token TEXT;

ALTER TABLE report_drafts ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
