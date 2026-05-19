# Generative Shape Lab

A browser-based generative art tool. Create animated visuals from text, SVG, shaders, and particle systems — no code required.

## Features
- **Text mode** — type anything, watch it become particles
- **SVG mode** — upload shapes, convert them to point clouds
- **Shader mode** — abstract animated backgrounds (noise, swirl, grain)
- **Dots mode** — invisible boids light up a rigid grid
- **Flow Field** — particles follow curl noise
- **Growth mode** — vein/root networks grow from a shape
- Real-time sliders, palette editor, PNG export, JSON preset save/load

## Stack
React · TypeScript · Vite · Tailwind · Zustand · Canvas2D · WebGL/GLSL

## Run
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```
Output goes to `dist/`. Deploy to Vercel or any static host.

## Docs
| File | Purpose |
|------|---------|
| [`AGENTS.md`](file:///home/duckviet/gen-visual-lab/AGENTS.md) | Rules and conventions for AI agents working on this codebase |
| [`PRD.md`](file:///home/duckviet/gen-visual-lab/PRD.md) | Product requirements |
| [`ARCHITECTURE.md`](file:///home/duckviet/gen-visual-lab/ARCHITECTURE.md) | System design (Hybrid FSD-Lite + Engine-First) |
| [`ALGORITHMS.md`](file:///home/duckviet/gen-visual-lab/ALGORITHMS.md) | Engine algorithms and mathematics |
| [`TASKS.md`](file:///home/duckviet/gen-visual-lab/TASKS.md) | Implementation task list |
| [`ROADMAP.md`](file:///home/duckviet/gen-visual-lab/ROADMAP.md) | Phase plan |

## Architecture Overview (Hybrid FSD-Lite)
We follow a **Hybrid FSD-Lite & Engine-First Architecture** to balance scalable frontend structure with highly efficient rendering loops:
- **`src/app/`**: Root bootstrap, global configurations, and global stylesheets.
- **`src/pages/`**: High-level page compositions (e.g., `editor` page layout).
- **`src/widgets/`**: Multi-feature UI compositions (e.g., `control-panel`, `preview-stage`).
- **`src/features/`**: User actions and interactive logic (e.g., `svg-upload`, `palette-randomizer`).
- **`src/engines/`**: *First-Class Domain*. Decoupled visual engine loop scripts (e.g., `boids`, `shader`, `dots`).
- **`src/entities/`**: Shared business domains, Zustand stores, and state logic (e.g., `presets`, `palette`).
- **`src/shared/`**: Business-agnostic visual controls (`ui`), helper scripts (`math`, `color`), custom React hooks, and types.

## Roadmap (short)
- **Phase 1** — Text, boids, basic shader, dots, PNG export
- **Phase 2** — SVG upload, font upload, presets, flow field, growth
- **Phase 3** — Audio reactive, video export, multi-layer, morphing