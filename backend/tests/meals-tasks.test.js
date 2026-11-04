import { describe, it, expect, beforeAll } from 'vitest';
import { setup, registerUser, sampleFood } from './helpers.js';
import { pickFood, weightFor, addDays } from '../src/planner.js';
import { computeMood } from '../src/routes/dashboard.js';

describe('Logika planera (testy jednostkowe)', () => {
  const foods = [{ id: 1 }, { id: 2 }, { id: 3 }];

  it('addDays przechodzi przez koniec miesiąca', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02');
  });

  it('karma z oceną 🙀 nigdy nie jest losowana', () => {
    expect(weightFor(1)).toBe(0);
    const stock = new Map([[1, 5], [2, 5], [3, 5]]);
    for (let i = 0; i < 50; i++) {
      expect(pickFood(foods, { 2: 1 }, stock, null).id).not.toBe(2);
    }
  });

  it('nie losuje karmy, której nie ma na stanie', () => {
    const stock = new Map([[1, 0], [2, 0], [3, 4]]);
    expect(pickFood(foods, {}, stock, null).id).toBe(3);
  });

  it('nie daje dwa razy z rzędu tego samego, jeśli jest wybór', () => {
    const stock = new Map([[1, 5], [2, 5], [3, 0]]);
    for (let i = 0; i < 20; i++) {
      expect(pickFood(foods, {}, stock, 1).id).toBe(2);
    }
  });

  it('zwraca null, gdy nic nie zostało', () => {
    expect(pickFood(foods, {}, new Map(), null)).toBeNull();
  });

  it('nastrój mordki zależy od stanu spiżarni', () => {
    expect(computeMood({ lowStock: 0, expired: 0, overdueTasks: 0, totalUnits: 10 })).toBe('happy');
    expect(computeMood({ lowStock: 2, expired: 0, overdueTasks: 0, totalUnits: 10 })).toBe('meh');
    expect(computeMood({ lowStock: 0, expired: 0, overdueTasks: 0, totalUnits: 0 })).toBe('sad');
  });
});

describe('Planer karmienia i zadania (API)', () => {
  let api, user, catId, foodId;
  const start = '2030-03-01';

  beforeAll(async () => {
    ({ api } = setup());
    user = await registerUser(api);
    catId = (await api.post('/api/cats').set(user.auth).send({ name: 'Luna' })).body.id;
    foodId = (await api.post('/api/foods').set(user.auth).send({ ...sampleFood, quantity: 4 })).body.id;
    await api.post('/api/foods').set(user.auth).send({ ...sampleFood, flavor: 'Kurczak', quantity: 10 });
  });

  it('generuje plan, nie przekraczając stanu spiżarni', async () => {
    const res = await api.post('/api/meals/generate').set(user.auth).send({ start, days: 7 });
    expect(res.status).toBe(201);
    expect(res.body.created).toBe(14); // 4 + 10 sztuk = 14 posiłków (7 dni × 2)

    const meals = await api.get(`/api/meals?start=${start}&end=${addDays(start, 6)}`).set(user.auth);
    expect(meals.body).toHaveLength(14);
    expect(meals.body.filter((m) => m.food_id === foodId).length).toBeLessThanOrEqual(4);
  });

  it('podanie posiłku zdejmuje sztukę ze stanu, cofnięcie ją oddaje', async () => {
    const meals = (await api.get(`/api/meals?start=${start}&end=${start}`).set(user.auth)).body;
    const meal = meals[0];
    const before = (await api.get(`/api/foods/${meal.food_id}`).set(user.auth)).body.quantity;

    const served = await api.patch(`/api/meals/${meal.id}/serve`).set(user.auth);
    expect(served.body.served).toBe(1);
    expect((await api.get(`/api/foods/${meal.food_id}`).set(user.auth)).body.quantity).toBe(before - 1);

    await api.patch(`/api/meals/${meal.id}/serve`).set(user.auth);
    expect((await api.get(`/api/foods/${meal.food_id}`).set(user.auth)).body.quantity).toBe(before);
  });

  it('ręcznie dodaje / podmienia posiłek', async () => {
    const res = await api
      .post('/api/meals')
      .set(user.auth)
      .send({ cat_id: catId, food_id: foodId, date: '2030-04-01', slot: 'rano' });
    expect(res.status).toBe(201);
    expect(res.body.food_id).toBe(foodId);
  });

  it('bez kota nie da się wygenerować planu', async () => {
    const other = await registerUser(api);
    const res = await api.post('/api/meals/generate').set(other.auth).send({ start, days: 3 });
    expect(res.status).toBe(400);
  });

  it('CRUD zadań: dodaj, odhacz, usuń', async () => {
    const created = await api
      .post('/api/tasks')
      .set(user.auth)
      .send({ title: 'Weterynarz – szczepienie', category: 'weterynarz', due_date: '2030-03-05', cat_id: catId });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ done: false, cat_name: 'Luna' });

    const toggled = await api.patch(`/api/tasks/${created.body.id}/toggle`).set(user.auth);
    expect(toggled.body.done).toBe(true);

    expect((await api.delete(`/api/tasks/${created.body.id}`).set(user.auth)).status).toBe(204);
  });

  it('nie da się przypisać zadania do cudzego kota', async () => {
    const other = await registerUser(api);
    const res = await api.post('/api/tasks').set(other.auth).send({ title: 'Hack', cat_id: catId });
    expect(res.status).toBe(404);
  });

  it('pulpit zwraca podsumowanie i nastrój', async () => {
    const res = await api.get(`/api/dashboard?today=${start}`).set(user.auth);
    expect(res.status).toBe(200);
    expect(res.body.counts.cats).toBe(1);
    expect(['happy', 'meh', 'sad']).toContain(res.body.mood);
    expect(res.body.todayMeals.length).toBe(2);
  });
});

describe('Zabezpieczenia ogólne', () => {
  const { api } = setup();

  it('ustawia bezpieczne nagłówki (helmet) i ukrywa X-Powered-By', async () => {
    const res = await api.get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('zwraca 400 dla zepsutego JSON-a zamiast błędu serwera', async () => {
    const res = await api.post('/api/auth/login').set('Content-Type', 'application/json').send('{zly json');
    expect(res.status).toBe(400);
  });

  it('nieznany endpoint to 404', async () => {
    expect((await api.get('/api/nie-istnieje')).status).toBe(404);
  });
});
