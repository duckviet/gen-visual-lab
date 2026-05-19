# Visual Presets — Style Reference
 
Mỗi preset dưới đây có: tên, mô tả visual, engine stack, palette, và các tham số quan trọng.
Dùng file này để implement built-in preset trong `state/presets.ts`.
 
---
 
## Preset 1 — Vortex Dashes
 
**Visual**: Hàng nghìn viên nang (capsule) màu sắc xoáy theo hình cơn lốc. Mật độ rất cao, gần trung tâm bị nén chặt, ngoài rìa thoáng hơn. Giống tranh Van Gogh "Starry Night" nhưng với particle rời.
 
**Engine stack**:
- Engine: Flow Field (curl noise)
- Renderer: Capsule / dash (ellipse elongated theo velocity direction)
- Blend: `source-over`, alpha thấp để overlay nhiều lớp
**Palette**:
```
colors: ["#1a6b8a", "#c44d2a", "#e8b87a", "#6b3d7a", "#3d2a5c"]
background: "#0a0a0f"
```
 
**Key parameters**:
```ts
flow: {
  particleCount: 8000,
  noiseScale: 1.2,
  turbulence: 2.5,    // curl strength — tạo vortex
  trailLength: 1,     // không có trail — mỗi frame vẽ capsule tươi
  speed: 1.8
}
renderer: {
  shape: "capsule",
  capsuleLength: 12,   // dài theo velocity
  capsuleWidth: 3,
  colorMode: "palette-by-angle",  // màu theo hướng di chuyển
  alpha: 0.6
}
```
 
**Implementation note**:
Không dùng trail mờ dần. Thay vào đó: mỗi frame xóa canvas, vẽ lại toàn bộ particle như ellipse xoay theo `atan2(vel.y, vel.x)`. Hiệu ứng vortex đến từ curl noise có `turbulence` cao + một attractorPoint ở center.
 
---
 
## Preset 2 — Dense Blob Vortex
 
**Visual**: Giống Preset 1 nhưng particle là blob không đều (organic shape), mật độ cao hơn, ít khoảng trống hơn. Cảm giác dày đặc như thảm.
 
**Engine stack**:
- Engine: Flow Field (curl noise)
- Renderer: Blob (nhiều ellipse nhỏ overlap tạo 1 particle)
**Palette**: Cùng với Preset 1.
 
**Key parameters**:
```ts
flow: {
  particleCount: 12000,
  noiseScale: 1.5,
  turbulence: 2.0,
  speed: 1.2
}
renderer: {
  shape: "blob",
  blobRadius: 6,
  blobComplexity: 3,   // số ellipse chồng nhau tạo blob
  colorMode: "palette-by-position",
  alpha: 0.5
}
```
 
**Implementation note**:
Blob = vẽ 3 ellipse quanh điểm trung tâm với random offset nhỏ, cùng màu, alpha thấp. Kết quả trông organic hơn capsule đều.
 
---
 
## Preset 3 — Liquid Symmetry
 
**Visual**: Fluid simulation với 4-way mirror symmetry. Có ô lưới (grid lines) mờ phủ lên trên. Màu chảy như sơn nước.
 
**Engine stack**:
- Engine: Shader (fluid/liquid GLSL)
- Post-process: 4-way symmetry transform (mirror X + mirror Y)
- Overlay: grid lines (Canvas 2D, thin, semi-transparent)
**Palette**: Blue/orange/rust/purple — cùng tone với preset 1-2.
 
**Shader parameters**:
```ts
shader: {
  preset: "liquid",
  speed: 0.4,
  distortion: 3.5,
  swirl: 2.0,
  grain: 0.0,
  symmetry: "quad"   // thêm field mới: none | mirror | quad | radial
}
```
 
**GLSL note**:
```glsl
// Apply quad symmetry trước khi sample noise
vec2 uv = gl_FragCoord.xy / u_resolution;
uv = abs(uv * 2.0 - 1.0);   // fold vào góc phần tư đầu tiên
// sau đó chạy fluid shader bình thường trên uv đã fold
```
 
**Grid overlay** (Canvas 2D, vẽ sau shader):
```ts
// Vẽ grid 40px, stroke "#ffffff08", lineWidth 0.5
```
 
---
 
## Preset 4 — Paint Swirl
 
**Visual**: Sơn dầu xoáy tròn liên tục. Không có discrete particle — toàn bộ là fluid liên tục. Giống pour painting.
 
**Engine stack**:
- Engine: Shader only (no particles)
- Shader: advection-based fluid với color advection
**Palette**: Blue/orange/purple/rust, background tối.
 
