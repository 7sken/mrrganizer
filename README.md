# 🐱 Mrrganizer – kocia spiżarnia i planer

Aplikacja webowa dla właścicieli kotów (i ich kolekcji karm). Pozwala:

- prowadzić **spiżarnię karm** – marka, smak, rodzaj, ile sztuk zostało, data ważności, cena,
- zbierać **oceny kotów** dla każdej karmy: 🙀 nie tknął / 😼 może być / 😻 uwielbia,
- układać **plan karmienia** na tydzień (rano / wieczór) – ręcznie albo przyciskiem **„Losuj menu”**,
- odhaczać posiłki jako **podane** – puszka sama znika ze stanu,
- prowadzić **listę zadań** (weterynarz, żwirek, odrobaczanie…) i automatyczną **listę zakupów**,
- oznaczać karmy jako **nieużywane** (już ich nie kupujesz) – znikają z alertów i listy zakupów, ale zostają w spiżarni z ocenami,
- tworzyć **awatary kotów** w kreatorze (futro, umaszczenie, oczy, dodatki).

Kocia mordka jest interaktywna: oczy śledzą kursor, kot mruga, po kliknięciu mruczy, a jego nastrój zależy od stanu spiżarni. Przy wpisywaniu hasła zasłania oczy łapkami 🙈

## Aplikacja na telefon (PWA)

Mrrganizer działa jak aplikacja bez App Store / Google Play:

- **iPhone (Safari):** Udostępnij → **Do ekranu początkowego**
- **Android / Chrome:** przycisk **Zainstaluj** w banerze albo menu → „Zainstaluj aplikację”

Po instalacji otwiera się na pełnym ekranie z własną ikonką, a interfejs ładuje się nawet bez internetu (dane zawsze idą z serwera). Pełne PWA (service worker) wymaga HTTPS – lokalnie działa na `localhost`, na telefonie po wystawieniu aplikacji pod domeną z certyfikatem.

## Frameworki

| Rola | Framework | Do czego |
|---|---|---|
| Aplikacyjny (backend) | **Express** (Node.js) | API REST, routing, middleware |
| UI (frontend) | **React** + **Material UI** | interfejs, komponenty, motyw |
| Testowy | **Vitest** (+ Supertest, Testing Library) | testy API, logiki i komponentów |

Dodatkowo: Vite (budowanie frontendu), Zod (walidacja), SQLite (`node:sqlite`, wbudowany w Node 22), Docker.

## Uruchomienie

### Docker (najprościej)

```bash
cp .env.example .env        # Windows: copy .env.example .env
docker compose up --build
```

Aplikacja: **http://localhost:8080**

### Bez Dockera (Node.js 22.13 lub nowszy)

```bash
# terminal 1 – backend
cd backend
cp .env.example .env
npm install
npm run seed        # opcjonalnie: dane demo
npm run dev         # http://localhost:3000

# terminal 2 – frontend
cd frontend
npm install
npm run dev         # http://localhost:5173
```

**Konto demo:** `demo@mrrganizer.pl` / `demo1234` (2 koty, 7 karm, zadania).

## Testy

```bash
cd backend  && npm test     # 47 testów – API, autoryzacja, izolacja danych, planer, migracja bazy
cd frontend && npm test     # 22 testy – komponent CatFace, logowanie, walidacja, baner PWA
```

## API REST

Wszystkie endpointy poza `/api/auth/*` i `/api/health` wymagają nagłówka `Authorization: Bearer <token>`.

