import { existsSync } from 'node:fs';
import path from 'node:path';
import PostsPage, { metadata } from '@/app/posts/page';

const redirectMock = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: (href: string) => redirectMock(href)
}));

describe('/posts compatibility route', () => {
  beforeEach(() => redirectMock.mockClear());

  it('redirects only the listing route to the branded blog entry', () => {
    PostsPage();

    expect(redirectMock).toHaveBeenCalledWith('/blog');
    expect(metadata.alternates?.canonical).toContain('/blog');
    expect(
      existsSync(path.join(process.cwd(), 'src/app/posts/[id]/page.tsx'))
    ).toBe(true);
  });
});
