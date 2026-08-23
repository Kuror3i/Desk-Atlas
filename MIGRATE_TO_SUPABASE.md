# Migrate to Supabase (Postgres)

This project stores SQL migrations in `supabase/migrations/*.sql` and a seed at `supabase/seed.sql`.

Quick steps to run migrations against a Supabase project:

1. Get your Supabase project's Postgres connection string (Settings → Database → Connection string).
2. Add it to your environment as `DATABASE_URL` (or set it as a GitHub Actions secret named `DATABASE_URL`).

Run locally:

```bash
# at repo root
export DATABASE_URL="postgres://..." # Windows PowerShell: $env:DATABASE_URL = 'postgres://...'
pnpm install
pnpm db:migrate
```

What the runner does:

- Reads `supabase/migrations/*.sql` in lexicographic order and applies each file.
- Applies `supabase/seed.sql` after migrations.
- Prints simple counts for `workspaces` and `reservations`.

CI:

- A workflow is provided at `.github/workflows/migrations.yml` that runs `pnpm install` and `pnpm -w exec node scripts/run-migrations.js` using `DATABASE_URL` from secrets.

Notes:

- The runner requires a PostgreSQL connection (the Supabase project's DB connection string is recommended).
- If you prefer to use the Supabase CLI or `supabase` tooling, you can use it instead — the SQL files are compatible with Supabase.
- For production deployments, store `DATABASE_URL` or equivalent secrets (service role keys) in your CI/CD provider's secret store.

If you'd like, I can:
- Add an alternative runner that uses the Supabase REST admin API (requires service role key), or
- Update the CI to run tests/build after migrations, or
- Run migrations against a Supabase project for you if you provide a `DATABASE_URL` secret.
