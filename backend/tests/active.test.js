import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { setup, registerUser, sampleFood } from './helpers.js';
import { createDb } from '../src/db.js';

describe('Karma używana / nieużywana', () => {
  let api, user, catId, usedId, unusedId;

  beforeAll(async () => {
    ({ api } = setup());
    user = await registerUser(api);
    catId = (await api.post('/api/cats').set(user.auth).send({ name: 'Mruczek' })).body.id;
    // obie karmy się skończyły
    usedId = (await api.post('/api/foods').set(user.auth).send({ ...sampleFood, flavor: 'Kurczak', quantity: 0 })).body.id;
    unusedId = (await api.post('/api/foods').set(user.auth).send({ ...sampleFood, flavor: 'Tuńczyk', quantity: 0 })).body.id;
  });

  it('nowa karma jest domyślnie używana', async () => {
    const res = await api.get(`/api/foods/${usedId}`).set(user.auth);
    expect(res.body.active).toBe(true);
  });

  it('oznaczenie jako nieużywana', async () => {
    const res = await api.patch(`/api/foods/${unusedId}/active`).set(user.auth).send({ active: false });
    expect(res.status).toBe(200);
    expect(res.body.active).toBe(false);
  });

  it('nieużywana karma znika z listy zakupów i alertów pulpitu', async () => {
    const shopping = await api.get('/api/foods/shopping-list').set(user.auth);
    expect(shopping.body.map((f) => f.id)).toEqual([usedId]);

    const dash = await api.get('/api/dashboard').set(user.auth);
    expect(dash.body.lowStock.map((f) => f.id)).toEqual([usedId]);
  });

  it('nieużywana karma nadal jest w spiżarni (na końcu listy)', async () => {
    const foods = await api.get('/api/foods').set(user.auth);
    expect(foods.body.map((f) => f.id)).toEqual([usedId, unusedId]);
  });

  it('nie trafia do losowania menu', async () => {
    await api.patch(`/api/foods/${unusedId}/quantity`).set(user.auth).send({ change: 5 });
    await api.patch(`/api/foods/${unusedId}/active`).set(user.auth).send({ active: false });
    await api.patch(`/api/foods/${usedId}/quantity`).set(user.auth).send({ change: 10 });

    await api.post('/api/meals/generate').set(user.auth).send({ start: '2031-01-01', days: 3 });
    const meals = await api.get('/api/meals?start=2031-01-01&end=2031-01-03').set(user.auth);
    expect(meals.body.length).toBeGreaterThan(0);
    expect(meals.body.every((m) => m.food_id === usedId)).toBe(true);
  });

  it('dokupienie karmy (+) automatycznie przywraca ją jako używaną', async () => {
    const res = await api.patch(`/api/foods/${unusedId}/quantity`).set(user.auth).send({ change: 1 });
    expect(res.body.active).toBe(true);
  });

  it('zużycie (−) nie zmienia statusu', async () => {
    await api.patch(`/api/foods/${unusedId}/active`).set(user.auth).send({ active: false });
    const res = await api.patch(`/api/foods/${unusedId}/quantity`).set(user.auth).send({ change: -1 });
    expect(res.body.active).toBe(false);
  });

  it('edycja karmy formularzem nie resetuje statusu', async () => {
    const res = await api.put(`/api/foods/${unusedId}`).set(user.auth).send({ ...sampleFood, flavor: 'Tuńczyk z rybą' });
    expect(res.body.active).toBe(false);
  });

  it('waliduje dane i chroni cudze karmy', async () => {
    expect((await api.patch(`/api/foods/${usedId}/active`).set(user.auth).send({ active: 'nie' })).status).toBe(400);
    const other = await registerUser(api);
    expect((await api.patch(`/api/foods/${usedId}/active`).set(other.auth).send({ active: false })).status).toBe(404);
    expect(catId).toBeTruthy();
  });
});

describe('Migracja bazy', () => {
  it('dodaje kolumnę active do starej bazy, zachowując dane', () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'mrr-')), 'old.db');
    const old = new DatabaseSync(file);
    old.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, name TEXT, password_hash TEXT, created_at TEXT);
      CREATE TABLE foods (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, brand TEXT, flavor TEXT, type TEXT,
        weight_g INTEGER, quantity INTEGER, min_quantity INTEGER, price REAL, expiry_date TEXT);
      INSERT INTO foods (user_id, brand, flavor, type, weight_g, quantity, min_quantity) VALUES (1, 'Stara', 'Karma', 'mokra', 85, 3, 1);`);
    old.close();

    const db = createDb(file);
    const row = db.prepare('SELECT brand, active FROM foods').get();
    expect(row).toMatchObject({ brand: 'Stara', active: 1 });
  });
});
