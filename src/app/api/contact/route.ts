import { OWNER, REPO, getOctokit } from '@/utils/github';
import { NextRequest, NextResponse } from 'next/server';

// GitHub 이슈 번호 (Toris_Blog 레포지토리의 Contact 이슈)
const CONTACT_ISSUE_NUMBER = 16;

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      );
    }

    // GitHub API를 사용하여 이슈에 댓글 추가
    const octokit = getOctokit();

    // 댓글 내용 구성
    const commentBody = `
## 문의 내용

**이름**: ${name}
**이메일**: ${email}
**문의 유형**: ${subject}

### 메시지
${message}

---
*이 댓글은 블로그 Contact 폼에서 자동으로 생성되었습니다.*
`;

    // 실제 GitHub 이슈에 댓글 추가
    const response = await octokit.rest.issues.createComment({
      owner: OWNER,
      repo: REPO,
      issue_number: CONTACT_ISSUE_NUMBER,
      body: commentBody
    });

    if (response.status !== 201) {
      throw new Error('GitHub API 오류: 댓글을 생성할 수 없습니다');
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      commentUrl: response.data.html_url
    });
  } catch (error: any) {
    console.error('GitHub 이슈 댓글 생성 오류:', error);

    // 오류 응답
    return NextResponse.json(
      {
        error: '메시지 전송에 실패했습니다',
        details: error.message
      },
      { status: 500 }
    );
  }
}
