/* eslint-disable react/display-name -- concise JSX factories keep scene mocks focused */
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import Home3DLanding from '../Home3DLanding';
import type { Home3DLandingData } from '../types';

jest.mock('../scenes/HeroScene', () => () => <div>Hero scene</div>);
jest.mock('../scenes/KnowledgeStatsScene', () => () => (
  <div>Knowledge scene</div>
));
jest.mock('../scenes/DeveloperIdentityScene', () => () => (
  <section data-testid="developer-identity">
    제품의 처음과 끝을 연결하는 개발자
  </section>
));
jest.mock('../scenes/ProjectShowcaseScene', () => () => (
  <div>Projects scene</div>
));
jest.mock('../scenes/TechOrbitScene', () => () => <div>Tech scene</div>);
jest.mock('../scenes/FinalCtaScene', () => () => <div>CTA scene</div>);
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: ComponentProps<'div'>) => (
      <div {...props}>{children}</div>
    )
  },
  useReducedMotion: () => true
}));

const data: Home3DLandingData = {
  postCount: 0,
  categoryCount: 0,
  tagCount: 0,
  projectCount: 25,
  featuredPosts: [],
  categories: [],
  topTags: []
};

it('renders Developer Identity between Knowledge and Projects without legacy career copy', () => {
  render(<Home3DLanding data={data} />);

  const text = document.body.textContent ?? '';
  expect(screen.getByTestId('developer-identity')).toBeInTheDocument();
  expect(text.indexOf('Knowledge scene')).toBeLessThan(
    text.indexOf('제품의 처음과 끝을 연결하는 개발자')
  );
  expect(text.indexOf('제품의 처음과 끝을 연결하는 개발자')).toBeLessThan(
    text.indexOf('Projects scene')
  );
  expect(screen.queryByText(/Full-Stack\s+Work/)).not.toBeInTheDocument();
  expect(screen.queryByText(/21앤 \(21n\)/)).not.toBeInTheDocument();
  expect(screen.queryByText(/B2B2C 병원 시술/)).not.toBeInTheDocument();
});
