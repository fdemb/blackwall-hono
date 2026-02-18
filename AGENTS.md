# Agents

## Project Structure

Monorepo using bun workspaces. All packages live under `packages/`.

- `packages/frontend` — SolidJS SPA (Vite, SolidRouter, Kobalte UI, TailwindCSS, TanStack Form/Table, Paraglide i18n)
- `packages/backend` — Hono API server (Drizzle ORM, Better-Auth, Zod validation)
- `packages/shared` — Shared types and utilities (TipTap schemas, Zod)
- `packages/database` — Drizzle ORM schema, migrations, and seed script
- `packages/queue` — Background job processing
- `packages/email` — Email templates (React Email)
- `packages/blackwall` — CLI entry point / orchestrator (Hono, Commander)

## Commands

All commands are run from the repository root using `bun run`.

### Development

- `bun run dev:backend` — Start backend dev server (hot reload)
- `bun run dev:frontend` — Start frontend dev server on port 3000

### Type Checking

- `bun run typecheck` — Typecheck **all** packages in parallel via `bun run --filter '*' typecheck`
- `bun run typecheck:frontend` — Typecheck frontend only (runs Paraglide compile first, then `tsc --noEmit`)
- `bun run typecheck:backend` — Typecheck backend only
- `bun run typecheck:shared` — Typecheck shared only
- `bun run typecheck:database` — Typecheck database only
- `bun run typecheck:queue` — Typecheck queue only
- `bun run typecheck:email` — Typecheck email only
- `bun run typecheck:blackwall` — Typecheck blackwall only

### Database

- `bun run db:generate` — Generate Drizzle migrations from schema changes
- `bun run db:migrate` — Run pending migrations
- `bun run db:seed` — Seed the database with sample data

### Build

- `bun run build` — Build the blackwall package

### Linting / Formatting (run from package directories)

- `bun run lint` / `bun run lint:fix` — Lint with oxlint (available in frontend, backend)
- `bun run format` — Format with oxfmt (available in frontend)
