import { Octokit } from 'octokit';

export const OWNER = 'toris-dev';
export const REPO = 'obsidian_note';

// 개발 환경에서는 가짜 데이터 사용 여부
export const USE_MOCK_DATA =
  process.env.NODE_ENV === 'development' && !process.env.GITHUB_TOKEN;

// GitHub 토큰으로 Octokit 인스턴스 생성
export function getOctokit(): Octokit | null {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'GITHUB_TOKEN 환경 변수가 설정되지 않았습니다. 개발 환경에서는 목업 데이터를 사용합니다.'
      );
    } else {
      console.error('GITHUB_TOKEN 환경 변수가 설정되지 않았습니다.');
    }
    return null;
  }

  return new Octokit({ auth: token });
}

// GitHub API 호출 헬퍼 함수
export async function fetchFromGitHub<T>(
  apiCall: (octokit: Octokit) => Promise<T>,
  fallback: T
): Promise<T> {
  if (USE_MOCK_DATA) {
    return fallback;
  }

  const octokit = getOctokit();
  if (!octokit) {
    return fallback;
  }

  try {
    return await apiCall(octokit);
  } catch (error) {
    console.error('GitHub API 호출 실패:', error);
    return fallback;
  }
}
