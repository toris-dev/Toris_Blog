'use server';

import { revalidatePath } from 'next/cache';

export interface ContactFormData {
  name: string;
  email: string;
  projectType: string;
  budgetRange: string;
  timeline: string;
  requiredFeatures: string;
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
    if (
      !formData.name?.trim() ||
      !formData.email?.trim() ||
      !formData.projectType?.trim() ||
      !formData.budgetRange?.trim() ||
      !formData.timeline?.trim() ||
      !formData.requiredFeatures?.trim()
    ) {
      return {
        success: false,
        message: '필수 상담 정보를 모두 입력해 주세요.',
        error: 'Validation error'
      };
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      return {
        success: false,
        message: '회신 가능한 이메일 주소를 입력해 주세요.',
        error: 'Invalid email'
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
    const commentBody = `## 새로운 프로젝트 상담

**이름:** ${formData.name}
**이메일:** ${formData.email}
**개발 유형:** ${formData.projectType}
**예산 범위:** ${formData.budgetRange}
**희망 일정:** ${formData.timeline}

### 필요한 기능
${formData.requiredFeatures}

### 현재 상황과 참고 사항
${formData.message || '별도 참고 사항 없음'}

---
*이 댓글은 TORIS /contact 프로젝트 상담 양식을 통해 생성되었습니다.*`;

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
      message: '상담 요청을 받았습니다. 영업일 기준 1–2일 내 회신드리겠습니다.',
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
