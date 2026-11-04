// Pomocnicze funkcje do testów – każda grupa testów dostaje świeżą bazę w pamięci.
import request from 'supertest';
import { createDb } from '../src/db.js';
import { createApp } from '../src/app.js';

export function setup() {
  const db = createDb(':memory:');
  const app = createApp(db);
  return { db, app, api: request(app) };
}

let counter = 0;
export async function registerUser(api, name = 'Tester') {
  counter++;
  const res = await api
    .post('/api/auth/register')
    .send({ email: `user${counter}@test.pl`, name, password: 'tajnehaslo123' });
  return { token: res.body.token, user: res.body.user, auth: { Authorization: `Bearer ${res.body.token}` } };
}

export const sampleFood = {
  brand: 'Animonda',
  flavor: 'Wołowina',
  type: 'mokra',
  weight_g: 200,
  quantity: 5,
  min_quantity: 2,
  price: 7.5,
  expiry_date: '2030-01-01',
};
