import { OWNER, REPO, USE_MOCK_DATA, getOctokit } from '@/utils/github';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const {
      title,
      body,
      slug,
      nickname,
      commentMode = 'anonymous'
    } = await request.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    if (commentMode === 'anonymous' && !nickname) {
      return NextResponse.json(
        { error: '닉네임을 입력해주세요' },
        { status: 400 }
      );
    }

    // 개발 환경에서 토큰이 없는 경우 가짜 응답 반환
    if (USE_MOCK_DATA) {
      console.log('[DEV MODE] 가짜 댓글 생성:', {
        title,
        body,
        slug,
        nickname,
        commentMode
      });
      return NextResponse.json({
        success: true,
        issueNumber: Math.floor(Math.random() * 1000),
        issueUrl: 'https://github.com/example/repo/issues/123'
      });
    }

    const octokit = getOctokit();

    // 마크다운 파일 정보 추가
    const commentBody = `**Markdown file**: ${slug}.md\n\n${body}`;

    // 댓글 모드에 따라 제목 다르게 구성
    const commentTitle =
      commentMode === 'anonymous'
        ? `Comment on: ${title} (by ${nickname})`
        : `Comment on: ${title} (via GitHub)`;

    // Octokit을 사용하여 GitHub issue 생성
    // 관리자의 토큰으로 이슈를 만들고, 실제 사용자 닉네임은 본문에 포함
    const response = await octokit.rest.issues.create({
      owner: OWNER,
      repo: REPO,
      title: commentTitle,
      body: commentBody,
      labels:
        commentMode === 'anonymous'
          ? ['comment', 'markdown-comment', 'anonymous']
          : ['comment', 'markdown-comment', 'github-user']
    });

    if (response.status !== 201) {
      console.error('GitHub API error:', response.data);
      return NextResponse.json(
        { error: 'Failed to create GitHub issue' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      issueNumber: response.data.number,
      issueUrl: response.data.html_url
    });
  } catch (error: any) {
    console.error('Error creating GitHub issue:', error);

    // 더 자세한 오류 메시지 제공
    const errorMessage = error.message || 'Failed to create GitHub issue';
    const statusCode = error.status || 500;
    const isAuthError =
      error.status === 401 || errorMessage.includes('Bad credentials');

    return NextResponse.json(
      {
        error: isAuthError
          ? '서버에 문제가 발생했습니다. 관리자에게 문의하세요.'
          : errorMessage
      },
      { status: statusCode }
    );
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');

  if (!slug) {
    return NextResponse.json(
      { error: 'Slug parameter is required' },
      { status: 400 }
    );
  }

  try {
    // 개발 환경에서 토큰이 없는 경우 가짜 데이터 반환
    if (USE_MOCK_DATA) {
      console.log('[DEV MODE] 가짜 댓글 데이터 반환:', { slug });
      return NextResponse.json({
        success: true,
        comments: [
          {
            id: 1,
            title: '테스트 댓글 (by 테스트 사용자)',
            body: '**테스트 사용자**님의 댓글:\n\n이것은 개발 환경에서 생성된 테스트 댓글입니다.',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            user: {
              login: 'toris-dev',
              avatar: 'https://avatars.githubusercontent.com/u/583231?v=4',
              url: 'https://github.com/toris-dev'
            },
            url: 'https://github.com/example/repo/issues/1'
          }
        ]
      });
    }

    const octokit = getOctokit();

    // 권장되는 최신 방식으로 검색 API 호출
    const response = await octokit.request('GET /search/issues', {
      q: `repo:${OWNER}/${REPO} is:issue in:body "Markdown file: ${slug}.md"`,
      per_page: 100
    });

    if (response.status !== 200) {
      console.error('GitHub API error:', response.data);
      return NextResponse.json(
        { error: 'Failed to search GitHub issues' },
        { status: 500 }
      );
    }

    // 댓글 형식 변환
    return NextResponse.json({
      success: true,
      comments: response.data.items.map((item: any) => {
        // 제목에서 모드 및 닉네임 추출 시도
        let nickname = '';
        let isAnonymous = true;

        const titleMatch = item.title.match(/\(by (.*?)\)$/);
        if (titleMatch && titleMatch[1]) {
          nickname = titleMatch[1];
        } else if (item.title.includes('(via GitHub)')) {
          nickname = 'GitHub 사용자';
          isAnonymous = false;
        }

        // body에서 닉네임 패턴 확인
        const bodyHasNicknamePattern = item.body.includes('**님의 댓글:');

        return {
          id: item.number,
          title: item.title,
          // 이미 본문에 닉네임 포맷이 있다면 그대로 사용
          body: bodyHasNicknamePattern
            ? item.body.replace(`**Markdown file**: ${slug}.md\n\n`, '')
            : nickname
              ? `**${nickname}**님의 댓글:\n\n${item.body.replace(`**Markdown file**: ${slug}.md\n\n`, '')}`
              : item.body.replace(`**Markdown file**: ${slug}.md\n\n`, ''),
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          user: {
            login: item.user.login,
            avatar: item.user.avatar_url,
            url: item.user.html_url
          },
          url: item.html_url,
          isAnonymous
        };
      })
    });
  } catch (error: any) {
    console.error('Error fetching GitHub issues:', error);

    // 더 자세한 오류 메시지 제공
    const errorMessage = error.message || 'Failed to fetch GitHub issues';
    const statusCode = error.status || 500;
    const isAuthError =
      error.status === 401 || errorMessage.includes('Bad credentials');

    return NextResponse.json(
      {
        error: isAuthError
          ? '서버에 문제가 발생했습니다. 관리자에게 문의하세요.'
          : errorMessage
      },
      { status: statusCode }
    );
  }
}
