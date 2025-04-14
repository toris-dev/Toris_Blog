import { Octokit } from 'octokit';

export const OWNER = 'toris-dev';
export const REPO = 'Toris_Blog';

// 개발 환경에서는 가짜 데이터 사용 여부
export const USE_MOCK_DATA =
  process.env.NODE_ENV === 'development' && !process.env.GITHUB_TOKEN;

// GitHub 토큰으로 Octokit 인스턴스 생성
export function getOctokit() {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.error('GITHUB_TOKEN 환경 변수가 설정되지 않았습니다.');
  }

  return new Octokit({
    auth: token
  });
}
