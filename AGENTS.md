# Agent Instructions

- Always read `.agents/docs/Context.md` before making decisions or edits.
- Consult relevant skills from `.agents/skills` when the task matches their scope.
- For UI sizing changes, always verify size tokens/variants in `src/components/ui/*` first and prefer component variants over manual Tailwind height/padding overrides.

## Updating Official Presets

Official presets are defined in `data/official-presets.json` and served directly from the repo via `raw.githubusercontent.com` (see `OFFICIAL_PRESETS_URL` in `src/shared/config/constants.ts`). Clients cache them for 1 hour (`OFFICIAL_PRESETS_SYNC_TTL_MS`).

To update a preset (e.g. change a championship ID):

1. Edit `data/official-presets.json` — update the relevant `participantsCsvUrl` field to the new championship ID (e.g. `championship-538` → `championship-574`).
2. If the CI workflow also scrapes that championship, update `.github/workflows/update_participants.yml` — change `championship_id`, `championship_name`, and `scrape_url` in the matrix to match.
3. Commit both changes together with a `chore(data):` prefix, e.g.:
   ```
   chore(data): update ac9.mazda participants CSV to championship-574
   ```
4. Push to `main` — the new preset URL will be live immediately after the push.
