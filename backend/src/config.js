// Konfiguracja aplikacji – wartości brane ze zmiennych środowiskowych.
// Sekretów nie trzymamy w kodzie (patrz .env.example).

const isTest = process.env.NODE_ENV === 'test';

export const config = {
  port: Number(process.env.PORT) || 3000,
  dbPath: process.env.DB_PATH || (isTest ? ':memory:' : './data/mrrganizer.db'),
  jwtSecret: process.env.JWT_SECRET || (isTest ? 'test-secret' : ''),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  isTest,
};

if (!config.jwtSecret) {
  // Bez sekretu nie da się bezpiecznie podpisywać tokenów – lepiej nie startować.
  console.error('Brak zmiennej JWT_SECRET. Skopiuj .env.example do .env i ustaw sekret.');
  process.exit(1);
}
