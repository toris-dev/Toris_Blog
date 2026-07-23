/**
 * 로그인 무차별 대입 방어 — (IP + 이메일) 조합별 슬라이딩 윈도우 카운터.
 *
 * 설계 원칙:
 * - fail-open: 스로틀 저장소 오류로 정상 로그인을 막지 않는다(가용성 우선).
 * - (IP+이메일) 조합 키: 특정 IP가 특정 계정을 두드리는 경우만 제한 → 피해자 계정 잠금(DoS) 방지.
 * - Cloudflare 엣지 + 느린 PBKDF2(검증당 수십 ms)와 함께 다층 방어의 한 층.
 */

const WINDOW_MS = 10 * 60 * 1000; // 10분
const MAX_FAILURES = 8; // 윈도우 내 허용 실패 횟수

function keyOf(ip: string, email: string): string {
  return `${ip}:${email.trim().toLowerCase()}`;
}

/** 현재 차단 상태면 남은 대기 초(retryAfter)를 반환, 아니면 null. 오류 시 null(허용). */
export async function checkLoginThrottle(
  db: D1Database,
  ip: string,
  email: string,
  now: number = Date.now(),
): Promise<number | null> {
  try {
    const row = await db
      .prepare("SELECT count, window_start FROM login_attempts WHERE key = ?")
      .bind(keyOf(ip, email))
      .first<{ count: number; window_start: string }>();
    if (!row) return null;
    const startedAt = new Date(row.window_start).getTime();
    if (now - startedAt >= WINDOW_MS) return null; // 윈도우 만료 → 초기화된 것으로 간주
    if (row.count < MAX_FAILURES) return null;
    return Math.ceil((startedAt + WINDOW_MS - now) / 1000);
  } catch {
    return null; // fail-open
  }
}

/** 로그인 실패 1회 기록(윈도우 만료 시 리셋). 오류는 무시. */
export async function recordLoginFailure(
  db: D1Database,
  ip: string,
  email: string,
  now: number = Date.now(),
): Promise<void> {
  try {
    const windowFloor = new Date(now - WINDOW_MS).toISOString();
    const nowIso = new Date(now).toISOString();
    await db
      .prepare(
        `INSERT INTO login_attempts (key, count, window_start) VALUES (?, 1, ?)
         ON CONFLICT(key) DO UPDATE SET
           count = CASE WHEN window_start < ? THEN 1 ELSE count + 1 END,
           window_start = CASE WHEN window_start < ? THEN ? ELSE window_start END`,
      )
      .bind(keyOf(ip, email), nowIso, windowFloor, windowFloor, nowIso)
      .run();
  } catch {
    /* fail-open */
  }
}

/** 로그인 성공 시 카운터 제거. 오류는 무시. */
export async function clearLoginThrottle(db: D1Database, ip: string, email: string): Promise<void> {
  try {
    await db.prepare("DELETE FROM login_attempts WHERE key = ?").bind(keyOf(ip, email)).run();
  } catch {
    /* fail-open */
  }
}
