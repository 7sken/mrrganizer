// Logika "Losuj mi menu" – wydzielona, żeby łatwo ją testować.

export function addDays(isoDate, n) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Waga losowania wg oceny kota: 😻 = 4, brak oceny = 2, 😼 = 1, 🙀 = 0 (pomijamy)
export function weightFor(rating) {
  if (rating === 3) return 4;
  if (rating === 2) return 1;
  if (rating === 1) return 0;
  return 2;
}

/**
 * Wybiera karmę na posiłek:
 *  - tylko karmy, których jeszcze są sztuki (stock),
 *  - pomija karmy, których kot nie lubi,
 *  - nie daje dwa razy z rzędu tego samego (jeśli jest wybór),
 *  - ulubione karmy mają większą szansę.
 */
export function pickFood(foods, catRatings, stock, previousId, random = Math.random) {
  let candidates = foods
    .filter((f) => (stock.get(f.id) ?? 0) > 0)
    .map((f) => ({ food: f, weight: weightFor(catRatings[f.id]) }))
    .filter((c) => c.weight > 0);

  if (candidates.length > 1) {
    candidates = candidates.filter((c) => c.food.id !== previousId);
  }
  if (!candidates.length) return null;

  const total = candidates.reduce((s, c) => s + c.weight, 0);
  let roll = random() * total;
  for (const c of candidates) {
    roll -= c.weight;
    if (roll < 0) return c.food;
  }
  return candidates[candidates.length - 1].food;
}
