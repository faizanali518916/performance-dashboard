# PGTS Performance Dashboard

A production-oriented performance management foundation built with Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL, and TypeORM. The UI is a component-based implementation of the supplied `dashboard.html` design, with database-backed KPIs, monthly performance, achievements, challenges, team hierarchy, and administration.

## Features

- Email/password registration, verification, login, logout, forgot/reset password
- Opaque database sessions in secure HTTP-only cookies
- Hashed passwords and one-time auth tokens with expiry
- PostgreSQL-backed authentication rate limits
- Employee, manager, and administrator access levels
- Ownership checks for employee performance and journal data
- Roles, KPI definitions, role KPI targets, monthly results, and journals
- Team averages, top performers, attention indicators, KPI progress, and trends
- Responsive implementation of the visual language in `dashboard.html`
- TypeORM migration and idempotent demo seed

## Requirements

- Node.js 20.11 or newer
- PostgreSQL 14 or newer
- SMTP server (Mailpit is convenient for local development)

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and replace every production secret. Generate `NEXTAUTH_SECRET` with a cryptographically secure random value of at least 32 characters.

3. Create the PostgreSQL database, then run:

   ```bash
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

4. Open `http://localhost:3000`. The seed uses `admin@example.com` / `ChangeMe123!` unless `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are set.

The seed password is development-only. Change it immediately and never deploy the example credentials.

## Clear application data

To permanently remove application data while preserving the database tables and TypeORM migration history, set a strong `ADMIN_PASSWORD` in `.env` and run:

```bash
npm run db:clear
```

The command requires the same password interactively before it truncates users, roles, KPIs, performance records, journals, sessions, tokens, and auth rate limits. This cannot be undone.

## Database workflow

TypeORM synchronization is disabled in every environment. Schema changes must be migrations.

```bash
npm run db:show
npm run db:migrate
npm run db:revert
npm run db:generate -- src/lib/db/migrations/DescribeChange
```

The initial migration enables PostgreSQL `pgcrypto` for UUID generation. The database user needs permission to create that extension, or an administrator must enable it once.

## API surface

The requested endpoints live under `src/app/api`: auth, users, roles, KPI definitions and assignments, performance, and journals. All mutation bodies are Zod validated. API responses use `{ data }` on success and `{ error }` on failure. Password hashes are excluded from normal TypeORM selects and never serialized.

## Production deployment

- Use a managed PostgreSQL instance with encrypted connections and automated backups.
- Run `npm run db:migrate` as a one-off release step before starting the new application version.
- Set `NEXTAUTH_URL` to the public HTTPS origin. Cookies automatically become `Secure` in production.
- Configure a reliable transactional SMTP provider and verified `EMAIL_FROM` domain.
- Rotate `NEXTAUTH_SECRET`, database credentials, and SMTP credentials through the platform secret manager.
- Place the app behind a reverse proxy that supplies trustworthy client IP headers.
- Add monitoring for failed authentication, email delivery, API latency, and database pool exhaustion.
- The included data source enables TLS for production databases. For providers with a trusted CA bundle, replace `rejectUnauthorized: false` with the provider CA.

## Quality checks

```bash
npm run typecheck
npm run build
```

The original `dashboard.html` remains at the project root as the visual reference and is not used at runtime.
