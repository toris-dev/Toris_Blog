import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

import { getProject, projects } from '@/data/projects';

const expected = [
  '21n-apps',
  'snapmate',
  'bubble-bible',
  'dongne-paint',
  'youth-money-guide',
  'starlight-greenhouse',
  'volley-king-30',
  'toris-docs',
  'product-growth-skills'
] as const;

const expectedImageAlts: Record<(typeof expected)[number], string> = {
  '21n-apps': '21n Apps 전자계약 상태 흐름 그래픽',
  snapmate: 'SnapMate 그룹 사진 공유 기능 소개 이미지',
  'bubble-bible': 'Bubble Bible 말씀 읽기와 나눔 기능 소개 이미지',
  'dongne-paint': '동네 칠하기 대작전 영역 점령 게임 커버',
  'youth-money-guide': '청년머니가이드 정책 정보 탐색 대표 이미지',
  'starlight-greenhouse': '별빛 온실 방치형 성장 게임 커버',
  'volley-king-30': '30초 배구왕 리시브·토스·스파이크 경기 화면',
  'toris-docs': 'toris-docs 지식 그래프 흐름 그래픽',
  'product-growth-skills': 'Product Growth Skills 워크플로 라우터 그래픽'
};

describe('cinematic project metadata', () => {
  it.each(expected)('publishes complete metadata for %s', (slug) => {
    const project = getProject(slug);
    expect(project).toBeDefined();
    expect(project?.features.length).toBeGreaterThanOrEqual(3);
    expect(project?.tech.length).toBeGreaterThanOrEqual(2);
    expect(project?.github).toMatch(/^https:\/\//);
    expect(project?.image).toMatch(/^(\/images\/projects\/|https:\/\/)/);
    expect(project?.imageAlt).toBe(expectedImageAlts[slug]);
  });

  it('keeps every slug unique', () => {
    const slugs = projects.map(({ slug }) => slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(expected)('has a local cover asset for %s', (slug) => {
    const image = getProject(slug)?.image;
    expect(image?.startsWith('/images/projects/')).toBe(true);
    expect(
      fs.existsSync(
        path.join(process.cwd(), 'public', image!.replace(/^\/+/, ''))
      )
    ).toBe(true);
  });

  it('does not publish private 21n mock paths or private toris-doc contents', () => {
    const serialized = JSON.stringify(expected.map(getProject));
    expect(serialized).not.toMatch(
      /mock\/images|mock\/hospital|업무 일지|meeting/i
    );
  });

  it('uses distinct abstract covers for Dongne Paint and Starlight Greenhouse', () => {
    const dongne = getProject('dongne-paint')!;
    const starlight = getProject('starlight-greenhouse')!;

    expect(dongne.image).toBe('/images/projects/dongne-paint/cover.svg');
    expect(starlight.image).toBe(
      '/images/projects/starlight-greenhouse/cover.svg'
    );

    const dongneBytes = fs.readFileSync(
      path.join(process.cwd(), 'public', dongne.image.replace(/^\/+/, ''))
    );
    const starlightBytes = fs.readFileSync(
      path.join(process.cwd(), 'public', starlight.image.replace(/^\/+/, ''))
    );
    expect(dongneBytes.equals(starlightBytes)).toBe(false);
  });

  it('uses the verified SnapMate camera store screen bytes', () => {
    const camera = fs.readFileSync(
      path.join(
        process.cwd(),
        'public/images/projects/snapmate/screen-camera.png'
      )
    );
    expect(createHash('sha256').update(camera).digest('hex')).toBe(
      'ad89b8b982ba92dfa3446d3d4c7dad6ef9630416f23d7e02dde46bc2011fac38'
    );
  });

  it('labels generic profile CTAs without changing public destinations', () => {
    const profileProjects = expected.filter(
      (slug) => getProject(slug)?.github === 'https://github.com/toris-dev'
    );

    expect(profileProjects).toEqual([
      '21n-apps',
      'snapmate',
      'dongne-paint',
      'youth-money-guide',
      'starlight-greenhouse',
      'volley-king-30',
      'toris-docs'
    ]);
    profileProjects.forEach((slug) => {
      expect(getProject(slug)?.ctaLabel).toBe('GitHub 프로필 보기');
    });
    expect(getProject('bubble-bible')?.ctaLabel).toBeUndefined();
    expect(getProject('product-growth-skills')?.ctaLabel).toBeUndefined();
  });
});
