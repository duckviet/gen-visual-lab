# Algorithms

## 1. Boids

Each frame per boid:
```
1. find neighbors within viewDistance
2. separation  = steer away from too-close neighbors
3. alignment   = steer toward average velocity of neighbors
4. cohesion    = steer toward average position of neighbors
5. targetForce = steer toward nearest targetPoint
6. acc = (sep * wSep) + (ali * wAli) + (coh * wCoh) + (target * wTarget)
7. vel = clamp(vel + acc, maxSpeed)
8. pos = pos + vel
9. wrap or bounce at canvas edges
```

Spatial grid optimization:
- **Threshold**: Dynamically activated whenever the active Boid count $N > 500$ (below 500, a direct $O(N^2)$ scan is faster due to CPU array access overhead).
- **Algorithm**:
  1. Divide the 2D canvas workspace into a grid of uniform cells where each cell's width and height equal `viewDistance`.
  2. Map each boid to a 1D grid cell index based on its position coordinates: `gridIndex = Math.floor(x / cellWidth) + Math.floor(y / cellHeight) * cols`.
  3. Clear and build a spatial hash map of cells-to-boids every frame ($O(N)$ insertion).
  4. When executing neighborhood updates for boid $i$, only scan boids residing in boid $i$'s direct cell plus its 8 surrounding neighbor cells.

## 2. Text → Points (Multi-Character sampling)

```
1. Load TTF/OTF font file using opentype.js.
2. Call font.getPath(text, startX, startY, fontSize) to extract a compound Path representing the whole text block.
   - For multi-character text: opentype.js handles kerning and glyph spacing automatically, returning a single concatenated path containing multiple sub-paths (commands split by MoveTo M).
3. Compute the overall bounding box of the entire text path: [minX, minY, maxX, maxY].
4. Convert all cubic/quadratic bezier path commands into raw polyline segments (flatten command vectors into short linear strides).
5. Compute the cumulative arc length of the entire multi-character text path.
6. Sample N points evenly across the entire concatenated length:
   - For each sample point i in [0..N-1]:
     - Target length: targetDist = (i / (N - 1)) * totalArcLength.
     - Traverse the polyline segments to locate the exact segment containing targetDist.
     - Interpolate coordinates linearly along that segment.
7. Normalize all sampled Vec2[] coordinates into a relative range [0, 1]²:
   - x_norm = (x - minX) / (maxX - minX)
   - y_norm = (y - minY) / (maxY - minY)
   - Adjust ratio: Preserve the aspect ratio of the text bounding box inside [0, 1]² to prevent letter stretching.
```

## 3. SVG → Points

```
1. parse SVG string with svgson
2. extract all <path> elements → d attribute
3. flatten curves to polyline segments (de Casteljau, step ≤ 1px)
4. sample by arc length → Vec2[]
5. merge multi-path, normalize to [0,1]²
```

Fill-area sampling (optional):
```
1. rasterize path to offscreen bitmap
2. scan pixels, collect all (x, y) where pixel is filled
3. subsample to N points
```

## 4. Flow Field & Noise Implementation

### Zero-Dependency Noise Choice
We choose to implement a clean, lightweight custom **2D Simplex Noise** utility inside `src/shared/lib/noise.ts` to keep the engine entirely zero-dependency. This avoids external module size overhead and makes Web Worker messaging trivial.

### Algorithm
```
1. Divide canvas into grid cells (cellSize ≈ 20px).
2. For each cell center (x, y):
   - angle = curlNoise2D(x * u_scale, y * u_scale, time * u_speed) * Math.PI * 2
3. Map each particle to its containing grid cell → get vector: [cos(angle), sin(angle)].
4. Particle updates:
   - acc += forceVector * settings.turbulence
   - vel = clamp(vel + acc, settings.speed)
   - pos += vel
   - wrap at canvas boundaries.
5. Draw trailing paths: draw line from prevPos to currentPos.
6. Canvas trail accumulation: Fill canvas with background color using a very low alpha value (e.g. fillStyle = "rgba(bg, 0.05)") to fade older paths over time.
```

Curl noise guarantees a divergence-free vector field, which keeps particles flowing smoothly without bundling into clumps or single-point attractors:
```
// Standard Simplex Noise: n(x, y)
// Gradient of noise: (∂n/∂x, ∂n/∂y)
// Curl of noise: curl(x, y) = (∂n/∂y, -∂n/∂x)
```

## 5. Growth / Vein / Botanical

```
1. generate attractors from targetPoints, fallback vines, or ornament-frame bands
2. place multiple seed roots around target bounds or frame corners
3. each frame: inspect active endpoints only
4. for each attractor, find the closest endpoint inside attractionRadius
5. remove attractors inside killRadius
6. accumulate averaged directions per endpoint
7. grow at most one main child per influenced endpoint, capped per frame
8. render full canvas from cached nodes each frame
9. botanical style adds Bezier stems, leaf outlines, and small buds
```

This avoids the old center-knot failure mode: interior nodes do not keep sprouting forever, attractors outside the active radius are preserved, and growth progresses from endpoints toward distributed target clusters.

Parameters: `style`, `layout`, `stepSize`, `branchAngle`, `maxBranches`, `attractorCount`, `leafDensity`, `flowerDensity`, `lineWidth`

## 6. Shader (GLSL fragment)

Standard uniforms available in all shaders:
```glsl
uniform float u_time;
uniform vec2  u_resolution;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_grain;
uniform float u_speed;
uniform vec3  u_palette[5];
```

Base pattern for noise shaders:
```glsl
vec2 uv = gl_FragCoord.xy / u_resolution;
uv += fbm(uv * 3.0 + u_time * u_speed) * u_distortion;
float n = fbm(uv * 2.0);
vec3 color = paletteSample(u_palette, n);
color += (rand(uv + u_time) - 0.5) * u_grain;
gl_FragColor = vec4(color, 1.0);
```

## 7. Dots Grid

```
1. create fixed grid: points[i] = { x, y, baseOpacity }
2. each frame:
   for each dot:
     influence = 0
     for each boid:
       d = distance(dot, boid)
       if d < radius: influence += 1 - (d / radius)
     dot.opacity = clamp(baseOpacity + influence * strength, 0, 1)
3. draw dots at computed opacity/scale
```

## 8. Palette sampling

```ts
function paletteSample(colors: string[], t: number): string {
  t = clamp(t, 0, 1) * (colors.length - 1)
  const i = Math.floor(t)
  return lerpColor(colors[i], colors[i + 1], t - i)
}
```
