import { describe, it, expect } from 'vitest';
import { addDays, startOfWeek, relativeDays, foodStatus, catAge, randomAvatar, PATTERNS, formatRating } from '../lib/utils.js';
import { validateAuth } from '../pages/AuthPage.jsx';
import { validateFood } from '../components/FoodDialog.jsx';
import { brandColor } from '../components/FoodIcon.jsx';

describe('Funkcje pomocnicze', () => {
  it('liczy daty i początek tygodnia (poniedziałek)', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(startOfWeek('2026-11-04')).toBe('2026-11-02'); // środa → poniedziałek
    expect(startOfWeek('2026-11-08')).toBe('2026-11-02'); // niedziela → ten sam tydzień
  });

  it('opisuje daty po ludzku', () => {
    const today = '2026-11-04';
    expect(relativeDays('2026-11-04', today)).toBe('dziś');
    expect(relativeDays('2026-11-05', today)).toBe('jutro');
    expect(relativeDays('2026-11-10', today)).toBe('za 6 dni');
    expect(relativeDays('2026-11-01', today)).toBe('3 dni temu');
  });

  it('wylicza status karmy', () => {
    const today = '2026-11-04';
    const base = { quantity: 5, min_quantity: 2, expiry_date: '2027-06-01' };
    expect(foodStatus(base, today)).toBe('ok');
    expect(foodStatus({ ...base, quantity: 2 }, today)).toBe('low');
    expect(foodStatus({ ...base, quantity: 0 }, today)).toBe('empty');
    expect(foodStatus({ ...base, expiry_date: '2026-11-01' }, today)).toBe('expired');
    expect(foodStatus({ ...base, expiry_date: '2026-11-10' }, today)).toBe('expiring');
    expect(foodStatus({ ...base, quantity: 0, active: false }, today)).toBe('inactive');
  });

  it('liczy wiek kota', () => {
    expect(catAge('2026-05-04', '2026-11-04')).toBe('6 mies.');
    expect(catAge('2023-11-01', '2026-11-04')).toBe('3 lata');
  });

  it('losowy wygląd ma poprawne pola', () => {
    const a = randomAvatar();
    expect(a.fur).toMatch(/^#[0-9a-f]{6}$/i);
    expect(PATTERNS.map((p) => p.value)).toContain(a.pattern);
  });

  it('formatuje średnią ocenę bez zbędnego ",0"', () => {
    expect(formatRating(3)).toBe('3');
    expect(formatRating(2.5)).toBe('2,5');
    expect(formatRating(8 / 3)).toBe('2,7');
  });

  it('ta sama marka zawsze ma ten sam kolor ikonki', () => {
    expect(brandColor('Animonda')).toBe(brandColor('Animonda'));
  });
});

describe('Walidacja formularzy', () => {
  it('rejestracja: wymaga poprawnego e-maila, imienia i hasła min. 8 znaków', () => {
    const errors = validateAuth('register', { email: 'zly', name: 'A', password: '123' });
    expect(Object.keys(errors).sort()).toEqual(['email', 'name', 'password']);
    expect(validateAuth('register', { email: 'a@b.pl', name: 'Ala', password: '12345678' })).toEqual({});
  });

  it('karma: marka i smak wymagane, ilość nieujemna', () => {
    const errors = validateFood({ brand: '', flavor: ' ', weight_g: 0, quantity: -1, min_quantity: 0, price: '' });
    expect(Object.keys(errors).sort()).toEqual(['brand', 'flavor', 'quantity', 'weight_g']);
  });
});
