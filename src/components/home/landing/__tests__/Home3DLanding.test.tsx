import { render, screen } from '@testing-library/react';
import Home3DLanding from '../Home3DLanding';
import type { Home3DLandingData } from '../types';

jest.mock('@/components/studio/StudioLanding', () => ({
  __esModule: true,
  default: ({ projectCount }: { projectCount: number }) => (
    <section aria-label="TORIS 사업자 랜딩">{projectCount} projects</section>
  )
}));

const data: Home3DLandingData = {
  postCount: 52,
  categoryCount: 0,
  tagCount: 0,
  projectCount: 25,
  featuredPosts: [],
  categories: [],
  topTags: []
};

it('renders the business landing while preserving project evidence', () => {
  render(<Home3DLanding data={data} />);

  expect(
    screen.getByRole('region', { name: 'TORIS 사업자 랜딩' })
  ).toHaveTextContent('25 projects');
  expect(screen.queryByText('Toris Dev Universe')).not.toBeInTheDocument();
});
