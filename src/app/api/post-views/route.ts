import { NextRequest, NextResponse } from 'next/server';

/**
 * 조회수 저장소 = 외부 DB 없이 GitHub Issue 하나를 사용한다.
 * (프로젝트가 이미 contact 폼에서 GitHub Issue를 백엔드로 쓰는 것과 동일한 방식)
 *
 * 지정한 Issue의 body 안, 마커 사이에 JSON `{ "<postId>": <count> }` 를 저장하고
 * 조회(GET)/증가(POST) 시 이 body를 읽고 갱신한다.
 *
 * 견고성 설계:
 *  - 저장소 저장소가 public repo이므로 "읽기"는 토큰 없이 수행한다. 따라서 조회수
 *    "표시"는 GITHUB_TOKEN 유효성과 무관하게 항상 동작한다(과거 무효 토큰으로
 *    읽기까지 401 나던 문제 제거).
 *  - 이슈 번호는 env 미설정 시 기본값(35)을 쓴다. 이슈 번호는 공개 정보라 하드코딩
 *    가능하며, Vercel 환경변수 누락으로 기능이 죽지 않게 한다.
 *  - "쓰기(증가)"만 GITHUB_TOKEN 이 필요하다. 토큰이 없거나 무효면 500 대신 현재
 *    저장된 값을 그대로 반환한다(UI가 깨지지 않음).
 *
 * 환경변수:
 *  - GITHUB_TOKEN                (repo 이슈 쓰기 권한, 증가에만 필요)
 *  - GITHUB_VIEWS_ISSUE_NUMBER   (선택, 기본값 '35')
 */

export const dynamic = 'force-dynamic';

const OWNER = 'toris-dev';
const REPO = 'Toris_Blog';
const TOKEN = process.env.GITHUB_TOKEN;
const ISSUE = process.env.GITHUB_VIEWS_ISSUE_NUMBER || '35';
const ISSUE_URL = `https://api.github.com/repos/${OWNER}/${REPO}/issues/${ISSUE}`;

const START = '<!--VIEW_COUNTS_START-->';
const END = '<!--VIEW_COUNTS_END-->';

function isValidPostId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0 && id.length <= 200;
}

// 이슈 body에서 조회수 JSON 파싱 (마커 사이의 JSON, 코드펜스 허용)
function parseCounts(body: string | null | undefined): Record<string, number> {
  if (!body) return {};
  const start = body.indexOf(START);
  const end = body.indexOf(END);
  if (start === -1 || end === -1 || end < start) return {};
  const inner = body
    .slice(start + START.length, end)
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  if (!inner) return {};
  try {
    const parsed = JSON.parse(inner);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

// 갱신된 조회수 JSON을 이슈 body에 다시 써넣기 (마커 블록 교체/추가)
function buildBody(
  existing: string | null | undefined,
  counts: Record<string, number>
): string {
  const json = JSON.stringify(counts, null, 2);
  const block = `${START}\n\`\`\`json\n${json}\n\`\`\`\n${END}`;
  if (existing && existing.includes(START) && existing.includes(END)) {
    const start = existing.indexOf(START);
    const end = existing.indexOf(END) + END.length;
    return existing.slice(0, start) + block + existing.slice(end);
  }
  const preamble =
    '이 이슈는 블로그 포스트 조회수를 저장합니다. (자동 관리 — 직접 편집하지 마세요)';
  return `${existing ? existing + '\n\n' : preamble + '\n\n'}${block}`;
}

function extractBody(data: unknown): string {
  return typeof (data as { body?: unknown })?.body === 'string'
    ? ((data as { body: string }).body as string)
    : '';
}

// 읽기: 토큰이 있으면 "인증 읽기"를 먼저 시도한다.
// - 무인증 GitHub API 응답은 최대 ~60초 캐시되어, 쓰기 직후 읽으면 옛값이 나와
//   read-modify-write 증가가 유실된다. 인증 읽기는 신선한 값을 준다.
// - 토큰이 없거나 무효(401 등)면 무인증 읽기로 폴백한다. public repo라 무인증
//   읽기는 항상 200 → 조회수 "표시"는 토큰 유효성과 무관하게 동작한다.
async function readIssueBody(): Promise<string> {
  if (TOKEN) {
    try {
      const res = await fetch(ISSUE_URL, {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'Toris-Blog-Views'
        },
        cache: 'no-store'
      });
      if (res.ok) {
        return extractBody(await res.json());
      }
    } catch {
      // 인증 읽기 실패 → 아래 무인증 폴백
    }
  }

  const res = await fetch(ISSUE_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Toris-Blog-Views'
    },
    cache: 'no-store'
  });
  if (!res.ok) {
    throw new Error(`GitHub issue fetch failed: ${res.status}`);
  }
  return extractBody(await res.json());
}

// 쓰기: 토큰 필요. 성공 여부를 반환(실패해도 throw 하지 않음).
async function patchIssueBody(body: string): Promise<boolean> {
  if (!TOKEN) return false;
  try {
    const res = await fetch(ISSUE_URL, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Toris-Blog-Views'
      },
      body: JSON.stringify({ body })
    });
    if (!res.ok) {
      console.error(`GitHub issue patch failed: ${res.status}`);
    }
    return res.ok;
  } catch (error) {
    console.error('GitHub issue patch error:', error);
    return false;
  }
}

// 조회수 조회 — GET /api/post-views?postId=123 (토큰 불필요, 항상 동작)
export async function GET(request: NextRequest) {
  try {
    const postId = request.nextUrl.searchParams.get('postId');
    if (!isValidPostId(postId)) {
      return NextResponse.json(
        { success: false, error: 'postId가 필요합니다.' },
        { status: 400 }
      );
    }

    const body = await readIssueBody();
    const counts = parseCounts(body);
    return NextResponse.json({ success: true, count: counts[postId] ?? 0 });
  } catch (error) {
    console.error('Error fetching view count:', error);
    // 읽기 실패 시에도 UI가 0으로라도 뜨도록 count:0 을 준다
    return NextResponse.json({ success: false, count: 0 }, { status: 200 });
  }
}

// 조회수 증가 — POST /api/post-views { postId }
// 이슈 body를 (토큰 없이) 읽어 +1 한 뒤 토큰으로 PATCH. 쓰기 실패해도 500 없이
// 현재 저장된 값을 반환한다.
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => ({}));
    const postId = payload?.postId;
    if (!isValidPostId(postId)) {
      return NextResponse.json(
        { success: false, error: 'postId가 필요합니다.' },
        { status: 400 }
      );
    }

    const body = await readIssueBody();
    const counts = parseCounts(body);
    const current = counts[postId] ?? 0;
    const next = current + 1;
    counts[postId] = next;

    const persisted = await patchIssueBody(buildBody(body, counts));

    return NextResponse.json({
      success: true,
      // 저장에 성공했을 때만 증가값을 반환. 실패 시 현재값(비증가)을 반환해
      // "올라갔다가 되돌아가는" 깜빡임을 방지한다.
      count: persisted ? next : current,
      persisted
    });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    return NextResponse.json({ success: false, count: 0 }, { status: 200 });
  }
}
