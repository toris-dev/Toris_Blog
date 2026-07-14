/**
 * toris-contact-api — 정적 Astro 사이트와 분리 배포되는 폼 접수 API.
 *
 * 엔드포인트:
 *  - POST /contact  {name,email,message} → GitHub 이슈 #16에 코멘트 생성
 *  - POST /waitlist {slug,projectName,email} → 프로젝트별 이슈 find-or-create + 댓글
 *    (기존 Next.js src/app/api/waitlist/route.ts 로직 포팅)
 *
 * 시크릿: GITHUB_TOKEN (wrangler secret put GITHUB_TOKEN)
 * vars:   ALLOWED_ORIGIN (CORS 허용 오리진, 미설정 시 '*')
 */

interface Env {
  GITHUB_TOKEN: string;
  ALLOWED_ORIGIN?: string;
}

const REPO = 'toris-dev/Toris_Blog';
const API = `https://api.github.com/repos/${REPO}`;
const CONTACT_ISSUE = 16;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface GhIssue {
  number: number;
  title: string;
  body?: string | null;
  pull_request?: unknown;
}

function corsHeaders(env: Env): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN ?? '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function json(env: Env, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(env) }
  });
}

function gh(env: Env, path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      // GitHub API는 User-Agent 헤더 필수
      'User-Agent': 'Toris-Contact-API',
      ...(init?.headers as Record<string, string> | undefined)
    }
  });
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = (await request.json()) as unknown;
    return body && typeof body === 'object'
      ? (body as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** POST /contact — 이슈 #16에 상담 문의 코멘트 생성 */
async function handleContact(request: Request, env: Env): Promise<Response> {
  const payload = await readJson(request);
  const name = str(payload.name);
  const email = str(payload.email);
  const message = str(payload.message);

  if (!name || name.length > 100) {
    return json(env, { success: false, error: '이름을 입력해 주세요.' }, 400);
  }
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return json(
      env,
      { success: false, error: '유효한 이메일 주소를 입력해 주세요.' },
      400
    );
  }
  if (!message || message.length > 5000) {
    return json(env, { success: false, error: '문의 내용을 입력해 주세요.' }, 400);
  }

  const body = [
    '## 📮 새로운 상담 문의',
    '',
    `- **이름**: ${name}`,
    `- **이메일**: ${email}`,
    `- **접수 시각**: ${new Date().toISOString()}`,
    '',
    '### 문의 내용',
    '',
    message
  ].join('\n');

  const res = await gh(env, `/issues/${CONTACT_ISSUE}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body })
  });
  if (!res.ok) {
    console.error('contact comment failed', res.status, await res.text());
    return json(
      env,
      { success: false, error: '문의 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.' },
      502
    );
  }
  return json(env, { success: true });
}

/** POST /waitlist — 프로젝트별 사전등록 이슈 find-or-create + 댓글 */
async function handleWaitlist(request: Request, env: Env): Promise<Response> {
  const payload = await readJson(request);
  const email = str(payload.email);
  const slug = str(payload.slug);
  const projectName = str(payload.projectName) || slug;

  if (!EMAIL_RE.test(email) || email.length > 200) {
    return json(
      env,
      { success: false, error: '유효한 이메일 주소를 입력해 주세요.' },
      400
    );
  }
  if (!slug || slug.length > 80 || !/^[a-z0-9-]+$/i.test(slug)) {
    return json(env, { success: false, error: '잘못된 요청입니다.' }, 400);
  }

  const title = `📮 사전등록 · ${projectName}`;
  const marker = `<!--waitlist:${slug}-->`;
  const stamp = new Date().toISOString();

  // 1) 프로젝트별 이슈 찾기 (열린 이슈 중 마커/제목 일치, PR 제외)
  let issueNumber: number | null = null;
  const listRes = await gh(env, `/issues?state=open&per_page=100`);
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
    const createRes = await gh(env, `/issues`, {
      method: 'POST',
      body: JSON.stringify({ title, body })
    });
    if (!createRes.ok) {
      console.error(
        'waitlist issue create failed',
        createRes.status,
        await createRes.text()
      );
      return json(
        env,
        { success: false, error: '접수에 실패했습니다. 잠시 후 다시 시도해 주세요.' },
        502
      );
    }
    const created = (await createRes.json()) as { html_url?: string };
    return json(env, {
      success: true,
      message: '사전등록이 완료되었습니다!',
      url: created.html_url
    });
  }

  // 3) 있으면 댓글로 추가
  const commentRes = await gh(env, `/issues/${issueNumber}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body: `사전등록 · **${email}**\n\n${stamp}` })
  });
  if (!commentRes.ok) {
    console.error(
      'waitlist comment failed',
      commentRes.status,
      await commentRes.text()
    );
    return json(
      env,
      { success: false, error: '접수에 실패했습니다. 잠시 후 다시 시도해 주세요.' },
      502
    );
  }
  const comment = (await commentRes.json()) as { html_url?: string };
  return json(env, {
    success: true,
    message: '사전등록이 완료되었습니다!',
    url: comment.html_url
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS 프리플라이트
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: { ...corsHeaders(env), 'Access-Control-Max-Age': '86400' }
      });
    }

    const { pathname } = new URL(request.url);

    if (request.method === 'POST' && pathname === '/contact') {
      try {
        return await handleContact(request, env);
      } catch (error) {
        console.error('contact error', error);
        return json(
          env,
          { success: false, error: '알 수 없는 오류가 발생했습니다.' },
          500
        );
      }
    }

    if (request.method === 'POST' && pathname === '/waitlist') {
      try {
        return await handleWaitlist(request, env);
      } catch (error) {
        console.error('waitlist error', error);
        return json(
          env,
          { success: false, error: '알 수 없는 오류가 발생했습니다.' },
          500
        );
      }
    }

    return json(env, { success: false, error: 'Not Found' }, 404);
  }
};
