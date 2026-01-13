import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Header from '@/components/common/Header'
import { ThemeProvider } from 'next-themes'

// Mock SearchModal
jest.mock('@/components/common/SearchModal', () => {
  return function MockSearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    return isOpen ? (
      <div data-testid="search-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  }
})

// Mock ThemeToggle
jest.mock('@/components/common/ThemeToggle', () => {
  return function MockThemeToggle() {
    return <button data-testid="theme-toggle">Theme Toggle</button>
  }
})

const renderHeader = () => {
  return render(
    <ThemeProvider>
      <Header />
    </ThemeProvider>
  )
}

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render header correctly', async () => {
    renderHeader()

    await waitFor(() => {
      expect(screen.getByText('Toris Blog')).toBeInTheDocument()
    })
  })

  it('should render navigation items', async () => {
    renderHeader()

    await waitFor(() => {
      expect(screen.getByText('홈')).toBeInTheDocument()
      expect(screen.getByText('블로그')).toBeInTheDocument()
      expect(screen.getByText('할일 관리')).toBeInTheDocument()
    })
  })

  it('should open search modal when search button is clicked', async () => {
    const user = userEvent.setup()
    renderHeader()

    await waitFor(() => {
      const searchButton = screen.getByLabelText('블로그 포스트 검색')
      expect(searchButton).toBeInTheDocument()
    })

    const searchButton = screen.getByLabelText('블로그 포스트 검색')
    await user.click(searchButton)

    await waitFor(() => {
      expect(screen.getByTestId('search-modal')).toBeInTheDocument()
    })
  })

  it('should close search modal when close button is clicked', async () => {
    const user = userEvent.setup()
    renderHeader()

    await waitFor(() => {
      const searchButton = screen.getByLabelText('블로그 포스트 검색')
      expect(searchButton).toBeInTheDocument()
    })

    const searchButton = screen.getByLabelText('블로그 포스트 검색')
    await user.click(searchButton)

    await waitFor(() => {
      expect(screen.getByTestId('search-modal')).toBeInTheDocument()
    })

    const closeButton = screen.getByText('Close')
    await user.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByTestId('search-modal')).not.toBeInTheDocument()
    })
  })

  it('should render theme toggle', async () => {
    renderHeader()

    await waitFor(() => {
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
    })
  })

  it('should have correct header classes', async () => {
    const { container } = renderHeader()

    await waitFor(() => {
      const header = container.querySelector('header')
      expect(header).toHaveClass('fixed', 'inset-x-0', 'top-0', 'z-50')
    })
  })
})

