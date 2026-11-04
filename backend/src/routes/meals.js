// /api/meals – planer karmienia (rano / wieczór), losowanie menu, "podane"
import { Router } from 'express';
import { validate, parseId } from '../middleware/validate.js';
import { mealSchema, generatePlanSchema } from '../schemas.js';
import { addDays, pickFood } from '../planner.js';

const MEAL_SELECT = `
  SELECT m.*, f.brand, f.flavor, f.type, c.name AS cat_name
  FROM meals m
  JOIN foods f ON f.id = m.food_id
  JOIN cats c ON c.id = m.cat_id
`;

export function mealsRouter(db) {
  const router = Router();

  const findOwn = (id, userId) =>
    db.prepare(`${MEAL_SELECT} WHERE m.id = ? AND m.user_id = ?`).get(id, userId);

  // Prosta transakcja – albo wszystko się zapisze, albo nic
  const transaction = (fn) => {
    db.exec('BEGIN');
    try {
      const result = fn();
      db.exec('COMMIT');
      return result;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  };

  router.get('/', (req, res) => {
    const start = /^\d{4}-\d{2}-\d{2}$/.test(req.query.start) ? req.query.start : '0000-01-01';
    const end = /^\d{4}-\d{2}-\d{2}$/.test(req.query.end) ? req.query.end : '9999-12-31';
    const rows = db
      .prepare(`${MEAL_SELECT} WHERE m.user_id = ? AND m.date BETWEEN ? AND ? ORDER BY m.date, CASE m.slot WHEN 'rano' THEN 0 ELSE 1 END`)
      .all(req.userId, start, end);
    res.json(rows);
  });

  // Dodaje lub podmienia posiłek dla kota w danym dniu i porze
  router.post('/', validate(mealSchema), (req, res) => {
    const { cat_id, food_id, date, slot } = req.body;
    const cat = db.prepare('SELECT id FROM cats WHERE id = ? AND user_id = ?').get(cat_id, req.userId);
    const food = db.prepare('SELECT id FROM foods WHERE id = ? AND user_id = ?').get(food_id, req.userId);
    if (!cat || !food) return res.status(404).json({ error: 'Nie znaleziono kota lub karmy' });

    db.prepare(
      `INSERT INTO meals (user_id, cat_id, food_id, date, slot) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (cat_id, date, slot) DO UPDATE SET food_id = excluded.food_id, served = 0`
    ).run(req.userId, cat_id, food_id, date, slot);

    const meal = db
      .prepare(`${MEAL_SELECT} WHERE m.cat_id = ? AND m.date = ? AND m.slot = ?`)
      .get(cat_id, date, slot);
    res.status(201).json(meal);
  });

  // "Losuj mi menu" – układa plan na N dni dla wszystkich kotów
  router.post('/generate', validate(generatePlanSchema), (req, res) => {
    const { start, days } = req.body;
    const cats = db.prepare('SELECT id FROM cats WHERE user_id = ?').all(req.userId);
    const foods = db
      // do losowania bierzemy tylko mokre karmy (puszka/saszetka = 1 posiłek)
      .prepare("SELECT * FROM foods WHERE user_id = ? AND type = 'mokra'")
      .all(req.userId);

    if (!cats.length) return res.status(400).json({ error: 'Najpierw dodaj kota' });
    if (!foods.length) return res.status(400).json({ error: 'Brak mokrych karm w spiżarni' });

    const ratings = db
      .prepare(
        'SELECT r.* FROM ratings r JOIN cats c ON c.id = r.cat_id WHERE c.user_id = ?'
      )
      .all(req.userId);

    // Ile sztuk każdej karmy zostało (minus już zaplanowane, niepodane posiłki)
    const stock = new Map(foods.map((f) => [f.id, f.quantity]));

    const created = transaction(() => {
      // Usuwamy niepodane posiłki z tego zakresu – podanych nie ruszamy
      const end = addDays(start, days - 1);
      db.prepare(
        'DELETE FROM meals WHERE user_id = ? AND served = 0 AND date BETWEEN ? AND ?'
      ).run(req.userId, start, end);

      const servedSlots = new Set(
        db
          .prepare('SELECT cat_id, date, slot FROM meals WHERE user_id = ? AND date BETWEEN ? AND ?')
          .all(req.userId, start, end)
          .map((m) => `${m.cat_id}|${m.date}|${m.slot}`)
      );

      const insert = db.prepare(
        'INSERT INTO meals (user_id, cat_id, food_id, date, slot) VALUES (?, ?, ?, ?, ?)'
      );
      let count = 0;

      // Pętla: dzień → pora → kot, żeby koty "dzieliły się" spiżarnią po równo
      const catRatings = Object.fromEntries(
        cats.map((cat) => [
          cat.id,
          Object.fromEntries(ratings.filter((r) => r.cat_id === cat.id).map((r) => [r.food_id, r.rating])),
        ])
      );
      const previous = {};

      for (let d = 0; d < days; d++) {
        const date = addDays(start, d);
        for (const slot of ['rano', 'wieczor']) {
          for (const cat of cats) {
            if (servedSlots.has(`${cat.id}|${date}|${slot}`)) continue;
            const food = pickFood(foods, catRatings[cat.id], stock, previous[cat.id]);
            if (!food) continue;
            insert.run(req.userId, cat.id, food.id, date, slot);
            stock.set(food.id, stock.get(food.id) - 1);
            previous[cat.id] = food.id;
            count++;
          }
        }
      }
      return count;
    });

    res.status(201).json({ created });
  });

  // Oznacz jako podane (zdejmuje 1 sztukę ze stanu) lub cofnij.
  // Sucha karma to worek na wiele posiłków – jej stanu nie zmieniamy.
  router.patch('/:id/serve', (req, res) => {
    const id = parseId(req.params.id);
    const meal = findOwn(id, req.userId);
    if (!meal) return res.status(404).json({ error: 'Nie znaleziono posiłku' });

    const served = meal.served ? 0 : 1;
    transaction(() => {
      db.prepare('UPDATE meals SET served = ? WHERE id = ?').run(served, id);
      if (meal.type !== 'sucha') {
        db.prepare('UPDATE foods SET quantity = MAX(0, quantity + ?) WHERE id = ?').run(
          served ? -1 : 1,
          meal.food_id
        );
      }
    });
    res.json(findOwn(id, req.userId));
  });

  router.delete('/:id', (req, res) => {
    const info = db
      .prepare('DELETE FROM meals WHERE id = ? AND user_id = ?')
      .run(parseId(req.params.id), req.userId);
    if (info.changes === 0) return res.status(404).json({ error: 'Nie znaleziono posiłku' });
    res.status(204).end();
  });

  return router;
}
