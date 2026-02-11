# Agents

## Project Structure

Monorepo using bun workspaces with the following packages:

- `packages/frontend` — SolidJS frontend (Vite, SolidRouter)
- `packages/backend` — Hono API server
- `packages/shared` — Shared types and utilities
- `packages/database` — Drizzle ORM schema and migrations
- `packages/queue` — Background job processing
- `packages/email` — Email templates and sending
- `packages/blackwall` — Main app entry point / orchestrator

## Commands

### Development

- `bun run dev:backend` — Start backend dev server
- `bun run dev:frontend` — Start frontend dev server

### Type Checking

- `bun run typecheck` — Typecheck all packages
- `bun run typecheck:frontend` — Typecheck frontend
- `bun run typecheck:backend` — Typecheck backend
- `bun run typecheck:shared` — Typecheck shared
- `bun run typecheck:database` — Typecheck database
- `bun run typecheck:queue` — Typecheck queue
- `bun run typecheck:email` — Typecheck email
- `bun run typecheck:blackwall` — Typecheck blackwall

### Database

- `bun run db:seed` — Seed the database

### Build

- `bun run build` — Build the blackwall package
