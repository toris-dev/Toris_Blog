export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app';
}

export const SITE = {
  name: 'Toris Blog',
  alternateName: 'toris-dev',
  description:
    '풀스택 웹 개발자 토리스의 기술 블로그입니다. React, Next.js, TypeScript, Node.js 등 웹 개발 기술과 프로젝트 경험을 공유합니다.',
  inLanguage: 'ko-KR',
  license: 'https://creativecommons.org/licenses/by/4.0/',
  imagePath: '/images/og-image.png',
  person: {
    name: '토리스',
    givenName: '토리스',
    alternateName: 'Toris',
    image: 'https://github.com/toris-dev.png',
    jobTitle: 'Full Stack Developer',
    description:
      '풀스택 웹 개발자로 React, Next.js, TypeScript, Node.js를 주로 사용합니다.',
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
      'Backend Development'
    ]
  },
  // publisher용 Organization. BlogPosting의 publisher는 Person이 아니라
  // logo를 가진 Organization이어야 Rich Results 'publisher logo' 경고가 없다.
  organization: {
    name: 'Toris Blog',
    alternateName: 'toris-dev',
    logoPath: '/images/og-image.png',
    logoWidth: 1200,
    logoHeight: 630,
    sameAs: ['https://github.com/toris-dev', 'https://x.com/TorisDev']
  },
  blog: {
    name: 'Toris Blog',
    description: '웹 개발 기술과 프로젝트 경험을 공유하는 기술 블로그',
    path: '/posts'
  }
} as const;

export function getNodeIds(baseUrl: string) {
  return {
    website: `${baseUrl}/#website`,
    person: `${baseUrl}/#person`,
    organization: `${baseUrl}/#organization`,
    blog: `${baseUrl}/posts#blog`
  } as const;
}

export function absoluteUrl(baseUrl: string, path: string): string {
  if (path.startsWith('http')) return path;
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}
