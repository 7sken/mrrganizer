import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '../lib/auth.jsx';
import AuthPage from '../pages/AuthPage.jsx';

const renderPage = () =>
  render(
    <AuthProvider>
      <AuthPage />
    </AuthProvider>
  );

describe('Ekran logowania', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('pokazuje błędy walidacji i nie wysyła żądania', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    expect(screen.getByText('Podaj poprawny e-mail')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('kot zasłania oczy łapkami przy wpisywaniu hasła', async () => {
    const { container } = renderPage();
    await userEvent.click(screen.getByLabelText('Hasło'));
    // łapki = elipsy o promieniu 24 przed oczami
    expect(container.querySelectorAll('ellipse[rx="24"]')).toHaveLength(2);
  });

  it('pokazuje komunikat serwera przy złym haśle', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Nieprawidłowy e-mail lub hasło' }), { status: 401 })
    );
    renderPage();
    await userEvent.type(screen.getByLabelText('E-mail'), 'ala@kot.pl');
    await userEvent.type(screen.getByLabelText('Hasło'), 'zlehaslo');
    await userEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    expect(await screen.findByText('Nieprawidłowy e-mail lub hasło')).toBeInTheDocument();
    expect(screen.getByTestId('cat-face')).toHaveAttribute('data-mood', 'sad');
  });

  it('po udanym logowaniu zapisuje token', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ token: 'abc.def.ghi', user: { id: 1, name: 'Ala', email: 'ala@kot.pl' } }), { status: 200 })
    );
    renderPage();
    await userEvent.type(screen.getByLabelText('E-mail'), 'ala@kot.pl');
    await userEvent.type(screen.getByLabelText('Hasło'), 'dobrehaslo');
    await userEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    await vi.waitFor(() => expect(localStorage.getItem('mrrganizer_token')).toBe('abc.def.ghi'));
    expect(fetchSpyCalledWith('/api/auth/login')).toBe(true);
  });
});

function fetchSpyCalledWith(url) {
  return globalThis.fetch.mock.calls.some(([u]) => u === url);
}
