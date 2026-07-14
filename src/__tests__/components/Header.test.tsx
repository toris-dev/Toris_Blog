import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header, { getHeaderVisibility } from '@/components/common/Header';
import { ThemeProvider } from 'next-themes';

// Mock SearchModal
jest.mock('@/components/common/SearchModal', () => {
  return function MockSearchModal({
    isOpen,
    onClose
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) {
    return isOpen ? (
      <div data-testid="search-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

// Mock ThemeToggle
jest.mock('@/components/common/ThemeToggle', () => {
  return function MockThemeToggle() {
    return <button data-testid="theme-toggle">Theme Toggle</button>;
  };
});

const renderHeader = () => {
  return render(
    <ThemeProvider>
      <Header />
    </ThemeProvider>
  );
};

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render header correctly', async () => {
    renderHeader();

    await waitFor(() => {
      expect(screen.getByText('TORIS')).toBeInTheDocument();
    });
  });

  it('uses the shared TORIS lockup on the home link', async () => {
    renderHeader();

    const homeLink = await screen.findByRole('link', { name: 'TORIS' });

    expect(homeLink).toHaveAttribute('href', '/');
    expect(
      homeLink.querySelector('[data-brand-variant="lockup"]')
    ).toBeInTheDocument();
    expect(homeLink.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining('toris-mark-v2.png')
    );
  });

  it('should render navigation items', async () => {
    renderHeader();

    await waitFor(() => {
      expect(screen.getAllByText('서비스').length).toBeGreaterThan(0);
      expect(screen.getAllByText('작업 사례').length).toBeGreaterThan(0);
      expect(screen.getAllByText('진행 방식').length).toBeGreaterThan(0);
      expect(screen.getAllByText('블로그').length).toBeGreaterThan(0);
      expect(screen.queryByText('할일 관리')).not.toBeInTheDocument();
    });
  });

  it('should open search modal when search button is clicked', async () => {
    const user = userEvent.setup();
    renderHeader();

    await waitFor(() => {
      const searchButton = screen.getByLabelText('블로그 포스트 검색');
      expect(searchButton).toBeInTheDocument();
    });

    const searchButton = screen.getByLabelText('블로그 포스트 검색');
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByTestId('search-modal')).toBeInTheDocument();
    });
  });

  it('should close search modal when close button is clicked', async () => {
    const user = userEvent.setup();
    renderHeader();

    await waitFor(() => {
      const searchButton = screen.getByLabelText('블로그 포스트 검색');
      expect(searchButton).toBeInTheDocument();
    });

    const searchButton = screen.getByLabelText('블로그 포스트 검색');
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByTestId('search-modal')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('Close');
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('search-modal')).not.toBeInTheDocument();
    });
  });

  it('should render theme toggle', async () => {
    renderHeader();

    await waitFor(() => {
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });
  });

  it('should have correct header classes', async () => {
    const { container } = renderHeader();

    await waitFor(() => {
      const header = container.querySelector('header');
      expect(header).toHaveClass('fixed', 'inset-x-0', 'top-0', 'z-50');
    });
  });

  it('hides while scrolling down and returns while scrolling up', () => {
    expect(getHeaderVisibility(80, 140, true)).toBe(false);
    expect(getHeaderVisibility(140, 110, false)).toBe(true);
    expect(getHeaderVisibility(110, 40, false)).toBe(true);
  });
});
