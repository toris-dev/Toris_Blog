import { NextRequest, NextResponse } from 'next/server';

/**
 * 프로젝트 사전등록(waitlist) 접수 → GitHub Issue에 프로젝트별로 기록.
 *
 * 동작:
 *  - 프로젝트별로 이슈 하나를 find-or-create 한다(제목/마커로 식별).
 *    이미 있으면 이메일을 "댓글"로 추가하고, 없으면 새 이슈를 만든다.
 *  - 저장소는 기본적으로 블로그 레포(공개)지만, GITHUB_WAITLIST_REPO(owner/repo)로
 *    비공개 레포를 지정하면 이메일이 공개되지 않는다. (권장)
 *
 * 환경변수:
 *  - GITHUB_TOKEN            (issues 쓰기 권한, 필수)
 *  - GITHUB_WAITLIST_REPO    (선택, "owner/repo" — 기본 toris-dev/Toris_Blog)
 *
 * 실패해도 사용자에게는 친절한 메시지를 반환하고 500을 최소화한다.
 */

export const dynamic = 'force-dynamic';

const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_WAITLIST_REPO || 'toris-dev/Toris_Blog';
const API = `https://api.github.com/repos/${REPO}`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function gh(path: string, init?: RequestInit) {
  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Toris-Blog-Waitlist',
      ...(init?.headers || {})
    },
    cache: 'no-store'
  });
}

interface GhIssue {
  number: number;
  title: string;
  body?: string | null;
  pull_request?: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => ({}));
    const email = typeof payload?.email === 'string' ? payload.email.trim() : '';
    const slug = typeof payload?.slug === 'string' ? payload.slug.trim() : '';
    const projectName =
      typeof payload?.projectName === 'string' && payload.projectName.trim()
        ? payload.projectName.trim()
        : slug;

    if (!EMAIL_RE.test(email) || email.length > 200) {
      return NextResponse.json(
        { success: false, error: '유효한 이메일 주소를 입력해 주세요.' },
        { status: 400 }
      );
    }
    if (!slug || slug.length > 80 || !/^[a-z0-9-]+$/i.test(slug)) {
      return NextResponse.json(
        { success: false, error: '잘못된 요청입니다.' },
        { status: 400 }
      );
    }

    if (!TOKEN) {
      return NextResponse.json(
        {
          success: false,
          error:
            '사전등록 서버가 아직 설정되지 않았습니다. 잠시 후 다시 시도해 주세요.'
        },
        { status: 503 }
      );
    }

    const title = `📮 사전등록 · ${projectName}`;
    const marker = `<!--waitlist:${slug}-->`;
    const stamp = new Date().toISOString();

    // 1) 프로젝트별 이슈 찾기 (열린 이슈 중 마커/제목 일치, PR 제외)
    let issueNumber: number | null = null;
    const listRes = await gh(`/issues?state=open&per_page=100`);
    if (listRes.ok) {
      const issues = (await listRes.json()) as GhIssue[];
      if (Array.isArray(issues)) {
        const found = issues.find(
          (i) =>
            !i.pull_request &&
            (i.title === title ||
              (typeof i.body === 'string' && i.body.includes(marker)))
        );
        if (found) issueNumber = found.number;
      }
    }

    // 2) 없으면 새 이슈 생성
    if (issueNumber == null) {
      const body = [
        marker,
        '',
        `**${projectName}** 사전등록 명단입니다. (프로젝트 랜딩 폼에서 자동 접수)`,
        '',
        `- **${email}** · ${stamp}`
      ].join('\n');
      const createRes = await gh(`/issues`, {
        method: 'POST',
        body: JSON.stringify({ title, body })
      });
      if (!createRes.ok) {
        console.error(
          'waitlist issue create failed',
          createRes.status,
          await createRes.text()
        );
        return NextResponse.json(
          { success: false, error: '접수에 실패했습니다. 잠시 후 다시 시도해 주세요.' },
          { status: 502 }
        );
      }
      const created = await createRes.json();
      return NextResponse.json({
        success: true,
        message: '사전등록이 완료되었습니다!',
        url: created.html_url
      });
    }

    // 3) 있으면 댓글로 추가
    const commentRes = await gh(`/issues/${issueNumber}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        body: `사전등록 · **${email}**\n\n${stamp}`
      })
    });
    if (!commentRes.ok) {
      console.error(
        'waitlist comment failed',
        commentRes.status,
        await commentRes.text()
      );
      return NextResponse.json(
        { success: false, error: '접수에 실패했습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 502 }
      );
    }
    const comment = await commentRes.json();
    return NextResponse.json({
      success: true,
      message: '사전등록이 완료되었습니다!',
      url: comment.html_url
    });
  } catch (error) {
    console.error('waitlist error', error);
    return NextResponse.json(
      { success: false, error: '알 수 없는 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
