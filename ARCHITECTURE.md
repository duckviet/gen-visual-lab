# Architecture (Hybrid FSD-Lite & Engine-First)

This project uses a **Hybrid FSD-Lite & Engine-First Architecture**. While Feature-Sliced Design (FSD) is excellent for scaling business features, a creative art tool's heart lies in its performance-critical graphics and mathematical simulation engines. 

To prevent these core mathematical models from being buried under nested FSD layers, we keep `src/engines/` as a top-level, independent core domain. The rest of the application adopts a pragmatic, lightweight FSD structure.

---

## Architectural Layers

```
┌────────────────────────────────────────────────────────┐
│                        App Layer                       │
│             src/app (providers, global styles)         │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                       Pages Layer                      │
│             src/pages (editor, gallery page templates) │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                      Widgets Layer                     │
│  src/widgets (control-panel, preview-stage, toolbar)   │
└──────────────┬────────────────────────────┬────────────┘
               │ reads/writes                │ renders via
┌──────────────▼────────────┐  ┌────────────▼────────────┐
│       Features Layer      │  │      Engines Domain     │
│   src/features (uploads,  │  │   src/engines (boids,   │
│   randomizer, export, etc)│  │   shader, flow, growth) │
└──────────────┬────────────┘  └────────────┬────────────┘
               │ uses/mutates                │ uses
┌──────────────▼────────────┐                │
│       Entities Layer      │                │
│   src/entities (presets,  │                │
│   palette, source, state) │                │
└──────────────┬────────────┘                │
               │                             │
┌──────────────▼─────────────────────────────▼────────────┐
│                       Shared Layer                     │
│     src/shared (ui kit, math, color, hooks, types)     │
└────────────────────────────────────────────────────────┘
```

### Layer Descriptions

1. **App Layer (`src/app/`)**: Root bootstrap of the app, global providers (e.g., Zustand state wrapper), and global stylesheets (`index.css`).
2. **Pages Layer (`src/pages/`)**: Composition of widgets that form full pages (e.g., `src/pages/editor`).
3. **Widgets Layer (`src/widgets/`)**: Large, autonomous UI blocks containing multi-feature logic. 
   - `control-panel`: Left sidebar aggregating sliders, tabs, upload buttons.
   - `preview-stage`: Main canvas container orchestrating the WebGL/Canvas2D stack.
4. **Features Layer (`src/features/`)**: Reusable slice of interaction that yields a business outcome.
   - Examples: `mode-switch`, `palette-randomizer`, `svg-upload`, `font-upload`, `export-image`.
5. **Engines Domain (`src/engines/`)**: *First-Class Domain*. Dedicated directory for graphics engines. To preserve raw mathematical iteration speed and decoupled simulation loops, engines are isolated here.
6. **Entities Layer (`src/entities/`)**: Holds business models, store states, and core business logic.
   - `preset`: Core presets list and configuration.
   - `palette`: Pre-defined palette configurations.
   - `source`: Parsed SVG or text shape configurations.
7. **Shared Layer (`src/shared/`)**: Completely reusable helpers free of business logic.
   - `shared/ui/`: Sliders, inputs, switches, modals.
   - `shared/lib/math`: Vector classes (`Vec2`), noise generators, easing.
   - `shared/lib/color`: Easing gradients, hex-to-rgb, color interpolation.
   - `shared/types/`: Core type definitions like `Mode`, `AppState`, `GenerativeEngine`.

---

## Directory & Key File Map

| Path | FSD Layer | Role |
| :--- | :--- | :--- |
| `src/app/styles/index.css` | App | Global CSS tailwind configurations and styles |
| `src/pages/editor/ui/editor-page.tsx` | Pages | Main composition of the generative art environment |
| `src/widgets/control-panel/ui/control-panel.tsx` | Widgets | Side panel aggregating sliders and feature pickers |
| `src/widgets/preview-stage/ui/canvas-stage.tsx` | Widgets | Orchestrates Canvas 2D/WebGL rendering, shares RAF loop |
| `src/widgets/preview-stage/ui/webgl-stage.tsx` | Widgets | Context manager for custom GLSL fragment shaders |
| `src/features/export-image/model/export.ts` | Features | Bundled logic for composite canvas export to PNG |
| `src/features/svg-upload/model/svg-parser.ts` | Features | Takes raw SVG uploaded string, uses `svgson`, samples points |
| `src/engines/boids/boids-engine.ts` | Engines | Separation, alignment, cohesion, and target forces logic |
| `src/engines/shader/shaders/*.frag.glsl` | Engines | Custom GLSL shader codes (liquid, terrain, grain) |
| `src/entities/preset/model/store.ts` | Entities | Zustand store containing the overall canvas `AppState` and action reducers |
| `src/entities/preset/config/default-presets.ts`| Entities | Factory presets (Classic Boids, Flowing Trails, Liquid Shader) |
| `src/shared/ui/` | Shared | Base UI design system tokens (buttons, slider track, inputs) |
| `src/shared/lib/math.ts` | Shared | Math structures like `Vec2`, limiters, interpolation formulas |
| `src/shared/types/app.ts` | Shared | Global type contracts for TypeScript |

---

## State Management (`src/entities/preset/model/store.ts`)

Zustand acts as our single source of truth. Engines subscribe to state slices reactively:

