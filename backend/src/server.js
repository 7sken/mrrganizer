// Punkt startowy serwera
import { config } from './config.js';
import { createDb } from './db.js';
import { createApp } from './app.js';
import { seed } from './seed.js';

const db = createDb(config.dbPath);

// SEED_DEMO=true → przy pierwszym starcie tworzy konto demo z przykładowymi danymi
if (process.env.SEED_DEMO === 'true') {
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@mrrganizer.pl');
  if (!exists) {
    seed(db);
    console.log('🐱 Dodano konto demo: demo@mrrganizer.pl / demo1234');
  }
}

const app = createApp(db);

app.listen(config.port, () => {
  console.log(`🐾 Mrrganizer API działa na http://localhost:${config.port}`);
});
