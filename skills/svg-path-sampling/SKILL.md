---
name: svg-path-sampling
description: Use this skill when the user asks to parse, flatten, sample, normalize, or fit SVG paths, shapes, curves, or TTF/OTF text fonts into normalized vector point clouds [0, 1]² for particle targets.
---

# SVG & Typography Path Sampling Skill

This skill guides the implementation of client-side curve-flattening, arc length point-sampling, text bounding-box normalization, and coordinate fitting inside the **Generative Shape Lab** project.

## Reference Map

- **Bezier Curve Flattening & Geometry**: Read [`references/parsing.md`](file:///home/duckviet/gen-visual-lab/skills/svg-path-sampling/references/parsing.md) for math equations converting cubic/quadratic curves to linear polylines.
- **Arc Length Discretization & Sampling**: Read [`references/sampling.md`](file:///home/duckviet/gen-visual-lab/skills/svg-path-sampling/references/sampling.md) to implement interpolation of equidistant dots.

---

## Core Geometry Workflow

To convert complex text strings or uploaded SVG vector art into attraction points for our generative engines, you must follow this pipeline:

### Step 1: Element Extraction & Parsing
- **For SVG**: Use `svgson` to parse uploaded SVG string into a JSON node tree. Extract all `<path>`, `<rect>`, `<circle>`, `<ellipse>`, and `<polygon>` commands. Convert shapes (like circles or rectangles) to standard SVG path syntax commands (`d` attribute strings).
- **For Text**: Load binary TTF/OTF files via `opentype.js` and extract compound paths using `font.getPath(text, 0, 0, fontSize)`.

### Step 2: Polyline Flattening (Curve Sub-division)
Convert all curved commands (Cubic Beziers `C`, Quadratic Beziers `Q`, Elliptical Arcs `A`) into highly dense polyline segments (short linear lines) using de Casteljau's subdivision algorithm with a precision threshold of $\le 1$ pixel.

### Step 3: Compute Cumulative Arc Length
Sum the length of all individual polyline segments to obtain the total, exact length of the compound path. This prevents point bundling at small glyph corners while large flat lines remain empty.

### Step 4: Equidistant Sampling
Discretize the total arc length into $N$ target coordinates using interpolation.

### Step 5: Bounding Box Calculation & Aspect Normalization
Find the absolute bounds `[minX, minY, maxX, maxY]` of the sampled cloud:
1. Translate points to place the geometric center at the origin `(0, 0)`.
2. Normalize all coordinates so they reside within a relative bounding box `[0, 1]²`.
3. **CRITICAL**: Maintain the original width-to-height aspect ratio. Never stretch vector drawings or letters to fit the square grid exactly. Scale coordinates uniformly relative to the larger axis.

---

## Critical Rules
- **Web Worker Utilization**: For heavy SVG documents containing complex paths with $>10,000$ curves, the parsing, flattening, and resampling loops **must** be executed in a dedicated Web Worker to prevent browser thread freeze.
- **Support Multi-Glyph Bounds**: Multi-character string paths must be grouped, calculated as a single cumulative bounding box, and scaled together.
- **Zero-Attractor Safety**: If sampling yields 0 coordinates due to a corrupt or empty vector upload, fall back gracefully to a central target point or random physics to prevent code crashes, as detailed in [`ERRORS.md`](file:///home/duckviet/gen-visual-lab/ERRORS.md).
