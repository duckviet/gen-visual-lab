# Conventions

To guarantee consistency, readability, and modularity across the codebase, all code changes and file additions must strictly adhere to the following rules.

---

## 1. Naming Conventions

### File & Directory Naming
- **Directories**: Always use lowercase `kebab-case` (e.g., `src/widgets/control-panel`, `src/shared/ui`).
- **React Components**: Always use lowercase `kebab-case` for component filenames (e.g., `canvas-stage.tsx`, `palette-picker.tsx`, `slider.tsx`). Component folders follow `kebab-case` as well.
- **Pure Logic & Utilities**: Always use `kebab-case` for typescript files (e.g., `math.ts`, `export-pipeline.ts`, `boids-engine.ts`).
- **Fragment Shaders**: Always use `kebab-case` with `.frag.glsl` extensions (e.g., `liquid.frag.glsl`).

### Code Symbol Naming
- **React Components**: Use `PascalCase` for component declarations and functions (e.g., `export function CanvasStage()`).
- **Types & Interfaces**: Use `PascalCase` (e.g., `export interface GenerativeEngine`, `export type AppState`).
- **Variables, Functions, & Instantiated Classes**: Use `camelCase` (e.g., `const currentMode`, `function updateFlock()`).
- **Constants**: Use `UPPER_SNAKE_CASE` (e.g., `export const MAX_BOID_COUNT = 5000`).

---

## 2. Directory Structure & Import Boundaries

We follow a **Hybrid FSD-Lite** structure. To prevent circular dependencies and messy coupling, you must strictly respect the following import boundaries:

```
┌─────────────┐
│    app      │ ───► Can import Pages, Widgets, Features, Entities, Shared
└─────────────┘
       │
┌─────────────┐
│    pages    │ ───► Can import Widgets, Features, Entities, Shared
└─────────────┘
       │
┌─────────────┐
│   widgets   │ ───► Can import Features, Entities, Shared (NO importing Pages/App)
└─────────────┘
       │
┌─────────────┐
│  features   │ ───► Can import Entities, Shared (NO importing Widgets/Pages/App)
└─────────────┘
       │
┌─────────────┐
│  engines    │ ───► Can import Shared ONLY (NO importing Features/Widgets/Pages/App)
└─────────────┘
       │
┌─────────────┐
│  entities   │ ───► Can import Shared ONLY (NO importing Engines/Features/Widgets/Pages/App)
└─────────────┘
       │
┌─────────────┐
│   shared    │ ───► Can import Shared helpers ONLY (Strictly self-contained)
└─────────────┘
```

### Import Rules Checklist
1. **No Circular Imports**: Files in `shared/` must never import from layers above (`entities`, `features`, etc.).
2. **Feature Isolation**: Features residing in `features/` must **never** import other features directly. Cross-feature coordination must be managed in a `widget` or through Zustand state events.
3. **Engine Decoupling**: Engines in `src/engines/` must remain pure simulation engines. They can only import types and math libraries from `src/shared/`. They must never import UI elements or specific React features.

---

## 3. TypeScript & React Styles

### TypeScript Rules
- **No Implicit `any`**: Ensure strict type checking is enabled. Never bypass compiler checks with `any` unless absolutely necessary (e.g. parsing external JSON parameters); use `unknown` and implement a validation guard instead.
- **Absolute Path Imports**: Always use relative paths for local sibling files, and absolute aliases `@/` (pointing to `src/`) for imports across layers to keep imports clean:
  - Good: `import { Vec2 } from "@/shared/lib/math"`
  - Bad: `import { Vec2 } from "../../../shared/lib/math"`
- **Strict Interfaces**: Every engine must explicitly implement [`GenerativeEngine`](file:///home/duckviet/gen-visual-lab/src/shared/types/app.ts).

### React Rules
- **Functional Components**: Declare components using `export function ComponentName() {}` instead of arrow functions `const ComponentName = () => {}`.
- **Props Definition**: Explicitly type React component props using a local `Props` type declaration:
  ```tsx
  type Props = {
    canvasWidth: number;
    onReset: () => void;
  };
  ```
- **No Inline Styles**: Use Tailwind classes for all layouts and aesthetics. In the rare case of dynamic styles (e.g. drawing color swatches or canvas overlays), use Tailwind style bindings or standard React `style` attributes bound directly to variables.
- **No Form Submissions**: Avoid standard `<form>` tags which trigger page refreshes. Use native Tailwind-styled `<button>` overlays with explicit, throttled `onClick` handlers.

---

## 4. State Management Conventions

- **Zustand Store Access**: Prefer selective hooks over pulling the whole state to avoid unnecessary renders:
  - Good: `const speed = useAppStore((state) => state.boids.speed)`
  - Bad: `const { boids } = useAppStore()` (triggers re-render on any boid setting changes, even if we only care about speed).
- **Mutations**: Only modify store properties using designated actions defined inside `src/entities/preset/model/store.ts`. Direct state mutations outside actions are strictly prohibited.
