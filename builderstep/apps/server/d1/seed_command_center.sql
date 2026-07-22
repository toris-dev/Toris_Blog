-- CEO Command Center 시드 데이터 (데모/개발용)
-- builder_id 는 앱 관례에 따라 사용자 email 을 사용한다.
-- 날짜는 SQLite date()/datetime() 로 'now' 기준 상대값 → 언제 적용해도 카드가 살아있음(evergreen).
-- 고정 ID + INSERT OR IGNORE 로 멱등(중복 적용해도 안전).
-- 다른 데모 계정에 시드하려면 아래 email 을 일괄 치환하라.

-- receivables: 하나는 연체(overdue), 하나는 예정
INSERT OR IGNORE INTO receivables (id, builder_id, customer, amount_krw, due_date, paid_at, created_at) VALUES
  ('r_seed_001', 'ironjustlikethat@gmail.com', '(주)가온', 3200000, date('now','-5 days'), NULL, datetime('now','-20 days')),
  ('r_seed_002', 'ironjustlikethat@gmail.com', '메타포지',  1500000, date('now','+9 days'), NULL, datetime('now','-8 days'));

-- payment_failures: 미해결 결제 실패 1건
INSERT OR IGNORE INTO payment_failures (id, builder_id, subscription_id, mrr_krw, failed_at, retry_count, resolved_at) VALUES
  ('pf_seed_001', 'ironjustlikethat@gmail.com', 'sub_demo_1', 49000, datetime('now','-2 days'), 2, NULL);

-- deadlines: 하나는 임박(D-3), 하나는 연체
INSERT OR IGNORE INTO deadlines (id, builder_id, title, due_date, estimated_impact_krw, done_at) VALUES
  ('d_seed_001', 'ironjustlikethat@gmail.com', '앱스토어 심사 제출', date('now','+3 days'), 2000000, NULL),
  ('d_seed_002', 'ironjustlikethat@gmail.com', '세금계산서 발행',   date('now','-1 day'),  500000,  NULL);

-- signals: 반복 문의 / 이탈 / 피드백
INSERT OR IGNORE INTO signals (id, builder_id, channel, kind, text, count, estimated_impact_krw, received_at) VALUES
  ('s_seed_001', 'ironjustlikethat@gmail.com', 'email',  'inquiry',  '로그인 오류 문의', 4, 300000, datetime('now','-1 day')),
  ('s_seed_002', 'ironjustlikethat@gmail.com', 'chat',   'churn',    '해지 요청',       1, 490000, datetime('now','-6 hours')),
  ('s_seed_003', 'ironjustlikethat@gmail.com', 'survey', 'feedback', '대시보드 느림',   2, 0,      datetime('now','-2 days'));

-- financial_snapshots: 런웨이 계산용(직전/최신)
INSERT OR IGNORE INTO financial_snapshots (id, builder_id, cash_krw, monthly_revenue_krw, monthly_fixed_cost_krw, monthly_variable_cost_krw, recorded_at) VALUES
  (9001, 'ironjustlikethat@gmail.com', 30000000, 8000000, 6000000, 2000000, datetime('now','-30 days')),
  (9002, 'ironjustlikethat@gmail.com', 27000000, 8500000, 6000000, 2100000, datetime('now'));

-- loss_prevented: 이번 달 방지한 손실
INSERT OR IGNORE INTO loss_prevented (id, builder_id, kind, amount_krw, note, occurred_at) VALUES
  ('lp_seed_001', 'ironjustlikethat@gmail.com', 'recovered_receivable', 1200000, '미수금 회수', datetime('now','-7 days')),
  ('lp_seed_002', 'ironjustlikethat@gmail.com', 'recovered_churn',       490000, '이탈 방지',   datetime('now','-3 days'));

-- feature_requests: 우선순위 엔진 입력
INSERT OR IGNORE INTO feature_requests (id, builder_id, title, request_count, customer_value_krw, revenue_churn_impact_krw, strategy_fit, urgency, estimated_effort_days, origin, status, created_at) VALUES
  ('fr_seed_001', 'ironjustlikethat@gmail.com', '엑셀 내보내기', 12, 800000, 300000, 0.7, 0.4, 3, 'customer', 'not_now',   datetime('now','-4 days')),
  ('fr_seed_002', 'ironjustlikethat@gmail.com', '2단계 인증',    5,  400000, 200000, 0.6, 0.5, 2, 'founder',  'this_week', datetime('now','-2 days'));
