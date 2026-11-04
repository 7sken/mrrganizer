// /api/auth – rejestracja, logowanie, dane zalogowanego użytkownika
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { validate } from '../middleware/validate.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { registerSchema, loginSchema } from '../schemas.js';

export function authRouter(db) {
  const router = Router();

  router.post('/register', validate(registerSchema), (req, res) => {
    const { email, name, password } = req.body;

    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (exists) {
      return res.status(409).json({ error: 'Konto z tym e-mailem już istnieje' });
    }

    // Hasło zapisujemy wyłącznie jako hash bcrypt (z solą), nigdy jawnie
    const hash = bcrypt.hashSync(password, 10);
    const info = db
      .prepare('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)')
      .run(email, name, hash);

    const user = { id: Number(info.lastInsertRowid), email, name };
    res.status(201).json({ token: signToken(user), user });
  });

  router.post('/login', validate(loginSchema), (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    // Ten sam komunikat dla złego e-maila i hasła – nie zdradzamy, które konta istnieją
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Nieprawidłowy e-mail lub hasło' });
    }

    res.json({
      token: signToken(user),
      user: { id: user.id, email: user.email, name: user.name },
    });
  });

  router.get('/me', requireAuth, (req, res) => {
    const user = db
      .prepare('SELECT id, email, name, created_at FROM users WHERE id = ?')
      .get(req.userId);
    if (!user) return res.status(404).json({ error: 'Użytkownik nie istnieje' });
    res.json(user);
  });

  return router;
}