**Shader parameters**:
```ts
shader: {
  preset: "fluid-advection",
  speed: 0.6,
  distortion: 2.0,
  swirl: 3.5,         // swirl cao hơn preset 3
  grain: 0.02,
  symmetry: "none"
}
```
 
**Implementation note**:
Dùng kỹ thuật texture feedback: render vào framebuffer A, đọc từ framebuffer B, advect B vào A. Nếu không có framebuffer: dùng fbm noise warp nhiều octave để giả fluid.
 
Simple approximation (không cần framebuffer):
```glsl
vec2 uv = gl_FragCoord.xy / u_resolution;
for(int i = 0; i < 4; i++) {
  uv += sin(uv.yx * 3.0 + u_time * u_speed) * u_distortion * 0.1;
}
float n = fbm(uv);
gl_FragColor = vec4(paletteSample(n), 1.0);
```
 
---
 
## Preset 5 — Mosaic Squares
 
**Visual**: Toàn bộ canvas chia thành ô vuông, mỗi ô chứa concentric squares nhỏ hơn (như Russian doll vuông). Màu của mỗi ô lấy từ noise/swirl pattern bên dưới.
 
**Engine stack**:
- Base: Shader (noise color field) → sample màu tại center của mỗi cell
- Renderer: Canvas 2D vẽ concentric squares per cell
**Palette**: Tan/gold/rust/slate blue/navy — ấm hơn preset 1-4.
```
colors: ["#8b7355", "#c17f3a", "#6b5a3e", "#4a5568", "#2d3748"]
background: "#1a1a2e"
```
 
**Parameters**:
```ts
mosaic: {
  cellSize: 24,          // px per cell (4–64)
  concentricLevels: 5,   // số square lồng nhau
  gapRatio: 0.15,        // khoảng cách giữa các square
  colorSource: "shader", // lấy màu từ shader hoặc "palette-noise"
  borderColor: "#0a0a0f",
  borderWidth: 1
}
```
 
**Implementation**:
```ts
// 1. Render shader → offscreen canvas
// 2. Với mỗi cell (x, y):
//    a. Sample pixel màu từ offscreen tại (cx, cy)
//    b. Vẽ N concentric squares từ ngoài vào trong
//    c. Màu lighten/darken từ cell color theo level
```
 
---
 
## Preset 6 — Voronoi Cells
 
**Visual**: Các tế bào hữu cơ màu đen với edge phát sáng trắng mờ. Tế bào ở trung tâm to hơn, ra rìa nhỏ dần. Cảm giác sinh học, microscope.
 
**Engine stack**:
- Engine: Voronoi (compute distance field)
- Renderer: Shader (edge glow từ distance)
**Palette**: Black/white, monochrome.
```
background: "#000000"
edgeColor: "#e8e8e8"
glowColor: "#ffffff"
```
 
**Parameters**:
```ts
voronoi: {
  siteCount: 80,           // số điểm Voronoi
  siteDistribution: "radial-density",  // dày ở center, thưa ở rìa
  edgeWidth: 0.008,        // normalized, ~2px tại 1080
  glowRadius: 0.03,
  glowIntensity: 0.8,
  animate: true,           // sites di chuyển nhẹ theo noise
  animSpeed: 0.2
}
```
 
**GLSL approach**:
```glsl
// Với mỗi pixel, tìm 2 distances gần nhất (d1, d2)
// edge = smoothstep(edgeWidth, 0.0, d1)
// + smoothstep(glowRadius, 0.0, d1) * glowIntensity * falloff
// Không fill interior (→ black)
```
 
**Implementation note**: Voronoi GLSL O(n) per pixel với n sites. Với n=80, chạy được 60fps ở 1080×1080. Trên n=200 cần spatial partition.
 
---
 
## Preset 7 — Isometric Voxel
 
**Visual**: Terrain 3D nhìn từ góc isometric. Khối vuông xếp chồng như heightmap. Màu salmon/teal xen kẽ theo vùng cao/thấp.
 
**Engine stack**:
- Engine: Heightmap → Isometric 3D renderer (Canvas 2D)
- Không dùng WebGL — vẽ hình thoi (rhombus) bằng Canvas 2D path
**Palette**:
```
lowColor: "#5f8a8b"    // teal - vùng thấp
highColor: "#d4907a"   // salmon - vùng cao
sideColorDark: shade -30%
sideColorMid: shade -15%
background: "#f5f0e8"
```
 
