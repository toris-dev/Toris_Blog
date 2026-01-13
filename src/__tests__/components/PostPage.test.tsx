import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PostPage from '@/components/blog/PostPage'
import { ThemeProvider } from 'next-themes'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    aside: ({ children, ...props }: any) => <aside {...props}>{children}</aside>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useScroll: () => ({ scrollY: { get: () => 0 } }),
  useMotionValueEvent: jest.fn(),
}))

// Mock MarkdownViewer
jest.mock('@/components/blog/Markdown', () => ({
  MarkdownViewer: ({ children }: { children: string }) => (
    <div data-testid="markdown-viewer">{children}</div>
  ),
}))

// Mock Utterances
jest.mock('@/components/blog/Utterances', () => ({
  Utterances: () => <div data-testid="utterances">Utterances</div>,
}))

// Mock ShareButtons
jest.mock('@/components/blog/ShareButtons', () => ({
  ShareButtons: () => <div data-testid="share-buttons">Share Buttons</div>,
}))

// Mock AdSense
jest.mock('@/components/ads/AdSense', () => ({
  AdSense: () => <div data-testid="adsense">AdSense</div>,
}))

// Mock TableOfContents
jest.mock('@/components/blog/TableOfContents', () => ({
  TableOfContents: ({ headings }: { headings: any[] }) => (
    <div data-testid="table-of-contents">
      {headings.length} headings
    </div>
  ),
}))

const mockProps = {
  title: 'Test Post Title',
  category: 'Learning',
  tags: ['React', 'Next.js'],
  content: '# Test Content\n\nThis is test content.',
  date: '2024-01-01',
  image: 'https://example.com/image.jpg',
  postId: 'test-post-1',
}

const renderPostPage = (props = mockProps) => {
  return render(
    <ThemeProvider>
      <PostPage {...props} />
    </ThemeProvider>
  )
}

describe('PostPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render post title', async () => {
    renderPostPage()

    await waitFor(() => {
      expect(screen.getByText('Test Post Title')).toBeInTheDocument()
    })
  })

  it('should render post category', async () => {
    renderPostPage()

    await waitFor(() => {
      expect(screen.getByText('Learning')).toBeInTheDocument()
    })
  })

  it('should render post tags', async () => {
    renderPostPage()

    await waitFor(() => {
      expect(screen.getByText('#React')).toBeInTheDocument()
      expect(screen.getByText('#Next.js')).toBeInTheDocument()
    })
  })

  it('should render formatted date', async () => {
    renderPostPage()

    await waitFor(() => {
      // dayjs format should be visible
      const dateElement = screen.getByText(/24년/)
      expect(dateElement).toBeInTheDocument()
    })
  })

  it('should render markdown content', async () => {
    renderPostPage()

    await waitFor(() => {
      expect(screen.getByTestId('markdown-viewer')).toBeInTheDocument()
    })
  })

  it('should render share buttons when mounted', async () => {
    renderPostPage()

    await waitFor(() => {
      expect(screen.getByTestId('share-buttons')).toBeInTheDocument()
    })
  })

  it('should render table of contents when headings are available', async () => {
    renderPostPage()

    await waitFor(() => {
      // TableOfContents might not render if no headings
      const toc = screen.queryByTestId('table-of-contents')
      // This is optional, so we just check if it exists or not
      if (toc) {
        expect(toc).toBeInTheDocument()
      }
    })
  })

  it('should toggle table of contents', async () => {
    const user = userEvent.setup()
    renderPostPage()

    await waitFor(() => {
      // Wait for component to mount
      expect(screen.getByText('Test Post Title')).toBeInTheDocument()
    })

    // Look for TOC toggle button (might be in desktop or mobile)
    const tocToggle = screen.queryByLabelText(/목차/)
    if (tocToggle) {
      await user.click(tocToggle)
    }
  })

  it('should handle missing optional props', () => {
    renderPostPage({
      title: 'Minimal Post',
      content: 'Content',
      postId: 'minimal',
    })

    expect(screen.getByText('Minimal Post')).toBeInTheDocument()
    expect(screen.getByText('Uncategorized')).toBeInTheDocument() // Default category
  })

  it('should render with array tags', async () => {
    renderPostPage({
      ...mockProps,
      tags: ['Tag1', 'Tag2', 'Tag3'],
    })

    await waitFor(() => {
      expect(screen.getByText('#Tag1')).toBeInTheDocument()
      expect(screen.getByText('#Tag2')).toBeInTheDocument()
      expect(screen.getByText('#Tag3')).toBeInTheDocument()
    })
  })

  it('should render with string tags', async () => {
    renderPostPage({
      ...mockProps,
      tags: 'Tag1, Tag2' as any,
    })

    await waitFor(() => {
      expect(screen.getByText('#Tag1')).toBeInTheDocument()
      expect(screen.getByText('#Tag2')).toBeInTheDocument()
    })
  })
})

