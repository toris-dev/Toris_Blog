import { act, fireEvent, render, screen } from '@testing-library/react';
import CookieConsent from '@/components/common/CookieConsent';

describe('CookieConsent', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('shows a compact banner above the mobile navigation', () => {
    render(<CookieConsent />);

    act(() => jest.advanceTimersByTime(1000));

    const banner = screen.getByRole('region', { name: '쿠키 사용 안내' });
    expect(banner).toHaveClass('bottom-20', 'z-[60]', 'md:bottom-4');
    expect(screen.getByRole('button', { name: '동의' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '거부' })).toBeInTheDocument();
  });

  it('dismisses the banner after consent', () => {
    render(<CookieConsent />);
    act(() => jest.advanceTimersByTime(1000));

    fireEvent.click(screen.getByRole('button', { name: '동의' }));

    expect(
      screen.queryByRole('region', { name: '쿠키 사용 안내' })
    ).not.toBeInTheDocument();
    expect(localStorage.getItem('cookie-consent')).toBe('accepted');
  });
});
