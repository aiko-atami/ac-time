---
name: effectorjs
description: Design, refactor, and review Effector state management using modern v23+ patterns. Use when tasks involve createStore/createEvent/createEffect modeling, dataflow with sample/attach/split, scope-safe SSR with fork/allSettled/serialize/hydrate, React integration with useUnit, Solid/Vue integration patterns, fixing scope loss, or replacing anti-patterns such as business logic in watch, imperative calls in effects, and direct getState business reads.
---

# EffectorJS Skill

Use this skill to produce deterministic, scope-safe Effector solutions for new features, refactors, and code reviews.

## Workflow

1. Classify the request:
- `modeling`: create or extend stores/events/effects.
- `refactor`: replace anti-patterns with declarative flows.
- `ssr`: implement or debug scope-safe SSR.
- `review`: assess risks, regressions, and missing tests.
- `legacy-migration`: move old patterns to modern v23+ safely.

2. Load only required references:
- Always start with `references/core-patterns.md`.
- Add `references/react-ssr-scope.md` when React/SSR/scope appears.
- Add `references/solid-scope.md` when Solid integration appears.
- Add `references/vue-scope.md` when Vue integration appears.
- Add `references/anti-patterns-and-fixes.md` when fixing or reviewing existing logic.
- Add `references/legacy-migration-map.md` when deprecated APIs/imports are present.
- End with `references/checklists.md` for acceptance criteria.

3. Build solution in this order:
- Model atomic stores and explicit events.
- Move side effects to effects.
- Connect units with `sample` first; use `attach` for effect composition.
- Apply scope-first rules (`fork`, `allSettled`) for tests and SSR.
- For UI frameworks, use `useUnit` and correct provider wiring.

4. Produce output contract:
- Proposed model topology (stores/events/effects and responsibilities).
- Wiring snippets (`sample`, `attach`, `split` if needed).
- Scope/SSR notes when applicable.
- Test scenarios and acceptance checklist.

## Defaults

- Target Effector modern v23+.
- Treat deprecated/legacy patterns as migration targets, not defaults.
- Prefer minimal, explicit unit graph over clever abstractions.

## Guardrails

- Do not place business logic in `watch`.
- Do not call events/effects imperatively from effect bodies when declarative wiring can express the flow.
- Do not use `$store.getState()` for business dataflow; pass state through `sample` source.
- Do not create units dynamically at runtime.
- Keep naming explicit (`$store`, `eventHappened`, `someFx`).

## Legacy Handling

If legacy code is present:

1. Keep behavior unchanged first.
2. Mark legacy section explicitly.
3. Propose modern replacement with a migration-safe diff strategy.
4. Add tests that prove parity before cleanup.
