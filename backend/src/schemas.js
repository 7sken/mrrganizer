// Schematy walidacji (Zod) dla wszystkich zasobów API.
import { z } from 'zod';

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data w formacie RRRR-MM-DD');
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Kolor w formacie #RRGGBB');

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Niepoprawny e-mail').max(120),
  name: z.string().trim().min(2, 'Imię min. 2 znaki').max(40),
  password: z.string().min(8, 'Hasło min. 8 znaków').max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Niepoprawny e-mail'),
  password: z.string().min(1, 'Podaj hasło'),
});

// Wygląd kota – rysowany na froncie jako SVG
export const avatarSchema = z.object({
  fur: color.default('#f4a261'),
  pattern: z.enum(['jednolity', 'pregi', 'laty', 'skarpetki']).default('jednolity'),
  patternColor: color.default('#8d5524'),
  eyes: color.default('#7cb342'),
  accessory: z.enum(['brak', 'kokardka', 'obroza', 'czapka', 'okulary']).default('brak'),
});

export const catSchema = z.object({
  name: z.string().trim().min(1, 'Podaj imię kota').max(30),
  birth_date: date.nullable().optional(),
  weight_kg: z.number().positive().max(20).nullable().optional(),
  avatar: avatarSchema.prefault({}),
});

export const foodSchema = z.object({
  brand: z.string().trim().min(1, 'Podaj markę').max(50),
  flavor: z.string().trim().min(1, 'Podaj smak').max(60),
  type: z.enum(['mokra', 'sucha', 'przysmak']),
  weight_g: z.number().int().positive().max(20000).default(85),
  quantity: z.number().int().min(0).max(9999).default(0),
  min_quantity: z.number().int().min(0).max(999).default(2),
  price: z.number().min(0).max(10000).nullable().optional(),
  expiry_date: date.nullable().optional(),
});

export const quantitySchema = z.object({
  change: z.number().int().min(-999).max(999),
});

export const ratingSchema = z.object({
  cat_id: z.number().int().positive(),
  rating: z.number().int().min(1).max(3),
});

export const mealSchema = z.object({
  cat_id: z.number().int().positive(),
  food_id: z.number().int().positive(),
  date,
  slot: z.enum(['rano', 'wieczor']),
});

export const generatePlanSchema = z.object({
  start: date,
  days: z.number().int().min(1).max(14).default(7),
});

export const taskSchema = z.object({
  title: z.string().trim().min(1, 'Podaj treść zadania').max(120),
  category: z.enum(['weterynarz', 'zakupy', 'zwirek', 'zdrowie', 'inne']).default('inne'),
  due_date: date.nullable().optional(),
  cat_id: z.number().int().positive().nullable().optional(),
  done: z.boolean().default(false),
});
