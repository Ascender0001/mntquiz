# Nyárhangoló kvíz

A summer-themed, location-based quiz web game for on-site events at Lake Palić. Visitors register,
answer a set of questions, and — if they pass — have their contact details stored for
follow-up. Participation is **geofenced**: only people physically within a configured
radius of the event can play. Includes an admin panel for managing questions, reviewing
submissions, configuring the geofence/scoring, and exporting successful participants to CSV.

The interface is in **Hungarian**.

## Stack

- **Next.js 15** (App Router) — participant front-end + admin panel + API routes
- **Prisma + PostgreSQL** — data layer (handles concurrent on-site submissions)
- **Tailwind CSS** — clean, mobile-first, institutional styling
- **jose** — signed admin session cookie

## Prerequisites

- Node.js 20+
- Docker (for the local PostgreSQL instance) — or your own PostgreSQL

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Copy env and adjust secrets
cp .env.example .env
#   - set ADMIN_PASSWORD and a long random AUTH_SECRET

# 3. Start PostgreSQL
docker compose up -d

# 4. Create the schema and seed demo questions + default config
npm run db:migrate     # creates tables (name the migration e.g. "init")
npm run db:seed

# 5. Run the app
npm run dev
```

- Participant game: <http://localhost:3002>
- Admin panel: <http://localhost:3002/admin> (log in with `ADMIN_PASSWORD`)

## Configuration

All per-event settings live in the **Config** table (single row) and are editable from
the admin panel under **Configuration**:

- **Geofence** — center latitude/longitude and radius in metres (default: Lake Palić, 500 m)
- **Passing score** — number of correct answers required to pass
- **Questions per quiz** — how many active questions are served

Secrets live in `.env`:

| Variable                     | Purpose                                             |
| ---------------------------- | --------------------------------------------------- |
| `DATABASE_URL`               | PostgreSQL connection (pooled) — app runtime        |
| `DIRECT_URL`                 | PostgreSQL connection (direct) — Prisma migrations  |
| `ADMIN_PASSWORD`             | Password for the admin panel                        |
| `AUTH_SECRET`                | Secret used to sign the admin session               |
| `NEXT_PUBLIC_DISABLE_GEOFENCE` | `"true"` skips the location check (testing)       |

## Deploy to Vercel + Neon (free)

1. **Create a Neon project** at [neon.tech](https://neon.tech). From the dashboard copy **two** connection strings:
   - the **Pooled** connection → `DATABASE_URL`
   - the **Direct** connection → `DIRECT_URL`
2. **Import this repo** into [Vercel](https://vercel.com) (Add New → Project → pick the GitHub repo).
3. In the Vercel project **Settings → Environment Variables**, add:
   - `DATABASE_URL` = Neon pooled string
   - `DIRECT_URL` = Neon direct string
   - `AUTH_SECRET` = a long random value (`openssl rand -base64 32`)
   - `ADMIN_PASSWORD` = your chosen admin password
   - `NEXT_PUBLIC_DISABLE_GEOFENCE` = `true` (for off-site testing) or `false`
4. **Deploy.** The build runs `prisma generate && next build`. Only `DATABASE_URL` is needed
   at runtime.

> **Schema setup:** run migrations once against Neon before/after first deploy (from your
> machine, with the env vars set):
>
> ```bash
> DATABASE_URL="<neon-pooled>" DIRECT_URL="<neon-direct>" npx prisma migrate deploy
> DATABASE_URL="<neon-pooled>" DIRECT_URL="<neon-direct>" npx prisma db seed
> ```
>
> Re-run these whenever you change `schema.prisma`. `DIRECT_URL` (Neon's non-pooled string)
> is only needed for these migration commands, not at runtime.

**Note:** Vercel runs serverless functions, so the in-memory rate limiter resets between
requests (it won't actually throttle). Fine for testing; for the live event use a persistent
host or back the limiter with Redis.

## How it works

- **Geofencing** is enforced both client-side (friendly gating before play) and
  **server-side** on submit — a submission from outside the radius is rejected.
- **Scoring** happens entirely on the server; correct answers are never sent to the
  browser (the `/api/quiz` endpoint omits `isCorrect`).
- The **submissions view** and CSV export intentionally expose only registration data
  + pass/fail + score — never the individual answers a participant gave.
- The **CSV export** (passed participants only) is UTF-8 with a BOM so Hungarian/Serbian
  characters render correctly in Excel.

## Useful scripts

| Script            | Description                             |
| ----------------- | --------------------------------------- |
| `npm run dev`     | Start the dev server                    |
| `npm run build`   | Production build                        |
| `npm run db:migrate` | Create/apply a dev migration         |
| `npm run db:seed` | Seed demo questions + default config    |
| `npm run db:studio` | Open Prisma Studio                    |
| `npm run db:reset`| Drop, recreate, and re-seed the database|

## Notes

- Browser geolocation requires user permission and HTTPS in production (localhost is
  exempt). Deploy behind TLS.
- Geofencing based on device GPS is approximate — a deterrent, not a hard security boundary.
- Participants submit personal contact data; the registration form includes a consent
  checkbox. Handle stored data in line with applicable data-protection rules (GDPR).
