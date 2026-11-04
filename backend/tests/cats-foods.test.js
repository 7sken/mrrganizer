import { describe, it, expect, beforeAll } from 'vitest';
import { setup, registerUser, sampleFood } from './helpers.js';

describe('Koty i spiżarnia', () => {
  let api, owner, stranger, catId, foodId;

  beforeAll(async () => {
    ({ api } = setup());
    owner = await registerUser(api, 'Właściciel');
    stranger = await registerUser(api, 'Obcy');
  });

  it('endpointy wymagają zalogowania', async () => {
    expect((await api.get('/api/cats')).status).toBe(401);
    expect((await api.get('/api/foods')).status).toBe(401);
  });

  it('dodaje kota z domyślnym wyglądem awatara', async () => {
    const res = await api.post('/api/cats').set(owner.auth).send({ name: 'Filemon' });
    expect(res.status).toBe(201);
    expect(res.body.avatar).toMatchObject({ pattern: 'jednolity', accessory: 'brak' });
    catId = res.body.id;
  });

  it('odrzuca niepoprawny kolor w awatarze', async () => {
    const res = await api
      .post('/api/cats')
      .set(owner.auth)
      .send({ name: 'Zły', avatar: { fur: 'czerwony' } });
    expect(res.status).toBe(400);
  });

  it('aktualizuje wygląd kota', async () => {
    const res = await api
      .put(`/api/cats/${catId}`)
      .set(owner.auth)
      .send({ name: 'Filemon', avatar: { fur: '#000000', accessory: 'kokardka' } });
    expect(res.status).toBe(200);
    expect(res.body.avatar.accessory).toBe('kokardka');
  });

  it('dodaje karmę do spiżarni', async () => {
    const res = await api.post('/api/foods').set(owner.auth).send(sampleFood);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ brand: 'Animonda', quantity: 5 });
    foodId = res.body.id;
  });

  it('zmienia stan karmy i nie schodzi poniżej zera', async () => {
    let res = await api.patch(`/api/foods/${foodId}/quantity`).set(owner.auth).send({ change: -3 });
    expect(res.body.quantity).toBe(2);
    res = await api.patch(`/api/foods/${foodId}/quantity`).set(owner.auth).send({ change: -10 });
    expect(res.body.quantity).toBe(0);
  });

  it('karma z niskim stanem trafia na listę zakupów', async () => {
    const res = await api.get('/api/foods/shopping-list').set(owner.auth);
    expect(res.body.map((f) => f.id)).toContain(foodId);
    expect(res.body[0].to_buy).toBeGreaterThan(0);
  });

  it('kot ocenia karmę (1–3), średnia się liczy', async () => {
    const res = await api.put(`/api/foods/${foodId}/rating`).set(owner.auth).send({ cat_id: catId, rating: 3 });
    expect(res.status).toBe(200);
    expect(res.body.ratings[catId]).toBe(3);
    expect(res.body.avgRating).toBe(3);

    const bad = await api.put(`/api/foods/${foodId}/rating`).set(owner.auth).send({ cat_id: catId, rating: 5 });
    expect(bad.status).toBe(400);
  });

  it('wyszukuje karmy po nazwie (bez SQL injection)', async () => {
    const ok = await api.get('/api/foods?q=anim').set(owner.auth);
    expect(ok.body).toHaveLength(1);
    const injection = await api.get(`/api/foods?q=${encodeURIComponent("' OR 1=1 --")}`).set(owner.auth);
    expect(injection.status).toBe(200);
    expect(injection.body).toHaveLength(0);
  });

  describe('izolacja danych użytkowników', () => {
    it('obcy użytkownik nie widzi cudzych kotów ani karm', async () => {
      expect((await api.get('/api/cats').set(stranger.auth)).body).toHaveLength(0);
      expect((await api.get(`/api/cats/${catId}`).set(stranger.auth)).status).toBe(404);
      expect((await api.get(`/api/foods/${foodId}`).set(stranger.auth)).status).toBe(404);
    });

    it('obcy użytkownik nie może edytować ani usuwać cudzych danych', async () => {
      expect((await api.put(`/api/foods/${foodId}`).set(stranger.auth).send(sampleFood)).status).toBe(404);
      expect((await api.delete(`/api/cats/${catId}`).set(stranger.auth)).status).toBe(404);
      expect((await api.get(`/api/cats/${catId}`).set(owner.auth)).status).toBe(200);
    });

    it('obcy nie może ocenić cudzej karmy swoim kotem', async () => {
      const theirCat = await api.post('/api/cats').set(stranger.auth).send({ name: 'Obcy kot' });
      const res = await api
        .put(`/api/foods/${foodId}/rating`)
        .set(stranger.auth)
        .send({ cat_id: theirCat.body.id, rating: 1 });
      expect(res.status).toBe(404);
    });
  });

  it('usuwa karmę', async () => {
    expect((await api.delete(`/api/foods/${foodId}`).set(owner.auth)).status).toBe(204);
    expect((await api.get(`/api/foods/${foodId}`).set(owner.auth)).status).toBe(404);
  });
});
