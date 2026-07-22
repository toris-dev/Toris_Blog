-- 기능 테이블: 진단·목표·커뮤니티·상담·지표
CREATE TABLE IF NOT EXISTS app_users (
  email TEXT PRIMARY KEY,
  uid TEXT,
  name TEXT,
  stage INTEGER NOT NULL DEFAULT 0, -- 0=미진단, 1..8
  diagnosed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  title TEXT NOT NULL,
  stage INTEGER,
  status TEXT NOT NULL DEFAULT 'todo', -- todo|doing|done
  retro TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS goals_email_idx ON goals(email);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  author TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'story', -- story|feedback|match
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS expert_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  topic TEXT NOT NULL, -- marketing|pricing|tax|legal
  preferred_at TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'requested', -- requested|confirmed|done|canceled
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS expert_sessions_email_idx ON expert_sessions(email);

CREATE TABLE IF NOT EXISTS metrics (
  email TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  revenue INTEGER NOT NULL DEFAULT 0,
  users INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (email, date)
);

-- 커뮤니티 시드: 토리스의 실행 기록
INSERT INTO posts (email, author, type, title, body, created_at) VALUES
 ('korea@toris.kr','토리스','story','밈캐치 첫 출시에서 배운 것: 심사보다 스토어 자산이 오래 걸렸다','출시 2주 전 계획을 세웠지만 실제로는 스크린샷과 설명 문구에 사흘을 썼습니다. 토리스는 이제 출시 자산을 MVP 단계에서 미리 만들어 둡니다.', datetime('now','-6 days')),
 ('korea@toris.kr','토리스','story','첫 결제가 나오기까지 가격을 세 번 바꿨습니다','4,900원 → 2,900원 → 3,900원. 가격을 낮춘다고 전환이 오르지 않았고, 가치 설명 문장을 바꿨을 때 첫 결제가 나왔습니다.', datetime('now','-3 days')),
 ('korea@toris.kr','토리스','feedback','구독 해지 설문, 어떤 질문이 효과 있었나요?','해지 사유 설문에 4지선다와 자유입력을 붙였는데 응답률이 낮습니다. 다른 빌더들의 경험을 듣고 싶습니다.', datetime('now','-1 days'));
