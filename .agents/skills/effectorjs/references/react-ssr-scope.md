# React + SSR + Scope

## 1. Scope-First Rule

Assume scope usage by default, even for apps currently running without SSR.

Use cases:
- SSR request isolation.
- Parallel tests without state leaks.
- Predictable event/effect execution boundaries.

## 2. Canonical SSR Flow

Server:
1. `fork()` new scope per request.
2. `allSettled()` preload required units in that scope.
3. Render React subtree with `<Provider value={scope}>`.
4. `serialize(scope)` and send payload.

Client:
1. `fork({ values })` from server payload.
2. Hydrate app under `<Provider value={scope}>`.

## 3. React Integration

Use `useUnit` as the default interface from UI to model.

```tsx
import { useUnit } from 'effector-react';

const View = () => {
  const [count, increment] = useUnit([$count, incrementClicked]);
  return <button onClick={increment}>{count}</button>;
};
```

Guidelines:
- Read stores via `useUnit($store)`.
- Bind events/effects via `useUnit(eventOrFx)`.
- Keep business logic in model, not in components.

## 4. Scope Loss Prevention

- When effects call effects, keep calls synchronous and awaited.
- Avoid mixing arbitrary async gaps with imperative unit calls.
- Prefer declarative chaining via `sample` or `attach`.

Risk pattern:
1. Effect does custom async workflow.
2. Later imperatively calls another effect/event.
3. Execution loses expected scope context.

## 5. Testing Pattern

Use forked scopes for isolated test execution.

```ts
const scope = fork({ values: [[$featureFlag, true]] });
await allSettled(pageOpened, { scope });
expect(scope.getState($items)).toEqual(expected);
```

Checklist:
- No shared mutable global state assumptions.
- Each test creates its own scope.
- Assertions use `scope.getState`, not global store state.

## 6. Migration Notes

- Prefer `effector-react` modern hooks (`useUnit`) over older compat/scope-specific imports.
- Treat old scope module usage as legacy and migrate in one coherent pass.