```ts
export type AppState = {
  mode: Mode;
  inputType: InputType;
  canvas: CanvasSettings;
  palette: Palette;
  boids: BoidSettings;
  shader: ShaderSettings;
  text: TextSettings;
  svg: SvgSettings;
  flow: FlowSettings;
  growth: GrowthSettings;
};
```

---

## Rendering Pipeline & Shared RAF Loop

The system renders visual textures using two stacked canvases:
1. **WebGL Canvas (Bottom Layer)**: Renders the custom fragment shader backgrounds.
2. **Canvas 2D (Top Layer, `pointer-events: none`)**: Draws fast, high-density vector objects (boids, grids, vein growth).

Both canvases sync frame updates via a shared `requestAnimationFrame` (RAF) loop located in `src/widgets/preview-stage/ui/canvas-stage.tsx`. 
- When `state.mode` transitions, the loop calls `destroy()` on the current engine and `init()` on the newly selected engine.

---

## Data Flow for Shape Point Sampling

```
[User Action in features/text-input or features/svg-upload]
       │
       ▼
[Shape Sampler in features/*]
       │ Samples curves & outlines to normalize space
       ▼
[Vec2[] coordinates bound within [0, 1]²]
       │
       ▼
[Zustand state: appState.targetPoints]
       │
       ▼
[preview-stage detects update, translates to canvas dimensions]
       │
       ▼
[Active Engine in src/engines/ updates targetForces/attractors]
```

---

## Canvas Compositing for PNG Export

Visual outputs are split across a bottom WebGL canvas (shader background) and a top Canvas2D canvas (particles, growth paths). Exporting a unified PNG requires programmatically merging these two layers into a single image.

### Non-Trivial Export Blueprint

To merge layers accurately and prevent blank outputs:
1. **Preserve WebGL Drawing Buffer**: The WebGL context must be initialized with `{ preserveDrawingBuffer: true }`. Otherwise, the browser clears the WebGL buffer immediately after the frame render, resulting in a black background on export.
2. **Offscreen Composite Creation**:
   ```ts
   export function generateCompositeDataURL(
     webglCanvas: HTMLCanvasElement,
     vectorCanvas: HTMLCanvasElement,
     width: number,
     height: number
   ): string {
     // Create a temporary offscreen canvas at full design resolution
     const compositeCanvas = document.createElement("canvas");
     compositeCanvas.width = width;
     compositeCanvas.height = height;
     
     const ctx = compositeCanvas.getContext("2d");
     if (!ctx) throw new Error("Could not create offscreen 2D composite context");

     // Step 1: Draw the WebGL shader background (bottom layer)
     ctx.drawImage(webglCanvas, 0, 0, width, height);

     // Step 2: Draw the Canvas2D vector particles (top layer)
     ctx.drawImage(vectorCanvas, 0, 0, width, height);

     // Step 3: Extract the combined data
     return compositeCanvas.toDataURL("image/png");
   }
   ```
3. **Execution**: The feature [`export-image`](file:///home/duckviet/gen-visual-lab/src/features/export-image/model/export.ts) fetches references to both active canvases in the viewport, executes the composition, and spawns an ephemeral download link.

---

## React Component Hierarchy

To keep widgets and feature boundaries strictly isolated, components are arranged in the following strict hierarchy:

```
App (src/app)
 └── EditorPage (src/pages/editor)
       ├── TopToolbar (src/widgets/top-toolbar)
       │     └── ExportButton (src/features/export-image) -> triggers ExportDialog open
       ├── ExportDialog (src/widgets/export-dialog) -> absolute modal overlay
       └── MainLayout (Grid / Flex Split-Screen)
             ├── ControlPanel (src/widgets/control-panel) -> scrollable sidebar
             │     ├── ModeTabs (src/features/mode-switch)
             │     ├── SourceSelect (src/features/source-select) -> toggles text vs svg settings
             │     │     ├── TextInput (src/features/text-input)
             │     │     └── SvgUpload (src/features/svg-upload)
             │     │           └── FontUpload (src/features/font-upload)
             │     ├── EngineSliders (src/widgets/control-panel/ui/engine-sliders.tsx) -> dynamic panels
             │     │     ├── BoidsSliders (conditional based on mode)
             │     │     ├── FlowSliders (conditional based on mode)
             │     │     ├── GrowthSliders (conditional based on mode)
             │     │     └── ShaderSliders (conditional based on mode)
             │     └── PalettePicker (src/features/palette-randomizer)
             │
             └── PreviewStage (src/widgets/preview-stage) -> viewport wrapper (centered square)
                   ├── WebglStage (src/widgets/preview-stage/ui/webgl-stage.tsx) -> background shader canvas
                   └── CanvasStage (src/widgets/preview-stage/ui/canvas-stage.tsx) -> particle simulation & RAF loop
```

---

## Performance & UX Guidelines

- **Spatial Partitioning**: Standard Boids use an $O(N^2)$ algorithm. Switch to spatial grid indexing inside `src/engines/boids/` for boid counts exceeding 500.
- **Worker Threading**: For heavy SVG uploads (e.g., curves with >10,000 segments), parsing and point-sampling are delegated to a Web Worker inside `src/features/svg-upload/model/` to guarantee smooth UI frames.
- **WebGL Graceful Fallback**: Shaders check for WebGL support. On failure, it switches to a solid gradient background without interrupting the Canvas 2D engine overlay.