import { describe, it, expect, beforeAll } from 'vitest';
import { setup } from './helpers.js';

describe('Autoryzacja /api/auth', () => {
  let api, db;
  beforeAll(() => ({ api, db } = setup()));

  it('rejestruje nowego użytkownika i zwraca token', async () => {
    const res = await api
      .post('/api/auth/register')
      .send({ email: 'ala@kot.pl', name: 'Ala', password: 'bardzotajne1' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTypeOf('string');
    expect(res.body.user).toMatchObject({ email: 'ala@kot.pl', name: 'Ala' });
  });

  it('nie zapisuje hasła jawnym tekstem (tylko hash bcrypt)', () => {
    const row = db.prepare('SELECT password_hash FROM users WHERE email = ?').get('ala@kot.pl');
    expect(row.password_hash).not.toBe('bardzotajne1');
    expect(row.password_hash).toMatch(/^\$2[aby]\$/);
  });

  it('odrzuca drugie konto z tym samym e-mailem (409)', async () => {
    const res = await api
      .post('/api/auth/register')
      .send({ email: 'ALA@kot.pl', name: 'Ala2', password: 'bardzotajne1' });
    expect(res.status).toBe(409);
  });

  it('waliduje dane rejestracji (za krótkie hasło, zły e-mail)', async () => {
    const res = await api
      .post('/api/auth/register')
      .send({ email: 'to-nie-email', name: 'A', password: '123' });
    expect(res.status).toBe(400);
    const fields = res.body.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['email', 'name', 'password']));
  });

  it('loguje przy poprawnym haśle', async () => {
    const res = await api.post('/api/auth/login').send({ email: 'ala@kot.pl', password: 'bardzotajne1' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('odrzuca złe hasło tym samym komunikatem co nieistniejący e-mail', async () => {
    const wrongPass = await api.post('/api/auth/login').send({ email: 'ala@kot.pl', password: 'zle' });
    const noUser = await api.post('/api/auth/login').send({ email: 'nikt@kot.pl', password: 'zle' });
    expect(wrongPass.status).toBe(401);
    expect(noUser.status).toBe(401);
    expect(wrongPass.body.error).toBe(noUser.body.error);
  });

  it('GET /me wymaga tokenu', async () => {
    expect((await api.get('/api/auth/me')).status).toBe(401);
    expect((await api.get('/api/auth/me').set('Authorization', 'Bearer podrobiony.token.xyz')).status).toBe(401);
  });

  it('GET /me zwraca dane bez hasha hasła', async () => {
    const login = await api.post('/api/auth/login').send({ email: 'ala@kot.pl', password: 'bardzotajne1' });
    const res = await api.get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('ala@kot.pl');
    expect(res.body.password_hash).toBeUndefined();
  });
});
