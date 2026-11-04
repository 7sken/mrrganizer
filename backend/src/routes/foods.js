// /api/foods – spiżarnia: karmy, stan magazynu, oceny kotów, lista zakupów
import { Router } from 'express';
import { validate, parseId } from '../middleware/validate.js';
import { foodSchema, quantitySchema, ratingSchema } from '../schemas.js';

export function foodsRouter(db) {
  const router = Router();

  const findOwn = (id, userId) =>
    db.prepare('SELECT * FROM foods WHERE id = ? AND user_id = ?').get(id, userId);

  // Dołącza oceny kotów do karmy: { ratings: { [catId]: 1..3 }, avgRating }
  const withRatings = (food) => {
    const rows = db.prepare('SELECT cat_id, rating FROM ratings WHERE food_id = ?').all(food.id);
    const ratings = Object.fromEntries(rows.map((r) => [r.cat_id, r.rating]));
    const avg = rows.length ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : null;
    return { ...food, ratings, avgRating: avg };
  };

  router.get('/', (req, res) => {
    const { type, q } = req.query;
    let sql = 'SELECT * FROM foods WHERE user_id = ?';
    const params = [req.userId];

    if (['mokra', 'sucha', 'przysmak'].includes(type)) {
      sql += ' AND type = ?';
      params.push(type);
    }
    if (typeof q === 'string' && q.trim()) {
      // Zapytania parametryzowane – brak ryzyka SQL injection
      sql += ' AND (brand LIKE ? OR flavor LIKE ?)';
      params.push(`%${q.trim()}%`, `%${q.trim()}%`);
    }
    sql += ' ORDER BY brand, flavor';

    res.json(db.prepare(sql).all(...params).map(withRatings));
  });

  // Lista zakupów: karmy, których stan spadł do minimum lub niżej
  router.get('/shopping-list', (req, res) => {
    const rows = db
      .prepare(
        `SELECT *, MAX(1, min_quantity * 2 - quantity) AS to_buy
         FROM foods WHERE user_id = ? AND quantity <= min_quantity
         ORDER BY quantity ASC`
      )
      .all(req.userId);
    res.json(rows);
  });

  router.get('/:id', (req, res) => {
    const food = findOwn(parseId(req.params.id), req.userId);
    if (!food) return res.status(404).json({ error: 'Nie znaleziono karmy' });
    res.json(withRatings(food));
  });

  router.post('/', validate(foodSchema), (req, res) => {
    const f = req.body;
    const info = db
      .prepare(
        `INSERT INTO foods (user_id, brand, flavor, type, weight_g, quantity, min_quantity, price, expiry_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.userId, f.brand, f.flavor, f.type, f.weight_g, f.quantity,
        f.min_quantity, f.price ?? null, f.expiry_date ?? null
      );
    res.status(201).json(withRatings(findOwn(Number(info.lastInsertRowid), req.userId)));
  });

  router.put('/:id', validate(foodSchema), (req, res) => {
    const id = parseId(req.params.id);
    if (!findOwn(id, req.userId)) return res.status(404).json({ error: 'Nie znaleziono karmy' });

    const f = req.body;
    db.prepare(
      `UPDATE foods SET brand = ?, flavor = ?, type = ?, weight_g = ?, quantity = ?,
       min_quantity = ?, price = ?, expiry_date = ? WHERE id = ? AND user_id = ?`
    ).run(
      f.brand, f.flavor, f.type, f.weight_g, f.quantity, f.min_quantity,
      f.price ?? null, f.expiry_date ?? null, id, req.userId
    );
    res.json(withRatings(findOwn(id, req.userId)));
  });

  // Szybka zmiana stanu (+1 kupiłem, -1 zużyłem); stan nie spada poniżej zera
  router.patch('/:id/quantity', validate(quantitySchema), (req, res) => {
    const id = parseId(req.params.id);
    if (!findOwn(id, req.userId)) return res.status(404).json({ error: 'Nie znaleziono karmy' });

    db.prepare(
      'UPDATE foods SET quantity = MAX(0, quantity + ?) WHERE id = ? AND user_id = ?'
    ).run(req.body.change, id, req.userId);
    res.json(withRatings(findOwn(id, req.userId)));
  });

  // Ocena karmy przez kota: 1 = 🙀 nie tknął, 2 = 😼 może być, 3 = 😻 uwielbia
  router.put('/:id/rating', validate(ratingSchema), (req, res) => {
    const id = parseId(req.params.id);
    const food = findOwn(id, req.userId);
    const cat = db
      .prepare('SELECT id FROM cats WHERE id = ? AND user_id = ?')
      .get(req.body.cat_id, req.userId);
    if (!food || !cat) return res.status(404).json({ error: 'Nie znaleziono karmy lub kota' });

    db.prepare(
      `INSERT INTO ratings (cat_id, food_id, rating) VALUES (?, ?, ?)
       ON CONFLICT (cat_id, food_id) DO UPDATE SET rating = excluded.rating`
    ).run(cat.id, id, req.body.rating);
    res.json(withRatings(food));
  });

  router.delete('/:id', (req, res) => {
    const info = db
      .prepare('DELETE FROM foods WHERE id = ? AND user_id = ?')
      .run(parseId(req.params.id), req.userId);
    if (info.changes === 0) return res.status(404).json({ error: 'Nie znaleziono karmy' });
    res.status(204).end();
  });

  return router;
}
