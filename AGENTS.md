# AGENTS.md

## Project
Generative Shape Lab — browser-based generative art tool using text, SVG, shaders, and particle systems.

## Stack
- React + TypeScript + Vite
- Tailwind CSS
- Zustand (state)
- Canvas 2D (boids/dots/growth)
- WebGL / GLSL (shaders)
- opentype.js (font/text parsing)
- svgson (SVG parsing)

## Folder map (Hybrid FSD-Lite)
```
src/
  app/                   # App bootstrapping, providers, global styles
  pages/                 # Page layouts (e.g. editor-page.tsx)
  widgets/               # Large visual sections (control-panel, preview-stage)
  features/              # Core interactive features (svg-upload, font-upload, export-image, etc.)
  engines/               # Core visual simulation engines (boids, shader, dots, flow, growth)
  entities/              # Domain entities, models, and stores (presets, source, state)
  shared/                # Common reusable elements
    ui/                  # Primitive UI components (slider, button, input)
    lib/                 # Core math, color, files utilities
    hooks/               # Canvas, browser hooks
    types/               # Global TypeScript contracts
```

## Core types (see src/shared/types/app.ts)
- `Mode`: "custom" | "shader" | "dots" | "flow" | "growth"
- `InputType`: "text" | "svg" | "none"
- `AppState`: canvas + palette + boids + shader + text + svg settings

## Rules for agents

### Project-Level Skills & References (MANDATORY)
- Custom-designed, high-fidelity **Skills** are located inside the [`skills/`](file:///home/duckviet/gen-visual-lab/skills/) directory. 
- **CRITICAL**: Before implementing, modifying, debugging, or configuring any visual math features, you **MUST** open, read, and strictly adhere to the instructions and mathematical formulas inside the corresponding Skill:
  - For WebGL, GLSL custom fragment shaders, and background layers, check [`skills/generative-shader`](file:///home/duckviet/gen-visual-lab/skills/generative-shader/SKILL.md).
  - For 2D Flocking particle simulations, social behavior vector calculations, or Spatial Hash Grid optimizations, check [`skills/boids-engine`](file:///home/duckviet/gen-visual-lab/skills/boids-engine/SKILL.md).
  - For parsing, flattening bezier curves, text glyph processing, and equidistant sampling or normalization, check [`skills/svg-path-sampling`](file:///home/duckviet/gen-visual-lab/skills/svg-path-sampling/SKILL.md).

### Naming & Style Conventions
- All code structure, folder layouts, component declarations, and variable schemes must strictly follow [`CONVENTIONS.md`](file:///home/duckviet/gen-visual-lab/CONVENTIONS.md).

### General & Engine Lifecycle
- All engines must implement the [`GenerativeEngine`](file:///home/duckviet/gen-visual-lab/src/shared/types/app.ts) interface: `init(canvas, getState)`, `update()`, `destroy()`.
- **Initialization**: `init(canvas, getState: () => AppState)` is called once upon mode activation. The engine should setup its contexts, pre-allocate arrays, and store a reference to the reactive state getter `getState`.
- **State Updates & Pull Model**: Engines run inside a shared `requestAnimationFrame` loop in [`canvas-stage.tsx`](file:///home/duckviet/gen-visual-lab/src/widgets/preview-stage/ui/canvas-stage.tsx). To read settings, engines pull the latest state reactively during their `update()` frame using `getState()`.
  - *Performance Rule*: Do not re-allocate particle arrays or perform heavy geometry computations every frame. Store a local cache of critical settings (e.g. `cachedCount`, `cachedFontFamily`) and perform re-allocations/sampling **ONLY** when the pulled state differs from the cached value.
  - *Cleanup*: Any direct event listeners or store subscriptions registered during `init` **MUST** be completely removed/unsubscribed inside `destroy()` to prevent memory leaks.
- Never block the main thread — heavy vector sampling or SVG parsing must use Web Workers if execution time exceeds 16ms.
- Target $\ge 60$ FPS on 1080×1080 canvas resolution at $\le 2000$ active boids/particles.

### Text/SVG input
- Text → use `opentype.js` to get glyph paths → sample $N$ evenly spaced points. Support multi-character bounding boxes as described in [`ALGORITHMS.md`](file:///home/duckviet/gen-visual-lab/ALGORITHMS.md).
- SVG → use `svgson` to parse → flatten bezier curves → sample points by arc length.
- All sampled points must be normalized to a $[0, 1]^2$ local coordinate space and scaled dynamically to the canvas size inside the renderer.

### Boids engine
- Each boid: `{ pos: Vec2, vel: Vec2, acc: Vec2 }`
- Apply in order: separation → alignment → cohesion → targetForce.
- Clamp velocity to `settings.speed` and acceleration forces to protect rendering stability.
- Wrap or bounce at canvas edges based on `settings.wrap`.

### Shader engine
- Write GLSL fragment shaders in `src/engines/shader/shaders/*.frag.glsl`.
- Uniforms must map exactly to: `u_time`, `u_resolution`, `u_distortion`, `u_swirl`, `u_grain`, `u_speed`, `u_palette[5]` (3-component float colors).
- No vertex shader customization is needed (renders onto a fullscreen quad).

### State
- All UI controls write to the Zustand store in [`store.ts`](file:///home/duckviet/gen-visual-lab/src/entities/preset/model/store.ts).
- Engines must never mutate state directly — they read from `getState()` and trigger state changes only via explicit actions.

### Export (Canvas Compositing)
- Exporting to PNG requires merging the WebGL shader background and Canvas2D vector foreground. You must implement the composite canvas blending logic detailed in [`ARCHITECTURE.md`](file:///home/duckviet/gen-visual-lab/ARCHITECTURE.md).
- JSON Presets: Serialize the `AppState` state slice, omitting `svg.source` if it exceeds 100KB (to prevent slow parsing). Preset imports must be validated before applying to the store.

### Do NOT
- Do not use `localStorage` (not supported in the runner context).
- Do not fetch external fonts without explicit user upload/trigger.
- Do not add standard HTML `<form>` elements — use button `onClick` handlers.
- Do not hardcode canvas dimensions — always read dynamically from `canvas` settings.

### Definition of Done (DoD)
An implementation task is considered **complete** only if it satisfies the following:
1. **Compilation**: Code compiles with zero TypeScript errors or warnings.
2. **Conventions**: Zero deviations from [`CONVENTIONS.md`](file:///home/duckviet/gen-visual-lab/CONVENTIONS.md).
3. **Performance**: Engine updates and render routines run at $\ge 60$ FPS on a 1080x1080 canvas.
4. **Memory Leaks**: Switching modes/engines 50 times consecutively causes zero JS heap inflation or listener leaks.
5. **Errors**: Graceful fallbacks exist for all error paths as specified in [`ERRORS.md`](file:///home/duckviet/gen-visual-lab/ERRORS.md).

## Adding a new engine
1. Create `src/engines/<name>/` with `<name>-engine.ts`
2. Export `init`, `update`, `destroy`
3. Add engine type to `Mode` union in `src/shared/types/app.ts`
4. Register configuration/sliders in `src/widgets/control-panel/` or create a generic engine controls feature
5. Register in `src/widgets/preview-stage/ui/canvas-stage.tsx` switch block
6. Add a default preset in `src/entities/preset/config/default-presets.ts`
7. Document in `ALGORITHMS.md`

## Known constraints
- SVG parser only handles basic path/rect/circle — no complex filters or masks
- Font upload accepts `.ttf` / `.otf` only
- Max boid count: 5000 (UI hard limit)
- Shader fails gracefully (fallback to solid bg color)