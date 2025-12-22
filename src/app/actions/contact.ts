'use server';

import { revalidatePath } from 'next/cache';

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface ContactActionResult {
  success: boolean;
  message: string;
  commentUrl?: string;
  error?: string;
}

export async function submitContactForm(
  formData: ContactFormData
): Promise<ContactActionResult> {
  try {
    // 입력 검증
    if (!formData.name || !formData.email || !formData.message) {
      return {
        success: false,
        message: '이름, 이메일, 메시지는 필수 항목입니다.',
        error: 'Validation error'
      };
    }

    // GitHub API에 댓글 생성
    const githubToken = process.env.GITHUB_TOKEN;
    const repoOwner = 'toris-dev';
    const repoName = 'Toris_Blog';
    const issueNumber = 16;

    if (!githubToken) {
      console.error('GitHub token not configured');
      return {
        success: false,
        message: '서버 설정 오류가 발생했습니다.',
        error: 'Server configuration error'
      };
    }

    // 댓글 내용 포맷팅
    const commentBody = `## 새로운 문의

**이름:** ${formData.name}  
**이메일:** ${formData.email}  
**메시지:**  
${formData.message}

---
*이 댓글은 블로그 /contact 페이지를 통해 사용자가 직접 생성한 문의 내용입니다.*`;

    // GitHub API 호출 (캐싱 없음 - POST 요청이므로)
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
        }),
        // POST 요청이므로 캐싱하지 않음
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('GitHub API error:', response.status, errorData);
      return {
        success: false,
        message: '메시지 전송에 실패했습니다.',
        error: 'Failed to send message'
      };
    }

    const result = await response.json();

    // 성공 시 관련 경로 재검증 (필요한 경우)
    revalidatePath('/contact');

    return {
      success: true,
      message: '메시지가 성공적으로 전송되었습니다!',
      commentUrl: result.html_url
    };
  } catch (error) {
    console.error('Error sending contact form:', error);
    return {
      success: false,
      message: '예상치 못한 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
