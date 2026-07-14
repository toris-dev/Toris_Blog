export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app';
}

export const SITE = {
  name: 'TORIS',
  alternateName: 'Toris Studio',
  description:
    '아이디어 검증부터 출시와 운영까지 앱·웹·데스크톱 제품을 설계하고 개발하는 독립 제품 스튜디오입니다.',
  inLanguage: 'ko-KR',
  license: 'https://creativecommons.org/licenses/by/4.0/',
  imagePath: '/images/og-image.png',
  person: {
    name: '토리스',
    givenName: '토리스',
    alternateName: 'Toris',
    image: 'https://github.com/toris-dev.png',
    jobTitle: 'Product Full-Stack Developer',
    description:
      '앱·웹·데스크톱 제품을 기획부터 배포와 운영까지 연결하는 풀스택 개발자입니다.',
    sameAs: [
      'https://github.com/toris-dev',
      'https://www.linkedin.com/in/joohwan-yu',
      'https://x.com/TorisDev',
      'https://discord.com/users/516088509891870760'
    ],
    knowsAbout: [
      'Web Development',
      'React',
      'Next.js',
      'TypeScript',
      'JavaScript',
      'Node.js',
      'Frontend Development',
      'Backend Development',
      'Mobile App Development',
      'Desktop App Development'
    ]
  },
  // publisher용 Organization. BlogPosting의 publisher는 Person이 아니라
  // logo를 가진 Organization이어야 Rich Results 'publisher logo' 경고가 없다.
  organization: {
    name: 'TORIS',
    alternateName: 'Toris Studio',
    logoPath: '/brand/toris-app-icon-v3.svg',
    logoWidth: 256,
    logoHeight: 256,
    sameAs: ['https://github.com/toris-dev', 'https://x.com/TorisDev']
  },
  blog: {
    name: 'Toris Blog',
    description: '웹 개발 기술과 프로젝트 경험을 공유하는 기술 블로그',
    path: '/blog'
  }
} as const;

export function getNodeIds(baseUrl: string) {
  return {
    website: `${baseUrl}/#website`,
    person: `${baseUrl}/#person`,
    organization: `${baseUrl}/#organization`,
    blog: `${baseUrl}/blog#blog`
  } as const;
}

export function absoluteUrl(baseUrl: string, path: string): string {
  if (path.startsWith('http')) return path;
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}
