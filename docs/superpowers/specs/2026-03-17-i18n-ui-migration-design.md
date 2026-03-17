# UI Text i18n Migration Design

## Goal
Migrate all UI-facing text in the app to `src/i18n.ts` and use a single access pattern so the interface cleanly supports `zh` and `en`.

## Scope
- Only UI text (titles, labels, buttons, placeholders, table headers, helper text).
- Languages: `zh`, `en`.
- Keep existing behavior and layout unchanged.

## Non-Goals
- No changes to default example data or seeded content (names, roles, system names, timestamps).
- No changes to model/system prompts or service strings.
- No new i18n libraries or runtime locale switching beyond existing `language` state.

## Current State
- `src/i18n.ts` already defines `translations` with partial coverage.
- Multiple pages and components embed text via ternaries (`language === 'zh' ? ... : ...`) or inline literals.

## Approach
1. Expand `translations` with page/component namespaces (e.g. `settings`, `factory`, `performance`, `alarm`, `sidebar`, `header`, `common`).
2. Add a lightweight helper in `src/i18n.ts` (e.g. `getTranslations(lang)` or `useI18n()` hook) to return the correct dictionary for the current `language`.
3. Replace UI literals and ternaries in affected files with `t.<namespace>.<key>` lookups.
4. Keep component logic and visual structure unchanged; only replace text sources.

## Files Likely Touched
- `src/i18n.ts`
- Pages: `src/app/**/page.tsx`
- Shared components: `src/components/**`
- Optional small helper module if needed (still in `src/i18n.ts` unless reuse demands a new file)

## Risks
- Missing key coverage if any UI string is overlooked.
- Inconsistent naming if keys are not grouped consistently.
Mitigation: search for remaining Chinese literals and string ternaries after migration.

## Testing
- No automated tests added for this change (per user request).
- Manual smoke check: switch language and scan main pages for untranslated UI text.
