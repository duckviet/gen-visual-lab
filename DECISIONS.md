# Architectural Decisions Log

This document records the core architectural decisions, rationales, and technical constraints chosen for the **Generative Shape Lab** project. Agents must respect these choices and must not propose structural changes that override these patterns without explicit request.

---

## ADR 1: Dual-Stacked Canvas Architecture (WebGL + Canvas2D)

### Context & Problem
We need to render a highly complex, dynamic generative shader background while concurrently drawing thousands of fast-moving vector particles (boids, trails, growth nodes). 

### Decision
We implement a stacked dual-canvas overlay using absolute CSS layering:
1. **WebGL Canvas (Bottom Layer)**: Dedicated to custom fragment shader rendering.
2. **Canvas2D Canvas (Top Layer, `pointer-events: none`)**: Dedicated to drawing particles, grids, flow trails, and growths.

### Rationale
- **Performance Isolation**: Combining full-screen fragment shaders with thousands of vector draw calls on a single WebGL context is computationally expensive and complex (requires custom batching, texture mapping, and shader interleaving). Stacked canvases allow the GPU to parallelize standard 2D vector primitives alongside shader drawing.
- **Prototyping Speed**: Canvas2D provides native, ultra-fast vector methods (`arc()`, `lineTo()`, `stroke()`) out of the box. Rebuilding trail fades (`rgba(0,0,0,0.1)`) in WebGL requires render-to-texture ping-pong framebuffers, adding significant code complexity.
- **Decoupled Engine Loops**: It separates the concerns of the background visuals from the foreground interactive entities.

---

## ADR 2: Zero-Bloat Engine Selection (No Three.js / PixiJS)

### Context & Problem
We require high-performance, responsive graphics without massive initial page load times.

### Decision
We reject heavy 3D rendering engines like Three.js, Babylon.js, or 2D wrappers like PixiJS. Instead, we use:
- **Native Canvas2D API**: For all particle simulations.
- **Lightweight Functional WebGL (e.g. `regl` or raw WebGL)**: For shader backgrounds.

### Rationale
- **Bundle Size**: Three.js and PixiJS add 500KB - 1MB of minified JS bundle size, violating our PRD metric of `<2s` page load times.
- **Fullscreen Quad Focus**: We do not require complex 3D meshes, lighting, cameras, or advanced scenegraph structures. Shaders run on a single fullscreen flat 2D quad, making the heavy abstractions of Three.js entirely redundant.
- **Direct GPU Control**: Using direct WebGL shaders or thin functional abstractions (like `regl`) keeps GPU communication fast, explicit, and easy to maintain.

---

## ADR 3: Pull-Based Engine State Access (Zustand getState)

### Context & Problem
Engines running inside a `requestAnimationFrame` loop at 60 FPS need to read sliders and modes without triggering React component re-renders.

### Decision
We reject standard React Context and standard Zustand state hooks inside the engine simulation loops. Instead, engines retrieve state using a **pull-based reactive getter**:
```ts
// Standard init signature
init(canvas: HTMLCanvasElement, getState: () => AppState)
```
Inside the `update()` frame, the engine calls `getState()` to read the current values.

### Rationale
- **Zero React Overhead**: Triggering React re-renders 60 times a second on heavy engine updates causes major CPU scheduling lag. The pull model completely bypasses the React reconciler, keeping the rendering pipeline running in pure JavaScript.
- **Selective Memory Reallocation**: Pulling state allows engines to compare current parameters to local cache variables (e.g. `lastCount !== state.boids.count`). The engine only re-allocates memory or resamples arrays when state changes, keeping active frames extremely fast.

---

## ADR 4: 100% Client-Side Serverless Parsing

### Context & Problem
We want to support custom fonts (.ttf/.otf) and SVG uploads without a backend server to reduce cloud infrastructure costs and enable instant preview times.

### Decision
We delegate all file parsing entirely to client-side libraries:
- **`opentype.js`**: For TTF/OTF binary parsing to vector glyph paths.
- **`svgson`**: For parsing raw SVG XML strings directly to semantic JSON path trees.

### Rationale
- **Instant Processing**: Uploaded files do not need to go through network round-trips to a server. Paths are extracted directly inside the browser using standard `FileReader` blobs.
- **Offline Reliability**: The entire generator can run offline or on static CDN hosts (Vercel, GitHub Pages) without database or API dependencies, maximizing uptime and reliability.

---

## ADR 5: Query Parameter & JSON Presets (No localStorage)

### Context & Problem
We need to support preset sharing, saving, and loading.

### Decision
We reject `localStorage` (which is sandboxed or unsupported in several sandbox contexts) and cloud databases. Instead, we use:
1. **JSON Presets**: Downloadable/uploadable JSON files containing the `AppState` state slice.
2. **URL Search Parameters**: Shareable URLs containing a compressed base64 string of the active preset configuration.

### Rationale
- **Zero Storage Friction**: Users do not need an account to save their art configurations. Presets are saved locally as lightweight files and shared instantly via links.
- **Zero Database Costs**: Keeps the system 100% static and zero-cost to deploy.
