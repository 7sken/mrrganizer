import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import InstallPrompt, { isIos } from '../components/InstallPrompt.jsx';

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';

describe('PWA – baner instalacji', () => {
  beforeEach(() => {
    localStorage.clear();
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  });
  afterEach(() => vi.restoreAllMocks());

  it('rozpoznaje iPhone’a i iPada (który udaje Maca)', () => {
    expect(isIos(IPHONE_UA, 5)).toBe(true);
    expect(isIos('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe(true);
    expect(isIos('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)).toBe(false);
    expect(isIos('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 0)).toBe(false);
  });

  it('na iPhonie pokazuje instrukcję „Do ekranu początkowego”, a po zamknięciu znika na stałe', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(IPHONE_UA);
    const { unmount } = render(<InstallPrompt />);
    expect(screen.getByText(/Do ekranu początkowego/)).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Zamknij'));
    expect(screen.queryByText(/Do ekranu początkowego/)).not.toBeInTheDocument();
    unmount();

    render(<InstallPrompt />);
    expect(screen.queryByText(/Do ekranu początkowego/)).not.toBeInTheDocument();
  });

  it('nie pokazuje banera, gdy aplikacja jest już zainstalowana', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(IPHONE_UA);
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    render(<InstallPrompt />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
