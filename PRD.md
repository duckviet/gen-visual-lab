# PRD — Generative Shape Lab

## Product
Browser-based generative art playground. Users create visuals by combining an input source with a behavior engine and a render style.

## Core users
- Graphic designers exploring generative aesthetics
- Creative coders prototyping ideas
- Motion artists making social/poster content
- Students learning generative systems

## Mental model (3 layers)

```
Source   →   Engine   →   Renderer
──────────────────────────────────
Text          Boids         Dots
SVG           Flow Field    Lines / Ribbons
Image         Growth        Shader
Draw          Orbit         Halftone / Plotter
```

## Modes (MVP)

| Mode | Input | Engine | Renderer |
|------|-------|--------|----------|
| Custom | Text or SVG | Boids | Dots or lines |
| Shader | — | Shader | Full canvas GLSL |
| Dots | Text or SVG | Boids (invisible) | Grid dots |
| Flow | Text or SVG | Flow field | Line trails |
| Growth | Text or SVG | Vein growth | Stroke lines |

## MVP feature list

### Input
- [x] Text input (default font)
- [x] Font upload (.ttf / .otf)
- [x] SVG upload
- [x] Preset examples (3 presets minimum)

### Controls
- [x] Count, speed, view distance
- [x] Separation, alignment, cohesion
- [x] Distortion, swirl, grain (shader)
- [x] Palette editor (5 swatches + background)
- [x] Randomize palette
- [x] Canvas size (400, 800, 1080)
- [x] Play / pause / reset

### Export
- [x] Export PNG
- [x] Save preset (JSON download)
- [x] Load preset (JSON upload)
- [ ] GIF/MP4 — Phase 2

## Non-goals (Phase 1)
- No user accounts or cloud storage
- No real-time collaboration
- No audio reactivity
- No AI prompt features

## Success metrics
- Loads in <2s on average connection
- Maintains 60 FPS at 1080×1080 with ≤2000 boids
- Works in Chrome, Edge, Safari (last 2 versions)
- A new user can generate and export their first image in <60 seconds

## UX principles
- Visual feedback on every slider change — no apply button
- Default preset must look good out of the box
- Randomize never produces an ugly output
- Upload → auto-fit to canvas with no manual scaling needed