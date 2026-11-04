// /api/tasks – lista zadań (weterynarz, żwirek, zakupy...)
import { Router } from 'express';
import { validate, parseId } from '../middleware/validate.js';
import { taskSchema } from '../schemas.js';

const TASK_SELECT = `
  SELECT t.*, c.name AS cat_name FROM tasks t
  LEFT JOIN cats c ON c.id = t.cat_id
`;

const toTask = (row) => row && { ...row, done: Boolean(row.done) };

export function tasksRouter(db) {
  const router = Router();

  const findOwn = (id, userId) =>
    toTask(db.prepare(`${TASK_SELECT} WHERE t.id = ? AND t.user_id = ?`).get(id, userId));

  // Kot przypisany do zadania musi należeć do tego samego użytkownika
  const catAllowed = (catId, userId) =>
    catId == null || db.prepare('SELECT id FROM cats WHERE id = ? AND user_id = ?').get(catId, userId);

  router.get('/', (req, res) => {
    const rows = db
      .prepare(
        `${TASK_SELECT} WHERE t.user_id = ?
         ORDER BY t.done ASC, t.due_date IS NULL, t.due_date ASC, t.id DESC`
      )
      .all(req.userId);
    res.json(rows.map(toTask));
  });

  router.post('/', validate(taskSchema), (req, res) => {
    const t = req.body;
    if (!catAllowed(t.cat_id, req.userId)) return res.status(404).json({ error: 'Nie znaleziono kota' });

    const info = db
      .prepare(
        'INSERT INTO tasks (user_id, cat_id, title, category, due_date, done) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(req.userId, t.cat_id ?? null, t.title, t.category, t.due_date ?? null, t.done ? 1 : 0);
    res.status(201).json(findOwn(Number(info.lastInsertRowid), req.userId));
  });

  router.put('/:id', validate(taskSchema), (req, res) => {
    const id = parseId(req.params.id);
    if (!findOwn(id, req.userId)) return res.status(404).json({ error: 'Nie znaleziono zadania' });
    const t = req.body;
    if (!catAllowed(t.cat_id, req.userId)) return res.status(404).json({ error: 'Nie znaleziono kota' });

    db.prepare(
      `UPDATE tasks SET cat_id = ?, title = ?, category = ?, due_date = ?, done = ?
       WHERE id = ? AND user_id = ?`
    ).run(t.cat_id ?? null, t.title, t.category, t.due_date ?? null, t.done ? 1 : 0, id, req.userId);
    res.json(findOwn(id, req.userId));
  });

  router.patch('/:id/toggle', (req, res) => {
    const id = parseId(req.params.id);
    if (!findOwn(id, req.userId)) return res.status(404).json({ error: 'Nie znaleziono zadania' });
    db.prepare('UPDATE tasks SET done = 1 - done WHERE id = ? AND user_id = ?').run(id, req.userId);
    res.json(findOwn(id, req.userId));
  });

  router.delete('/:id', (req, res) => {
    const info = db
      .prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?')
      .run(parseId(req.params.id), req.userId);
    if (info.changes === 0) return res.status(404).json({ error: 'Nie znaleziono zadania' });
    res.status(204).end();
  });

  return router;
}
