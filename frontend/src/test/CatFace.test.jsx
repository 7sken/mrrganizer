import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import CatFace from '../components/CatFace.jsx';

describe('CatFace – interaktywna mordka', () => {
  it('renderuje SVG z imieniem kota w opisie dostępności', () => {
    render(<CatFace name="Filemon" />);
    expect(screen.getByRole('img', { name: 'Kot Filemon' })).toBeInTheDocument();
  });

  it('pokazuje nastrój przekazany w props', () => {
    render(<CatFace mood="sad" />);
    expect(screen.getByTestId('cat-face')).toHaveAttribute('data-mood', 'sad');
  });

  it('po kliknięciu (głaskaniu) mruczy i wywołuje onPet', async () => {
    const onPet = vi.fn();
    render(<CatFace name="Luna" onPet={onPet} size={160} />);
    await userEvent.click(screen.getByTestId('cat-face'));

    expect(onPet).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('cat-face')).toHaveAttribute('data-mood', 'petted');
    expect(screen.getByText('mrrr…')).toBeInTheDocument();
  });

  it('wraca do normalnego nastroju po chwili', async () => {
    vi.useFakeTimers();
    render(<CatFace mood="happy" />);
    act(() => screen.getByTestId('cat-face').click());
    expect(screen.getByTestId('cat-face')).toHaveAttribute('data-mood', 'petted');
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByTestId('cat-face')).toHaveAttribute('data-mood', 'happy');
    vi.useRealTimers();
  });

  it('nieinteraktywny kot nie reaguje na kliknięcie', async () => {
    const onPet = vi.fn();
    render(<CatFace interactive={false} onPet={onPet} />);
    await userEvent.click(screen.getByTestId('cat-face'));
    expect(onPet).not.toHaveBeenCalled();
  });

  it('rysuje wybrany dodatek i kolor futra', () => {
    const { container } = render(<CatFace avatar={{ fur: '#123456', accessory: 'okulary' }} />);
    expect(container.querySelector('ellipse[fill="#123456"]')).not.toBeNull();
    expect(container.querySelectorAll('circle[r="22"]')).toHaveLength(2); // dwa szkła okularów
  });
});
