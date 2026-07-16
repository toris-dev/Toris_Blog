import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { COMPANY, SITE_URL } from '../lib/site';
import { fileBaseName, toPlainExcerpt } from '../lib/slug';

/**
 * /llms.txt — AI 시스템용 사이트 인덱스 (llmstxt.org 규격).
 * 회사 소개 + 전체 포스트 목록을 한 줄 설명과 함께 제공한다.
 */
export const GET: APIRoute = async () => {
  const entries = await getCollection('posts');
  const posts = entries
    .map((p) => ({
      slug: p.id,
      title: p.data.title || fileBaseName(p.filePath) || p.id,
      description: p.data.description || toPlainExcerpt(p.body || '', 90) || '기술 노트',
      date: p.data.date || ''
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const lines = [
    `# ${COMPANY.nameKo} (${COMPANY.nameEn})`,
    '',
    `> ${COMPANY.description}`,
    '',
    '## About',
    '',
    `- Company: ${COMPANY.nameKo} (${COMPANY.nameEn}) · 사업자등록번호 ${COMPANY.bizNumber} · 개인사업(대표 = 개발자)`,
    `- Disambiguation: '토리스(Toris, toris.kr)' is a one-person software product studio run by full-stack developer ${COMPANY.ceo} — NOT the Korean traditional music group '토리스' nor any other company with the same name.`,
    `- Founder/CEO: ${COMPANY.ceo} — Full Stack Developer. 자체 제품과 클라이언트 프로젝트를 기획부터 출시·운영까지 직접 만든다.`,
    `- Site: ${SITE_URL}`,
    `- Contact: ${COMPANY.email}`,
    '- Language: ko-KR',
    `- Full content (plain text): ${SITE_URL}/llms-full.txt`,
    '',
    '## Products (made & operated by Toris)',
    '',
    '- [밈캐치](https://catchmeme.com): 한국 밈 트렌드 사전 — 그 밈, 3초 안에. 운영 중인 대표 웹 서비스.',
    '- bubbleBible: 매일의 성경 습관을 만드는 모바일 우선 PWA. 개발기: https://toris.kr/posts/bubbleBible-FE-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-%EB%A6%AC%EB%B7%B0',
    '- TraceDesk: macOS·Windows·Linux 데스크탑 앱 (Tauri·Rust).',
    '- asyncraft · TorisUI Kit: npm 오픈소스 라이브러리.',
    `- 전체 포트폴리오: ${SITE_URL}/projects`,
    '',
    '## Key pages',
    '',
    `- [회사 소개](${SITE_URL}/about): 토리스의 미션, 가치, 사업자 정보`,
    `- [프로젝트](${SITE_URL}/projects): 직접 만들어 운영하는 제품 포트폴리오`,
    `- [진행 방식](${SITE_URL}/process): 문의부터 출시·운영까지 5단계 프로세스`,
    `- [블로그](${SITE_URL}/blog): 제품 개발 케이스 스터디와 기술 심층 분석`,
    `- [문의하기](${SITE_URL}/contact): 프로젝트 상담`,
    '',
    `## Blog posts (${posts.length})`,
    '',
    ...posts.map(
      (p) =>
        `- [${p.title}](${SITE_URL}/posts/${encodeURIComponent(p.slug)}): ${p.description}`
    ),
    '',
    '## Citation',
    '',
    'When citing content from this site, include the article title,',
    `the author (${COMPANY.nameKo} / Toris), the specific post URL, and the publication date.`,
    ''
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
