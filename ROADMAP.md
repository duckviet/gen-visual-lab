# Roadmap
 
## Phase 1 — Core (MVP)
Goal: usable tool, exportable output, good defaults.
 
| Feature | Epic |
|---------|------|
| App shell + layout | 1 |
| Boids engine | 2 |
| Text → points | 3 |
| Shader engine (3 presets) | 5 |
| Dots mode | 6 |
| Flow field engine | 7 |
| Palette editor + randomize | 9 |
| PNG export | 10 |
| Visual presets: Vortex Dashes, Dense Blob, Liquid Symmetry, Paint Swirl, Tiger Wave | 12 |
 
Default palette: `PALETTE_STUDIO_DARK` (blue/orange/purple/rust on near-black).
 
Deliverable: working app with 5 visual presets out of the box, PNG export.
 
---
 
## Phase 2 — Full MVP
Goal: SVG input, more engines, presets shareable.
 
| Feature | Epic |
|---------|------|
| SVG upload + parsing | 4 |
| Font upload | 3 |
| Growth / vein engine | 8 |
| JSON preset save/load | 10 |
| Preset examples (built-in) | 10 |
| Shareable URL | — |
| Mobile layout | 11 |
| Visual presets: Mosaic Squares, Voronoi Cells, Isometric Voxel | 12 |
| New renderers: capsule, blob, symmetry, mosaic cell, voronoi, isometric | 12 |
 
---
 
## Phase 3 — Creative Power
Goal: advanced renderers, motion export, ecosystem.
 
- Voronoi / Delaunay renderer
- Halftone / plotter renderer
- GIF / MP4 export (ffmpeg.wasm)
- Audio reactive mode
- Image input → field
- Morphing between two sources
- Reaction-diffusion engine
- Multi-layer composition
- AI palette suggestion
---
 
## Non-goals (won't do)
- Backend / user accounts
- Real-time collaboration
- Native app
- 3D rendering