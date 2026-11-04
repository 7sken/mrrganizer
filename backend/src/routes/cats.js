// /api/cats – CRUD kotów użytkownika (z wyglądem awatara)
import { Router } from 'express';
import { validate, parseId } from '../middleware/validate.js';
import { catSchema } from '../schemas.js';

const toCat = (row) => row && { ...row, avatar: JSON.parse(row.avatar || '{}') };

export function catsRouter(db) {
  const router = Router();

  // Każde zapytanie filtruje po user_id – użytkownik widzi tylko swoje koty
  const findOwn = (id, userId) =>
    db.prepare('SELECT * FROM cats WHERE id = ? AND user_id = ?').get(id, userId);

  router.get('/', (req, res) => {
    const rows = db.prepare('SELECT * FROM cats WHERE user_id = ? ORDER BY id').all(req.userId);
    res.json(rows.map(toCat));
  });

  router.get('/:id', (req, res) => {
    const cat = findOwn(parseId(req.params.id), req.userId);
    if (!cat) return res.status(404).json({ error: 'Nie znaleziono kota' });
    res.json(toCat(cat));
  });

  router.post('/', validate(catSchema), (req, res) => {
    const { name, birth_date, weight_kg, avatar } = req.body;
    const info = db
      .prepare(
        'INSERT INTO cats (user_id, name, birth_date, weight_kg, avatar) VALUES (?, ?, ?, ?, ?)'
      )
      .run(req.userId, name, birth_date ?? null, weight_kg ?? null, JSON.stringify(avatar));
    res.status(201).json(toCat(findOwn(Number(info.lastInsertRowid), req.userId)));
  });

  router.put('/:id', validate(catSchema), (req, res) => {
    const id = parseId(req.params.id);
    if (!findOwn(id, req.userId)) return res.status(404).json({ error: 'Nie znaleziono kota' });

    const { name, birth_date, weight_kg, avatar } = req.body;
    db.prepare(
      'UPDATE cats SET name = ?, birth_date = ?, weight_kg = ?, avatar = ? WHERE id = ? AND user_id = ?'
    ).run(name, birth_date ?? null, weight_kg ?? null, JSON.stringify(avatar), id, req.userId);
    res.json(toCat(findOwn(id, req.userId)));
  });

  router.delete('/:id', (req, res) => {
    const info = db
      .prepare('DELETE FROM cats WHERE id = ? AND user_id = ?')
      .run(parseId(req.params.id), req.userId);
    if (info.changes === 0) return res.status(404).json({ error: 'Nie znaleziono kota' });
    res.status(204).end();
  });

  return router;
}
