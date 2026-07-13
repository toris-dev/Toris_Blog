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

describe('cinematic project metadata', () => {
  it.each(expected)('publishes complete metadata for %s', (slug) => {
    const project = getProject(slug);
    expect(project).toBeDefined();
    expect(project?.features.length).toBeGreaterThanOrEqual(3);
    expect(project?.tech.length).toBeGreaterThanOrEqual(2);
    expect(project?.github).toMatch(/^https:\/\//);
    expect(project?.image).toMatch(/^(\/images\/projects\/|https:\/\/)/);
  });

  it('keeps every slug unique', () => {
    const slugs = projects.map(({ slug }) => slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('does not publish private 21n mock paths or private toris-doc contents', () => {
    const serialized = JSON.stringify(expected.map(getProject));
    expect(serialized).not.toMatch(/mock\/images|mock\/hospital|업무 일지|meeting/i);
  });
});