**Parameters**:
```ts
voxel: {
  gridCols: 40,
  gridRows: 60,
  cubeSize: 24,          // px per cube face
  maxHeight: 8,          // số cube stack tối đa
  noiseScale: 0.08,      // Perlin noise scale cho heightmap
  isoAngle: 30,          // degrees
  drawOrder: "back-to-front"  // painter's algorithm
}
```
 
**Isometric projection**:
```ts
function isoProject(col: number, row: number, height: number) {
  const x = (col - row) * (cubeSize / 2)
  const y = (col + row) * (cubeSize / 4) - height * (cubeSize / 2)
  return { x: canvasCx + x, y: canvasCy + y }
}
```
 
**Draw order**: Loop row = maxRow→0, col = maxCol→0 (painter's algorithm đơn giản).
 
---
 
## Preset 8 — Tiger Wave
 
**Visual**: Sọc chéo 45° với glow mềm như velvet. Màu amber/gold trên đen. Cảm giác như vải hoặc lông thú.
 
**Engine stack**:
- Engine: Shader only
- No particles
**Palette**:
```
stripeColor: "#c87820"   // amber
glowColor: "#e8a030"
background: "#080400"
```
 
**Shader parameters**:
```ts
shader: {
  preset: "tiger-wave",
  speed: 0.3,
  stripeAngle: 45,       // degrees
  stripeFrequency: 8,    // số sọc
  stripeWidth: 1.5,      // repurposed: ridge sharpness (0.3–3.0)
  waveAmplitude: 0.15,   // độ lượn của sọc
  waveFrequency: 3.0,
  glow: 0.6,
  grain: 0.04
}
```

**Shader file**: `src/engines/shader/shaders/tiger-wave.frag.glsl`

**Tại sao phiên bản đơn giản không đủ**:
- `sin()` → `smoothstep()` → `mix()` = flat 2D stripe, không có chiều sâu
- Target visual có **ridge profile** (sáng giữa, tối mép) → cảm giác 3D
- Target có **domain-warped FBM** (2 lớp chồng nhau) → distortion organic, không lặp

**3 thay đổi quan trọng**:

1. **Distortion**: thay `sin(sin())` bằng **FBM 2 lớp domain-warped**:
```glsl
float d1 = fbm(uvA * waveFreq + vec2(t * 0.31, t * 0.17));
float d2 = fbm(uvA * waveFreq * 1.8 + d1 * 0.9 + ...); // d1 warp d2
float distort = (d1 * 0.65 + d2 * 0.35 - 0.5) * waveAmplitude;
```

2. **Stripe profile**: thay `smoothstep(mix)` bằng **ridge + shadow**:
```glsl
float wave   = sin(rotated * freq * PI * 2.0);
float ridge  = pow(max(wave,  0.0), sharpness); // lit face
float shadow = pow(max(-wave, 0.0), 1.2) * 0.55; // valley shadow
```

3. **Color model**: 3 tầng thay vì mix đơn giản:
```glsl
col = palette[0];                          // dark base
col = mix(col, palette[1], ridge);         // amber fill
col = mix(col, palette[0] * 0.3, shadow); // deepen valley
col += palette[2] * pow(ridge, 4.0) * glow; // specular peak
```

**u_stripeWidth repurposed**: không còn là width 0-1, thay bằng **ridge sharpness** (0.3 = soft, 3.0 = sharp). Cần update UI label từ "Stripe Width" → "Ridge Sharpness" và đặt giới hạn slider là `[0.3, 3.0]`.

**GLSL Source (`tiger-wave.frag.glsl`)**:
```glsl
precision mediump float;

uniform float u_time;
uniform vec2  u_resolution;
uniform float u_grain;
uniform float u_speed;
uniform vec3  u_palette[5];
uniform float u_stripeAngle;
uniform float u_stripeFrequency;
uniform float u_stripeWidth;    // repurposed: ridge sharpness (0.3–3.0)
uniform float u_waveAmplitude;
uniform float u_waveFrequency;
uniform float u_glow;

const float PI = 3.141592653589793;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    v   += amp * valueNoise(p);
    p   *= 2.17;
    amp *= 0.48;
  }
  return v;
}

void main() {
  vec2 uv  = gl_FragCoord.xy / u_resolution.xy;
  float ar = u_resolution.x / u_resolution.y;
  vec2 uvA = vec2(uv.x * ar, uv.y);

  float t = u_time * u_speed;

  float d1 = fbm(uvA * u_waveFrequency + vec2(t * 0.31, t * 0.17));
  float d2 = fbm(uvA * u_waveFrequency * 1.8 + d1 * 0.9 + vec2(-t * 0.19, t * 0.13));

  float distort = (d1 * 0.65 + d2 * 0.35 - 0.5) * u_waveAmplitude;

  float angle   = u_stripeAngle * PI / 180.0;
  float rotated = uv.x * cos(angle) + uv.y * sin(angle) + distort;

  float wave   = sin(rotated * u_stripeFrequency * PI * 2.0);

  float ridge  = pow(max(wave, 0.0), u_stripeWidth);
  float shadow = pow(max(-wave, 0.0), 1.2) * 0.55;

  float surfNoise = fbm(uvA * 5.0 + vec2(t * 0.08, 0.0));
  ridge *= 0.80 + surfNoise * 0.20;

  vec3 col = u_palette[0];
  col = mix(col, u_palette[1], ridge);
  col = mix(col, u_palette[0] * 0.3, shadow);
  col += u_palette[2] * pow(ridge, 4.0) * u_glow;

  float ao = 1.0 - (1.0 - ridge) * shadow * 0.4;
  col *= ao;

  col += vec3((rand(uv + u_time * 0.1) - 0.5) * u_grain);

  col = clamp(col, 0.0, 1.0);
  gl_FragColor = vec4(col, 1.0);
}
```
 
---
 
## Preset 9 — Waterfall
 
**Visual**: Thác nước chảy với phong cách pixel-art. Có hiệu ứng xếp tầng (stepping/posterized effect) đặc trưng, phần đáy phát sáng mạnh.
 
**Engine stack**:
- Engine: Shader
- Renderer: Full canvas
- Phase 1

**Palette**:
```
colors: ["#1a4d33", "#0d3b28", "#2d7a4f", "#0a2218", "#5fad8a"]
background: "#050f09"
```
 
**Shader parameters**:
```ts
shader: {
  preset: "waterfall",
  speed: 1.0,
  grain: 0.05
}
```

**Shader file**: `src/engines/shader/shaders/waterfall.frag.glsl`

**Đặc điểm nổi bật & Cách Port**:
1. **Procedural Noise**: Loại bỏ texture pipeline, sử dụng hàm `valueNoise` 2D để tạo hoa văn dịch chuyển.
2. **Pixelation**: Áp dụng `uv_pixel` bằng cách floor tọa độ theo resolution tỉ lệ 4: `floor(uv * (u_resolution / 4.0)) / (u_resolution / 4.0)`.
3. **Displacement**: Trích xuất độ lệch x/y từ noise chuyển động theo thời gian:
   ```glsl
   float dx = valueNoise(vec2(uv_pixel.x * 3.0, (uv_pixel.y + time) * 0.15));
   float dy = valueNoise(vec2(uv_pixel.x * 2.5 + 1.7, (uv_pixel.y + time) * 0.12));
   vec2 displace = vec2((dx - 0.5) * 0.5, (dy - 1.0) * 0.25);
   ```
4. **Stepping/Posterized Effect**: Áp dụng hiệu ứng cắt tầng lên color noise: `floor(colorN * 10.0) / 5.0`.
5. **Glow & Gradient**:
   - Tối dần ở đỉnh: `col -= 0.45 * pow(uv_pixel.y, 8.0)`
   - Phát sáng ở đáy: `col += pow(1.0 - uv.y, 8.0)`

---
 
## Summary table
 
| # | Name | Engine | Renderer | Complexity | Priority |
|---|------|--------|----------|------------|---------|
| 1 | Vortex Dashes | Flow Field | Capsule | Medium | Phase 1 |
| 2 | Dense Blob Vortex | Flow Field | Blob | Medium | Phase 1 |
| 3 | Liquid Symmetry | Shader | Full canvas | Low | Phase 1 |
| 4 | Paint Swirl | Shader | Full canvas | Low | Phase 1 |
| 5 | Mosaic Squares | Shader + Canvas | Cell renderer | High | Phase 2 |
| 6 | Voronoi Cells | Voronoi GLSL | Edge glow | Medium | Phase 2 |
| 7 | Isometric Voxel | Heightmap | ISO Canvas | High | Phase 2 |
| 8 | Tiger Wave | Shader | Full canvas | Low | Phase 1 |
| 9 | Waterfall | Shader | Full canvas | Low | Phase 1 |
 
## Shared palette — "Studio Dark"
 
Preset 1-4 share một tone màu. Dùng làm default palette when launch:
```ts
export const PALETTE_STUDIO_DARK = {
  colors: ["#1a6b8a", "#c44d2a", "#e8b87a", "#6b3d7a", "#3d2a5c"],
  background: "#0a0a0f",
  foreground: "#e8b87a"
}
```
