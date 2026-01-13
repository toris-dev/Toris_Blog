import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategorySidebar from '@/components/blog/CategorySidebar'
import { PostHeadingsProvider } from '@/contexts/PostHeadingsContext'

// Mock fetch
global.fetch = jest.fn()

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

const mockPosts = [
  {
    id: '1',
    title: 'React Post',
    slug: 'react-post',
    content: 'React content',
    description: 'React description',
    category: 'Learning',
    tags: ['React'],
    date: '2024-01-01',
  },
  {
    id: '2',
    title: 'Next.js Post',
    slug: 'nextjs-post',
    content: 'Next.js content',
    description: 'Next.js description',
    category: 'Learning',
    tags: ['Next.js'],
    date: '2024-01-02',
  },
  {
    id: '3',
    title: 'Project Post',
    slug: 'project-post',
    content: 'Project content',
    description: 'Project description',
    category: 'Projects',
    tags: ['TypeScript'],
    date: '2024-01-03',
  },
]

const renderCategorySidebar = (props = {}) => {
  return render(
    <PostHeadingsProvider>
      <CategorySidebar {...props} />
    </PostHeadingsProvider>
  )
}

describe('CategorySidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockPosts,
    })
  })

  it('should render loading state initially when posts are not provided', async () => {
    renderCategorySidebar()

    await waitFor(() => {
      const skeleton = document.querySelector('.animate-pulse')
      expect(skeleton).toBeInTheDocument()
    })
  })

  it('should render posts when provided as props', async () => {
    renderCategorySidebar({ posts: mockPosts })

    await waitFor(() => {
      expect(screen.getByText('토리스')).toBeInTheDocument()
      expect(screen.getByText('Categories')).toBeInTheDocument()
    })
  })

  it('should display categories correctly', async () => {
    renderCategorySidebar({ posts: mockPosts })

    await waitFor(() => {
      expect(screen.getByText('Learning')).toBeInTheDocument()
      expect(screen.getByText('Projects')).toBeInTheDocument()
    })
  })

  it('should display post count for each category', async () => {
    renderCategorySidebar({ posts: mockPosts })

    await waitFor(() => {
      const learningCategory = screen.getByText('Learning').closest('button')
      expect(learningCategory).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument() // 2 posts in Learning
    })
  })

  it('should toggle category expansion when clicked', async () => {
    const user = userEvent.setup()
    renderCategorySidebar({ posts: mockPosts })

    await waitFor(() => {
      expect(screen.getByText('Learning')).toBeInTheDocument()
    })

    const learningButton = screen.getByText('Learning').closest('button')
    if (learningButton) {
      await user.click(learningButton)

      await waitFor(() => {
        expect(screen.getByText('React Post')).toBeInTheDocument()
        expect(screen.getByText('Next.js Post')).toBeInTheDocument()
      })
    }
  })

  it('should highlight active category', async () => {
    renderCategorySidebar({ posts: mockPosts, currentCategory: 'Learning' })

    await waitFor(() => {
      const learningButton = screen.getByText('Learning').closest('button')
      expect(learningButton).toHaveClass('bg-primary/10', 'text-primary')
    })
  })

  it('should display All Posts link', async () => {
    renderCategorySidebar({ posts: mockPosts })

    await waitFor(() => {
      expect(screen.getByText('All Posts')).toBeInTheDocument()
    })
    
    // Check for posts count (may appear multiple times)
    const countElements = screen.getAllByText('3')
    expect(countElements.length).toBeGreaterThan(0)
  })

  it('should display blog stats', async () => {
    renderCategorySidebar({ posts: mockPosts })

    await waitFor(() => {
      expect(screen.getByText('Blog Stats')).toBeInTheDocument()
    })
    
    // Check for posts and categories count (may appear multiple times)
    const countElements = screen.getAllByText('3')
    expect(countElements.length).toBeGreaterThan(0)
  })

  it('should display social links', async () => {
    renderCategorySidebar({ posts: mockPosts })

    await waitFor(() => {
      const githubLink = screen.getByLabelText('GitHub')
      const emailLink = screen.getByLabelText('Email')
      expect(githubLink).toBeInTheDocument()
      expect(emailLink).toBeInTheDocument()
    })
  })

  it('should fetch posts from API when posts prop is not provided', async () => {
    renderCategorySidebar()

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/posts')
    })
  })
})

