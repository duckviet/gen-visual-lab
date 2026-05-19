# Error Handling Specification

This document defines the exact pathways, user notifications (UI Toasts), and safe fallback states to prevent application crashes when encountering malformed inputs or hardware limitations.

---

## 1. SVG Parsing & Validation Failures

### Scenarios
- The user uploads a malformed SVG file containing corrupt XML.
- The SVG uploaded has no parseable tags (`path`, `rect`, `circle`, `ellipse`).
- The SVG has zero dimensions or is missing a `viewBox` attribute.

### Handling Pipeline
```
[User uploads SVG file]
         │
         ▼
[svg-parser.ts parses XML via svgson]
         │
         ├── Error caught (corrupt XML / empty nodes)
         ▼
[Trigger UI Toast Notification]
"Unable to parse SVG. Please verify the file is a valid vector drawing containing vector paths."
         │
         ▼
[Trigger Safe State Fallback]
- Keep active inputType set to "svg" but set targets: targetPoints = []
- Boids engine immediately switches to Attraction Mode: "random flocking / center pull" (avoids NaN physics calculations).
```

### Safe Fallback Math Guard
If `targetPoints.length === 0` or undefined, target attraction acceleration must fall back to zero immediately to prevent divide-by-zero errors:
```ts
const force = targetPoints.length > 0 
  ? computeTargetForce(boid, targetPoints) 
  : new Vec2(0, 0);
```

---

## 2. Custom Font Upload Failures

### Scenarios
- The user uploads a non-font binary or WOFF2/WOFF (we only accept TTF/OTF).
- The font binary is corrupted, making `opentype.js` path translation fail.

### Handling Pipeline
```
[User uploads Font file]
         │
         ▼
[font-upload feature reads binary Blob via FileReader]
         │
         ▼
[opentype.parse(arrayBuffer) tries parsing]
         │
         ├── Error caught (corrupt font / invalid signature)
         ▼
[Trigger UI Toast Notification]
"Failed to parse font file. Ensure you uploaded a valid, uncorrupt .ttf or .otf file."
         │
         ▼
[Trigger Safe State Fallback]
- Revert text.fontFamily = "system-ui"
- Re-run sampling using the canvas-based 2D font rasterizer fallback.
- Boids target points resample using Arial / system-ui paths to prevent empty visuals.
```

---

## 3. WebGL Context Loss & Shader Failures

### Scenarios
- Custom shader code compilation fails due to platform GPU limits or shader syntax bugs.
- The browser triggers a `webglcontextlost` event due to GPU overload or screen lock.

### Handling Pipeline (Context Loss)
```
[Browser fires "webglcontextlost" event]
         │
         ▼
[WebGL Stage listener catches event]
         │
         ▼
[Action: Stop u_time increment, suspend gl.draw calls]
         │
         ▼
[Display Console Alert & Flat CSS fallback]
"WebGL Context lost. Suspending background rendering until restored."
- Render background canvas with flat CSS color: style.backgroundColor = palette.background
         │
         ▼
[GPU recovers -> Browser fires "webglcontextrestored"]
         │
         ▼
[Re-initialize WebGL textures/compiled shaders and resume draw loops]
```

### Handling Pipeline (Shader Compile Error)
If a loaded fragment shader fails to compile at runtime, the renderer must catch the error immediately and fall back:
```ts
try {
  compileShader(gl, fragmentSource);
} catch (compileError) {
  console.error("Shader compilation failed: ", compileError);
  // Fall back to compiling solid flat background shader immediately
  compileShader(gl, SOLID_FALLBACK_SHADER);
  
  // Notify the user via a subtle toast
  showToast("Shader failed to compile. Falling back to default liquid shader.");
}
```
Where `SOLID_FALLBACK_SHADER` is a simple shader that renders the palette background color uniformly:
```glsl
precision mediump float;
uniform vec3 u_backgroundColor;
void main() {
  gl_FragColor = vec4(u_backgroundColor, 1.0);
}
```
