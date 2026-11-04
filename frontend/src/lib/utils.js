// Drobne funkcje pomocnicze (daty, teksty, losowy wygląd kota).

export const todayIso = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export function addDays(iso, n) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Poniedziałek tygodnia, w którym jest podana data
export function startOfWeek(iso) {
  const d = new Date(`${iso}T12:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  return addDays(iso, -day);
}

export function daysBetween(fromIso, toIso) {
  return Math.round((new Date(`${toIso}T12:00:00Z`) - new Date(`${fromIso}T12:00:00Z`)) / 86400000);
}

const DAY_NAMES = ['niedz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'];
export function formatDay(iso) {
  const d = new Date(`${iso}T12:00:00Z`);
  return `${DAY_NAMES[d.getUTCDay()]} ${d.getUTCDate()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

// "za 3 dni", "dziś", "2 dni temu"
export function relativeDays(iso, today = todayIso()) {
  const n = daysBetween(today, iso);
  if (n === 0) return 'dziś';
  if (n === 1) return 'jutro';
  if (n === -1) return 'wczoraj';
  if (n > 0) return `za ${n} dni`;
  return `${-n} dni temu`;
}

export function catAge(birthDate, today = todayIso()) {
  if (!birthDate) return null;
  const months = Math.floor(daysBetween(birthDate, today) / 30.44);
  if (months < 12) return `${months} mies.`;
  const years = Math.floor(months / 12);
  return years === 1 ? '1 rok' : years < 5 ? `${years} lata` : `${years} lat`;
}

// Status karmy na podstawie stanu i daty ważności
export function foodStatus(food, today = todayIso()) {
  if (food.active === false) return 'inactive'; // nie kupuję jej już – bez alertów
  if (food.expiry_date && food.quantity > 0 && food.expiry_date < today) return 'expired';
  if (food.quantity === 0) return 'empty';
  if (food.quantity <= food.min_quantity) return 'low';
  if (food.expiry_date && daysBetween(today, food.expiry_date) <= 14) return 'expiring';
  return 'ok';
}

export const FUR_COLORS = ['#f4a261', '#3d3d4e', '#ffffff', '#9e9e9e', '#d7b899', '#6d4c41', '#ffcc80', '#212121'];
export const EYE_COLORS = ['#7cb342', '#fbc02d', '#42a5f5', '#ff8f00', '#8d6e63', '#26a69a'];
export const PATTERNS = [
  { value: 'jednolity', label: 'Jednolity' },
  { value: 'pregi', label: 'Pręgowany' },
  { value: 'laty', label: 'Łaciaty' },
  { value: 'skarpetki', label: 'Biały pyszczek' },
];
export const ACCESSORIES = [
  { value: 'brak', label: 'Brak' },
  { value: 'kokardka', label: 'Kokardka' },
  { value: 'obroza', label: 'Obroża z dzwonkiem' },
  { value: 'czapka', label: 'Czapka imprezowa' },
  { value: 'okulary', label: 'Okulary' },
];

export const DEFAULT_AVATAR = {
  fur: '#f4a261',
  pattern: 'jednolity',
  patternColor: '#8d5524',
  eyes: '#7cb342',
  accessory: 'brak',
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export function randomAvatar() {
  return {
    fur: pick(FUR_COLORS),
    pattern: pick(PATTERNS).value,
    patternColor: pick(FUR_COLORS),
    eyes: pick(EYE_COLORS),
    accessory: pick(ACCESSORIES).value,
  };
}

// 3 → "3", 2.5 → "2,5", 2.6667 → "2,7"
export const formatRating = (avg) =>
  Number(avg).toLocaleString('pl-PL', { maximumFractionDigits: 1 });

export const RATINGS = [
  { value: 1, emoji: '🙀', label: 'Nie tknął' },
  { value: 2, emoji: '😼', label: 'Może być' },
  { value: 3, emoji: '😻', label: 'Uwielbia' },
];

export const TASK_CATEGORIES = {
  weterynarz: { label: 'Weterynarz', emoji: '🩺' },
  zdrowie: { label: 'Zdrowie', emoji: '💊' },
  zwirek: { label: 'Żwirek', emoji: '🧹' },
  zakupy: { label: 'Zakupy', emoji: '🛒' },
  inne: { label: 'Inne', emoji: '🐾' },
};

export const FOOD_TYPES = {
  mokra: 'Mokra',
  sucha: 'Sucha',
  przysmak: 'Przysmak',
};