| Metoda | Endpoint | Opis |
|---|---|---|
| POST | `/api/auth/register` | rejestracja → token |
| POST | `/api/auth/login` | logowanie → token |
| GET | `/api/auth/me` | dane zalogowanego |
| GET / POST | `/api/cats` | lista / dodanie kota |
| GET / PUT / DELETE | `/api/cats/:id` | szczegóły / edycja / usunięcie |
| GET / POST | `/api/foods` | lista karm (`?type=mokra&q=szukaj`) / dodanie |
| GET / PUT / DELETE | `/api/foods/:id` | szczegóły / edycja / usunięcie |
| PATCH | `/api/foods/:id/quantity` | zmiana stanu `{ change: -1 }` |
| PATCH | `/api/foods/:id/active` | używana / nieużywana `{ active: false }` |
| PUT | `/api/foods/:id/rating` | ocena kota `{ cat_id, rating: 1-3 }` |
| GET | `/api/foods/shopping-list` | lista zakupów (to, co się kończy) |
| GET / POST | `/api/meals` | plan (`?start=&end=`) / dodanie posiłku |
| POST | `/api/meals/generate` | „Losuj menu” `{ start, days }` |
| PATCH | `/api/meals/:id/serve` | podane / cofnij |
| DELETE | `/api/meals/:id` | usunięcie z planu |
| GET / POST | `/api/tasks` | lista / dodanie zadania |
| PUT / DELETE | `/api/tasks/:id` | edycja / usunięcie |
| PATCH | `/api/tasks/:id/toggle` | zrobione / niezrobione |
| GET | `/api/dashboard` | podsumowanie na pulpit + nastrój kota |

Kody odpowiedzi: `200/201/204` – OK, `400` – złe dane, `401` – brak logowania, `404` – nie istnieje (lub cudze), `409` – e-mail zajęty, `429` – za dużo prób logowania.

## Bezpieczeństwo

- **Hasła** hashowane bcryptem (z solą), nigdy nie są zapisywane ani zwracane jawnie.
- **JWT** – token z czasem wygaśnięcia; sekret tylko w zmiennej środowiskowej (`.env` nie trafia do repo).
- **Autoryzacja** – każde zapytanie do bazy filtruje po `user_id`, więc nie da się podejrzeć ani zmienić cudzych danych (cudze ID → 404).
- **Walidacja** wszystkich danych wejściowych (Zod) po stronie serwera + walidacja formularzy na froncie.
- **SQL injection** – wyłącznie zapytania parametryzowane (`?`).
- **Brute force** – limit 20 prób logowania na 15 minut (express-rate-limit).
- **Nagłówki HTTP** – Helmet (backend) i nagłówki w nginx; ukryty `X-Powered-By`.
- **CORS** ograniczony do adresu frontendu, limit rozmiaru żądania 50 kB.
- **Błędy** – klient nie dostaje stack trace'ów; ten sam komunikat dla złego e-maila i hasła.
- **XSS** – React domyślnie escapuje dane wyświetlane w interfejsie.
- Kontener backendu działa jako **użytkownik bez uprawnień root**.

## Struktura

```
mrrganizer/
├── backend/                 # Express + SQLite
│   ├── src/
│   │   ├── app.js           # konfiguracja Express (middleware, routery)
│   │   ├── server.js        # start serwera
│   │   ├── db.js            # schemat bazy
│   │   ├── schemas.js       # walidacja Zod
│   │   ├── planner.js       # algorytm „Losuj menu”
│   │   ├── middleware/      # auth (JWT), validate
│   │   └── routes/          # auth, cats, foods, meals, tasks, dashboard
│   └── tests/               # Vitest + Supertest
├── frontend/                # React + Material UI (Vite)
│   └── src/
│       ├── components/      # CatFace (SVG), FoodIcon, CatEditor, Layout…
│       ├── pages/           # Pulpit, Koty, Spiżarnia, Planer, Zadania, Logowanie
│       ├── lib/             # klient API, kontekst logowania, utils
│       └── test/            # Vitest + Testing Library
└── docker-compose.yml
```

## Etapy projektu

1. **Aplikacja i API REST** – backend Express, baza, logowanie JWT, CRUD kotów, karm, posiłków i zadań.
2. **Interfejs (framework UI)** – React + Material UI, interaktywne SVG, kreator kota, responsywność (telefon: dolne menu).
3. **Testy, bezpieczeństwo, uruchomienie** – 69 testów w Vitest, zabezpieczenia z listy wyżej, Docker Compose, PWA.
