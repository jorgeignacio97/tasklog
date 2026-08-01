# tasklog

Local-first task and time-tracking app. Log tasks by category, track their status and estimated duration, and build reports from completed work in a date range — everything persisted client-side (IndexedDB via Dexie), no backend required.

## Features

- **Tasks** — create, edit, and track tasks with category, status, estimated duration, and notes.
- **Reports** — build a report from unreported tasks in a date range and export it as a PDF (`@react-pdf/renderer`).
- **History** — browse previously generated reports.
- **Reminders** — in-app notifications for tasks that have been sitting too long.

## Stack

- React 19 + Vite + TypeScript (strict)
- TanStack Router (routing) + TanStack Query (server-state pattern over local services) + TanStack Table
- Zustand (UI state), React Hook Form + Zod (forms/validation)
- Tailwind CSS v4
- Dexie (IndexedDB) for local persistence
- Vitest + Testing Library for tests

## Commands

```bash
pnpm install       # install dependencies
pnpm dev           # start dev server
pnpm build         # typecheck + production build
pnpm lint          # lint
pnpm test          # run test suite
pnpm test:watch    # run tests in watch mode
pnpm format        # format with Prettier
```

## Architecture

Screaming/feature-based structure:

- `src/features/<name>/` — `components`, `hooks`, `services`, `schemas`; each feature exposes its public API only via `index.ts`.
- `src/shared/` — reusable code across features (components, layout, utils, types).
- `src/routes/` — TanStack Router route definitions.
- `src/stores/` — Zustand UI state.

See `CLAUDE.md` for the full set of conventions this codebase follows.
