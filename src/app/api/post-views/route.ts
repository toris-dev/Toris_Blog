import { NextRequest, NextResponse } from 'next/server';

/**
 * 조회수 저장소 = 외부 DB 없이 GitHub Issue 하나를 사용한다.
 * (프로젝트가 이미 contact 폼에서 GitHub Issue를 백엔드로 쓰는 것과 동일한 방식)
 *
 * 지정한 Issue의 body 안, 마커 사이에 JSON `{ "<postId>": <count> }` 를 저장하고
 * 조회(GET)/증가(POST) 시 이 body를 읽고 갱신한다.
 *
 * 필요한 환경변수:
 *  - GITHUB_TOKEN                (repo 쓰기 권한, 이미 contact에서 사용 중)
 *  - GITHUB_VIEWS_ISSUE_NUMBER   (조회수 저장용 이슈 번호)
 */

export const dynamic = 'force-dynamic';

const OWNER = 'toris-dev';
const REPO = 'Toris_Blog';
const TOKEN = process.env.GITHUB_TOKEN;
const ISSUE = process.env.GITHUB_VIEWS_ISSUE_NUMBER;

const START = '<!--VIEW_COUNTS_START-->';
const END = '<!--VIEW_COUNTS_END-->';

function ghHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'Toris-Blog-Views'
  };
}

function isValidPostId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0 && id.length <= 200;
}

function isConfigured(): boolean {
  return Boolean(TOKEN && ISSUE);
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

async function fetchIssueBody(): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/issues/${ISSUE}`,
    { headers: ghHeaders(), cache: 'no-store' }
  );
  if (!res.ok) {
    throw new Error(`GitHub issue fetch failed: ${res.status}`);
  }
  const data = await res.json();
  return typeof data?.body === 'string' ? data.body : '';
}

async function patchIssueBody(body: string): Promise<void> {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/issues/${ISSUE}`,
    { method: 'PATCH', headers: ghHeaders(), body: JSON.stringify({ body }) }
  );
  if (!res.ok) {
    throw new Error(`GitHub issue patch failed: ${res.status}`);
  }
}

// 조회수 조회 — GET /api/post-views?postId=123
export async function GET(request: NextRequest) {
  try {
    const postId = request.nextUrl.searchParams.get('postId');
    if (!isValidPostId(postId)) {
      return NextResponse.json(
        { success: false, error: 'postId가 필요합니다.' },
        { status: 400 }
      );
    }
    if (!isConfigured()) {
      return NextResponse.json(
        { success: false, error: '조회수 저장소가 구성되지 않았습니다.' },
        { status: 503 }
      );
    }

    const body = await fetchIssueBody();
    const counts = parseCounts(body);
    return NextResponse.json({ success: true, count: counts[postId] ?? 0 });
  } catch (error) {
    console.error('Error fetching view count:', error);
    return NextResponse.json(
      { success: false, error: '조회수를 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}

// 조회수 증가 — POST /api/post-views { postId }
// 이슈 body를 읽어 해당 postId를 +1 한 뒤 다시 써넣는다 (read-modify-write).
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
    if (!isConfigured()) {
      return NextResponse.json(
        { success: false, error: '조회수 저장소가 구성되지 않았습니다.' },
        { status: 503 }
      );
    }

    const body = await fetchIssueBody();
    const counts = parseCounts(body);
    const next = (counts[postId] ?? 0) + 1;
    counts[postId] = next;
    await patchIssueBody(buildBody(body, counts));

    return NextResponse.json({ success: true, count: next });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    return NextResponse.json(
      { success: false, error: '조회수 증가에 실패했습니다.' },
      { status: 500 }
    );
  }
}
