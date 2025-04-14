import { NextRequest, NextResponse } from 'next/server';

// GitHub API 설정
const REPO_OWNER = 'toris-dev';
const REPO_NAME = 'Toris_Blog';
const ISSUE_NUMBER = 17; // 방문록 이슈 번호
const GITHUB_API = 'https://api.github.com';

export async function GET() {
  try {
    // GitHub API로 이슈의 댓글 가져오기
    const commentsUrl = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${ISSUE_NUMBER}/comments`;

    const response = await fetch(commentsUrl, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Toris-Blog'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`GitHub API 오류: ${response.status}`);
    }

    // 댓글 데이터 처리
    const comments = await response.json();

    // 첫 번째 댓글은 이슈 설명이므로 제외 (필요시)
    const guestComments = comments;

    return NextResponse.json(guestComments);
  } catch (error) {
    console.error('방문록 조회 오류:', error);
    return NextResponse.json(
      { message: '방문록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 환경 변수에서 GitHub 토큰 가져오기
    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubToken) {
      return NextResponse.json(
        {
          message: 'GitHub 토큰이 설정되지 않았습니다. 관리자에게 문의하세요.'
        },
        { status: 500 }
      );
    }

    // 요청 본문 파싱
    const { body, user_id } = await request.json();

    if (!body || body.trim() === '') {
      return NextResponse.json(
        { message: '방문록 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!user_id || user_id.trim() === '') {
      return NextResponse.json(
        { message: '닉네임을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 방문록 내용 형식 구성
    const commentBody = `**${user_id}님의 방문록**\n\n${body}`;

    // GitHub API로 댓글 작성
    const commentsUrl = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${ISSUE_NUMBER}/comments`;

    const response = await fetch(commentsUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `token ${githubToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Toris-Blog'
      },
      body: JSON.stringify({ body: commentBody })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('GitHub API 오류:', errorData);
      throw new Error('GitHub API 오류: 방문록 작성에 실패했습니다.');
    }

    const comment = await response.json();
    return NextResponse.json(comment);
  } catch (error) {
    console.error('방문록 작성 오류:', error);
    return NextResponse.json(
      { message: '방문록 작성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
