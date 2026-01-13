import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchModal from '@/components/common/SearchModal'

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
    title: 'Test Post 1',
    slug: 'test-post-1',
    content: 'Test content 1',
    description: 'Test description 1',
    category: 'Learning',
    tags: ['React', 'Next.js'],
    date: '2024-01-01',
  },
  {
    id: '2',
    title: 'Test Post 2',
    slug: 'test-post-2',
    content: 'Test content 2',
    description: 'Test description 2',
    category: 'Projects',
    tags: ['TypeScript'],
    date: '2024-01-02',
  },
]

describe('SearchModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockPosts,
    })
  })

  it('should not render when isOpen is false', () => {
    render(<SearchModal isOpen={false} onClose={jest.fn()} />)
    expect(screen.queryByPlaceholderText('포스트 검색...')).not.toBeInTheDocument()
  })

  it('should render when isOpen is true', async () => {
    render(<SearchModal isOpen={true} onClose={jest.fn()} />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('포스트 검색...')).toBeInTheDocument()
    })
  })

  it('should fetch posts when opened', async () => {
    render(<SearchModal isOpen={true} onClose={jest.fn()} />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/posts')
    })
  })

  it('should filter posts based on search term', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={jest.fn()} />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('포스트 검색...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('포스트 검색...')
    await user.type(input, 'Test Post 1')

    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      expect(screen.queryByText('Test Post 2')).not.toBeInTheDocument()
    })
  })

  it('should clear search term when clear button is clicked', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={jest.fn()} />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('포스트 검색...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('포스트 검색...')
    await user.type(input, 'test')

    await waitFor(() => {
      // Clear button appears when searchTerm has value
      const buttons = screen.getAllByRole('button')
      const clearButton = buttons.find((btn) => 
        btn.querySelector('svg') && btn !== screen.getByLabelText('검색 모달 닫기')
      )
      expect(clearButton).toBeDefined()
    })

    const buttons = screen.getAllByRole('button')
    const clearButton = buttons.find((btn) => 
      btn.querySelector('svg') && btn !== screen.getByLabelText('검색 모달 닫기')
    )
    
    if (clearButton) {
      await user.click(clearButton)

      await waitFor(() => {
        expect(input).toHaveValue('')
      })
    }
  })

  it('should close modal when close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    render(<SearchModal isOpen={true} onClose={onClose} />)

    await waitFor(() => {
      const closeButton = screen.getByLabelText('검색 모달 닫기')
      expect(closeButton).toBeInTheDocument()
    })

    const closeButton = screen.getByLabelText('검색 모달 닫기')
    await user.click(closeButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('should display loading state while fetching posts', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ ok: true, json: async () => mockPosts }), 100)
        )
    )

    render(<SearchModal isOpen={true} onClose={jest.fn()} />)

    // Loading spinner should be visible initially
    await waitFor(() => {
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  it('should display no results message when search has no matches', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={jest.fn()} />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('포스트 검색...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('포스트 검색...')
    await user.type(input, 'NonExistentPost')

    await waitFor(() => {
      expect(screen.getByText(/검색 결과가 없습니다/)).toBeInTheDocument()
    })
  })
})

