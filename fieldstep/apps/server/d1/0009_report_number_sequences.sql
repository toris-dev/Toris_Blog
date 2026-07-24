-- 보고서 번호는 조직별 단일 원자 카운터에서 발급한다.
-- next_value는 "다음에 발급할 값"이며, 기존 데이터는 파싱 가능한 FS-YYYYMMDD-N
-- 접미사의 최댓값에서 이어 간다. 파싱 불가능한 레거시 값이 섞여 있으면
-- 전체 버전 수를 함께 사용해 이미 사용했을 가능성이 있는 번호를 보수적으로 건너뛴다.

CREATE TABLE IF NOT EXISTS report_number_sequences (
  org_id TEXT PRIMARY KEY REFERENCES organizations(id),
  next_value INTEGER NOT NULL CHECK (next_value > 0),
  updated_at TEXT NOT NULL
);

WITH existing_report_numbers AS (
  SELECT
    o.id AS org_id,
    rv.id AS report_version_id,
    CASE
      WHEN rv.report_number GLOB
        'FS-[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]-[0-9]*'
        AND substr(rv.report_number, 13) <> ''
        AND substr(rv.report_number, 13) NOT GLOB '*[^0-9]*'
      THEN CAST(substr(rv.report_number, 13) AS INTEGER)
      ELSE NULL
    END AS parsed_suffix
  FROM organizations AS o
  LEFT JOIN work_orders AS w ON w.org_id = o.id
  LEFT JOIN report_versions AS rv ON rv.work_order_id = w.id
)
INSERT INTO report_number_sequences (org_id, next_value, updated_at)
SELECT
  org_id,
  CASE
    WHEN COUNT(report_version_id) = COUNT(parsed_suffix)
      THEN COALESCE(MAX(parsed_suffix), 0) + 1
    ELSE MAX(
      COALESCE(MAX(parsed_suffix), 0) + 1,
      COUNT(report_version_id) + 1
    )
  END,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM existing_report_numbers
GROUP BY org_id
ON CONFLICT(org_id) DO UPDATE SET
  next_value = MAX(report_number_sequences.next_value, excluded.next_value),
  updated_at = excluded.updated_at;
