// Baza danych SQLite (wbudowany moduł node:sqlite – bez dodatkowych bibliotek).
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cats (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  birth_date TEXT,
  weight_kg  REAL,
  avatar     TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS foods (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand        TEXT NOT NULL,
  flavor       TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('mokra', 'sucha', 'przysmak')),
  weight_g     INTEGER NOT NULL DEFAULT 85,
  quantity     INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 2,
  price        REAL,
  expiry_date  TEXT,
  active       INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS ratings (
  cat_id  INTEGER NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
  food_id INTEGER NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  rating  INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 3),
  PRIMARY KEY (cat_id, food_id)
);

CREATE TABLE IF NOT EXISTS meals (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cat_id  INTEGER NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
  food_id INTEGER NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  date    TEXT NOT NULL,
  slot    TEXT NOT NULL CHECK (slot IN ('rano', 'wieczor')),
  served  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (cat_id, date, slot)
);

CREATE TABLE IF NOT EXISTS tasks (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cat_id   INTEGER REFERENCES cats(id) ON DELETE SET NULL,
  title    TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'inne'
           CHECK (category IN ('weterynarz', 'zakupy', 'zwirek', 'zdrowie', 'inne')),
  due_date TEXT,
  done     INTEGER NOT NULL DEFAULT 0
);
`;

export function createDb(dbPath) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

// Proste migracje dla baz założonych przed dodaniem nowych kolumn
function migrate(db) {
  const foodCols = db.prepare('PRAGMA table_info(foods)').all().map((c) => c.name);
  if (!foodCols.includes('active')) {
    // active = 0 → "nieużywana": nie kupuję jej już, więc bez alertów i listy zakupów
    db.exec('ALTER TABLE foods ADD COLUMN active INTEGER NOT NULL DEFAULT 1');
  }
}
