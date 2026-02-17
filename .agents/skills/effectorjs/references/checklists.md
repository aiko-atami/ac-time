# Checklists

## 1. Design Checklist (New Feature)

- Stores are atomic and named clearly.
- Events represent intents/facts.
- Effects isolate all async and side effects.
- Dataflow is declarative with `sample`/`attach`.
- No hidden reads via `getState`.
- Public model API is minimal.

## 2. Refactor Checklist (Existing Code)

- Legacy behavior captured before changes.
- `watch` logic removed or justified for debug only.
- Imperative in-effect orchestration replaced.
- Scope-sensitive flows validated.
- Diff is split into safe incremental steps.

## 3. SSR + Scope Safety Checklist

- New scope per server request.
- Preload via `allSettled` in scope.
- State transfer via `serialize` and fork hydration.
- UI tree wrapped in correct `Provider`.
- No cross-request state leakage paths.

## 4. Review Checklist

- Potential regressions listed with severity.
- Deprecated patterns marked and migration path provided.
- Tests cover success/failure/branching paths.
- Parallel-test safety validated via forked scopes.

## 5. Acceptance Scenarios

### A. Model Design
- Given a feature request, output includes model topology + wiring snippets.

### B. Anti-Pattern Refactor
- Given logic in `watch` or `getState`, output provides declarative replacement.

### C. SSR Scope
- Given SSR requirement, output includes request-scoped fork + serialization lifecycle.

### D. React Integration
- Given React integration, output routes unit usage through `useUnit`.

### E. Solid Integration
- Given Solid integration, output routes unit usage through `useUnit` with correct accessor handling.

### F. Vue Integration
- Given Vue integration, output provides modern `effector-vue` integration guidance.

### G. Legacy Input
- Given legacy API usage/imports, output marks it as legacy and offers modern v23+ migration path.
