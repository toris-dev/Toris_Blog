import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, email, message } = await request.json();

    // 입력 검증
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // GitHub API에 댓글 생성
    const githubToken = process.env.GITHUB_TOKEN;
    const repoOwner = 'toris-dev';
    const repoName = 'Toris_Blog';
    const issueNumber = 16;

    if (!githubToken) {
      console.error('GitHub token not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // 댓글 내용 포맷팅
    const commentBody = `## 새로운 문의

**이름:** ${name}  
**이메일:** ${email}  
**메시지:**  
${message}

---
*이 댓글은 블로그 연락 폼을 통해 자동으로 생성되었습니다.*`;

    // GitHub API 호출
    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/issues/${issueNumber}/comments`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Toris-Blog-Contact-Form'
        },
        body: JSON.stringify({
          body: commentBody
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('GitHub API error:', response.status, errorData);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log('Comment created:', result.html_url);

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully!',
      commentUrl: result.html_url
    });
  } catch (error) {
    console.error('Error sending contact form:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
