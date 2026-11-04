// /api/dashboard – podsumowanie na pulpit + "nastrój" kociej mordki
import { Router } from 'express';
import { addDays } from '../planner.js';

export function computeMood({ lowStock, expired, overdueTasks, totalUnits }) {
  if (totalUnits === 0 || expired > 0) return 'sad';
  if (lowStock > 0 || overdueTasks > 0) return 'meh';
  return 'happy';
}

export function dashboardRouter(db) {
  const router = Router();

  router.get('/', (req, res) => {
    const uid = req.userId;
    const today = /^\d{4}-\d{2}-\d{2}$/.test(req.query.today)
      ? req.query.today
      : new Date().toISOString().slice(0, 10);
    const soon = addDays(today, 14);

    const cats = db.prepare('SELECT COUNT(*) AS n FROM cats WHERE user_id = ?').get(uid).n;
    const stock = db
      .prepare('SELECT COUNT(*) AS kinds, COALESCE(SUM(quantity), 0) AS units FROM foods WHERE user_id = ?')
      .get(uid);

    const lowStock = db
      .prepare(
        'SELECT id, brand, flavor, quantity, min_quantity FROM foods WHERE user_id = ? AND quantity <= min_quantity ORDER BY quantity'
      )
      .all(uid);

    const expiring = db
      .prepare(
        `SELECT id, brand, flavor, expiry_date, quantity FROM foods
         WHERE user_id = ? AND quantity > 0 AND expiry_date IS NOT NULL AND expiry_date <= ?
         ORDER BY expiry_date`
      )
      .all(uid, soon);

    const todayMeals = db
      .prepare(
        `SELECT m.id, m.slot, m.served, m.cat_id, c.name AS cat_name, f.brand, f.flavor
         FROM meals m JOIN cats c ON c.id = m.cat_id JOIN foods f ON f.id = m.food_id
         WHERE m.user_id = ? AND m.date = ? ORDER BY CASE m.slot WHEN 'rano' THEN 0 ELSE 1 END, c.name`
      )
      .all(uid, today);

    const tasks = db
      .prepare(
        `SELECT id, title, category, due_date FROM tasks
         WHERE user_id = ? AND done = 0 AND due_date IS NOT NULL AND due_date <= ?
         ORDER BY due_date`
      )
      .all(uid, addDays(today, 3));

    const favourite = db
      .prepare(
        `SELECT f.brand, f.flavor, AVG(r.rating) AS avg, COUNT(*) AS votes
         FROM ratings r JOIN foods f ON f.id = r.food_id
         WHERE f.user_id = ? GROUP BY f.id ORDER BY avg DESC, votes DESC LIMIT 1`
      )
      .get(uid);

    const expired = expiring.filter((f) => f.expiry_date < today).length;
    const overdueTasks = tasks.filter((t) => t.due_date < today).length;

    res.json({
      today,
      counts: { cats, foodKinds: stock.kinds, units: stock.units },
      lowStock,
      expiring,
      todayMeals,
      tasks,
      favourite: favourite || null,
      mood: computeMood({
        lowStock: lowStock.length,
        expired,
        overdueTasks,
        totalUnits: stock.units,
      }),
    });
  });

  return router;
}
