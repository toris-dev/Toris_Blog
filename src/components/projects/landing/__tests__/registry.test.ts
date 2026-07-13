import { LANDINGS } from '@/components/projects/landing';
import { githubRepositories } from '@/data/githubRepositories';
import { projects } from '@/data/projects';

it('has one dedicated landing for every project record', () => {
  expect(Object.keys(LANDINGS).sort()).toEqual(
    projects.map(({ slug }) => slug).sort()
  );
});

it('lists Product Growth Skills in the public repository atlas', () => {
  expect(githubRepositories).toContainEqual(
    expect.objectContaining({
      repo: 'product-growth-skills',
      kind: 'Open source'
    })
  );
});
