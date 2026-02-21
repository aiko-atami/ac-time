# Global Context & Constraints

## Always Load
- This file must be read first before making decisions or edits.
- The local skills live in `/.agents/skills` and must be consulted when relevant.

## Tech Stack (Final)
- React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, shadcn/ui (Base UI)
- Cloudflare Pages Functions (wrangler) for serverless API
- ESM only, Node.js LTS

## Architecture Rules (FSD-lite, strict)
0. Current project structure is not final:
   - There is no fully settled structure yet.
   - During refactoring and while adding new features, always review the structure of edited files.
   - If structure looks incorrect relative to FSD patterns, fix it as part of the task.
1. New code must follow FSD-lite layers:
   - `src/app`, `src/pages`, `src/widgets`, `src/features`, `src/entities`, `src/shared`
2. UI components are dumb:
   - Place visual-only components in `ui/` folders (e.g. `features/x/ui/`, `shared/ui/`).
   - UI components take props only, no data fetching, no business logic.
3. Business logic is separate:
   - Feature and entity logic goes into `model/` (e.g. `features/x/model/`).
   - Hooks that implement logic live in `model/` (e.g. `useX.ts`).
   - Shared pure utilities go into `shared/lib/`.
4. API access:
   - Client API helpers live in `shared/api/`.
   - Server-side logic stays in `functions/` (Cloudflare Pages Functions).

## State Management
- Current: local React state + custom hooks.
- Planned: Effector.js.
- Do not introduce other state libraries.
- When Effector is added, new stateful logic should move into `model/` with stores/events.

## Types and Validation
- No `any`.
- Validate external data with `zod` (client and/or server as needed).
- Prefer explicit, narrow types; avoid `unknown` unless immediately refined.

## Documentation (for LLM clarity)
- Use concise JSDoc for **every function** (including private) to state intent.
- For exported APIs/components, include `@param` and `@returns` when applicable.
- Document important fields/properties with short intent comments when non-obvious.
- Prefer short, factual intent over prose.

## Context Comments
- Add a short plain comment near the top of each file describing the code goal and why the module exists.
- For complex flows, add short plain comments before non-obvious blocks to explain the purpose of the code below.
- Do not use special comment tags for this (for example `@anchor` or `@intent`); use normal descriptive comments.

## Styling and UI
- Use shadcn/ui components as the base UI system.
- Tailwind CSS only (no styled-components).
- Keep a consistent visual theme; centralize tokens in Tailwind config or CSS variables.

## Quality and Tests
- Linting and formatting are mandatory.
- Use existing Biome setup (`npm run lint`, `npm run format`).
- Run Biome checks at least for files edited in the current task; prefer full-project check before merge.
- Tests only for critical units of logic; keep them small and focused.

## Git Conventions
- Use Conventional Commits (e.g. `feat:`, `fix:`, `chore:`).

## Environments
- Separate dev/prod behavior when needed.
- `wrangler.toml` is the source of truth for Cloudflare config.
- `.env` used for local API configuration.
