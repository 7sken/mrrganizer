// Konfiguracja aplikacji Express – oddzielona od server.js, żeby testy
// mogły tworzyć aplikację z bazą w pamięci.
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { requireAuth } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';
import { catsRouter } from './routes/cats.js';
import { foodsRouter } from './routes/foods.js';
import { mealsRouter } from './routes/meals.js';
import { tasksRouter } from './routes/tasks.js';
import { dashboardRouter } from './routes/dashboard.js';

export function createApp(db) {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet()); // bezpieczne nagłówki HTTP
  app.use(cors({ origin: config.corsOrigin })); // tylko nasz frontend
  app.use(express.json({ limit: '50kb' })); // limit rozmiaru żądania

  // Ochrona przed zgadywaniem haseł (brute force) – max 20 prób / 15 min
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.isTest ? 1000 : 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Za dużo prób logowania, spróbuj za kilka minut' },
  });

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authLimiter, authRouter(db));

  // Wszystko poniżej wymaga zalogowania
  app.use('/api/cats', requireAuth, catsRouter(db));
  app.use('/api/foods', requireAuth, foodsRouter(db));
  app.use('/api/meals', requireAuth, mealsRouter(db));
  app.use('/api/tasks', requireAuth, tasksRouter(db));
  app.use('/api/dashboard', requireAuth, dashboardRouter(db));

  app.use('/api', (req, res) => res.status(404).json({ error: 'Nie ma takiego endpointu' }));

  // Obsługa błędów – nie wysyłamy klientowi szczegółów (stack trace)
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Niepoprawny JSON' });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Za duże żądanie' });
    }
    if (!config.isTest) console.error(err);
    res.status(500).json({ error: 'Coś poszło nie tak po stronie serwera' });
  });

  return app;
}
