// Dane demonstracyjne do prezentacji: npm run seed
// Konto: demo@mrrganizer.pl / demo1234
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { createDb } from './db.js';
import { addDays } from './planner.js';

export function seed(db, today = new Date().toISOString().slice(0, 10)) {
  const email = 'demo@mrrganizer.pl';
  db.prepare('DELETE FROM users WHERE email = ?').run(email);

  const userId = Number(
    db
      .prepare('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)')
      .run(email, 'Demo', bcrypt.hashSync('demo1234', 10)).lastInsertRowid
  );

  const addCat = (name, birth, weight, avatar) =>
    Number(
      db
        .prepare('INSERT INTO cats (user_id, name, birth_date, weight_kg, avatar) VALUES (?, ?, ?, ?, ?)')
        .run(userId, name, birth, weight, JSON.stringify(avatar)).lastInsertRowid
    );

  const filemon = addCat('Filemon', '2021-05-12', 4.8, {
    fur: '#f4a261', pattern: 'pregi', patternColor: '#c4661f', eyes: '#7cb342', accessory: 'obroza',
  });
  const luna = addCat('Luna', '2022-09-03', 3.6, {
    fur: '#3d3d4e', pattern: 'skarpetki', patternColor: '#ffffff', eyes: '#fbc02d', accessory: 'kokardka',
  });

  const foods = [
    ['Animonda Carny', 'Wołowina z kurczakiem', 'mokra', 200, 6, 2, 7.49, addDays(today, 300)],
    ['Animonda Carny', 'Indyk z królikiem', 'mokra', 200, 1, 2, 7.49, addDays(today, 250)],
    ['MAC\'s', 'Kaczka i indyk', 'mokra', 400, 4, 2, 13.99, addDays(today, 10)],
    ['Feringa', 'Łosoś z dynią', 'mokra', 85, 9, 3, 4.29, addDays(today, 180)],
    ['Catz Finefood', 'Drób No.3', 'mokra', 200, 0, 2, 12.5, addDays(today, 400)],
    ['Purina One', 'Sterilcat łosoś', 'sucha', 1500, 1, 1, 54.99, addDays(today, 120)],
    ['Dreamies', 'Ser', 'przysmak', 60, 3, 1, 6.99, addDays(today, -3)],
  ];
  const foodIds = foods.map((f) =>
    Number(
      db
        .prepare(
          `INSERT INTO foods (user_id, brand, flavor, type, weight_g, quantity, min_quantity, price, expiry_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(userId, ...f).lastInsertRowid
    )
  );

  const rate = (cat, food, r) =>
    db.prepare('INSERT INTO ratings (cat_id, food_id, rating) VALUES (?, ?, ?)').run(cat, foodIds[food], r);
  rate(filemon, 0, 3); rate(filemon, 2, 3); rate(filemon, 3, 1); rate(filemon, 6, 3);
  rate(luna, 0, 2); rate(luna, 1, 3); rate(luna, 3, 3); rate(luna, 2, 1);

  const addTask = (title, category, due, cat = null, done = 0) =>
    db
      .prepare('INSERT INTO tasks (user_id, cat_id, title, category, due_date, done) VALUES (?, ?, ?, ?, ?, ?)')
      .run(userId, cat, title, category, due, done);
  addTask('Szczepienie Luny', 'weterynarz', addDays(today, 2), luna);
  addTask('Wymienić żwirek', 'zwirek', today);
  addTask('Odrobaczanie Filemona', 'zdrowie', addDays(today, 12), filemon);
  addTask('Zamówić karmę na Zooplus', 'zakupy', addDays(today, -1));
  addTask('Obciąć pazurki', 'inne', null, filemon, 1);

  return userId;
}

// Uruchomione bezpośrednio: node src/seed.js
if (import.meta.url === `file://${process.argv[1]}`) {
  const db = createDb(config.dbPath);
  seed(db);
  console.log('🐱 Dane demo dodane. Zaloguj się: demo@mrrganizer.pl / demo1234');
}
