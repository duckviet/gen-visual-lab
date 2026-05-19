---
name: generative-shader
description: Use this skill when the user asks to build, modify, optimize, debug, or configure WebGL GLSL fragment shaders, noise patterns (simplex, curl, FBM), liquid or terrain animations, or WebGL stages and regl context integrations for background textures.
---

# Generative Shader Skill

This skill guides the implementation of premium, high-performance GLSL fragment shaders and WebGL stage orchestrations inside the **Generative Shape Lab** project.

## Reference Map

- **Active Uniforms & Structs**: Read [`references/uniforms.md`](file:///home/duckviet/gen-visual-lab/skills/generative-shader/references/uniforms.md) to ensure correct GLSL uniform binding.
- **Noise Recipes**: Read [`references/noise-lib.md`](file:///home/duckviet/gen-visual-lab/skills/generative-shader/references/noise-lib.md) for optimized GLSL algorithms (Simplex, Curl, FBM).
- **Built-in Presets**: Read [`references/presets.md`](file:///home/duckviet/gen-visual-lab/skills/generative-shader/references/presets.md) to inspect the factory presets code.

---

## Core Workflow

### Step 1: Uniform Verification
Before writing any shader logic, check that all incoming variables are mapped correctly in your WebGL/regl context. Every fragment shader must declare and utilize the exact uniforms defined in the project configuration.

### Step 2: Implement Coordinate Warping (UV Warping)
To create organic, flow-like effects, avoid straight coordinates. Apply dynamic domain warping using FBM (Fractional Brownian Motion) and Curl noise:
1. Normalize screen coordinates to `uv = gl_FragCoord.xy / u_resolution`.
2. Apply offset vector `uv += fbm(uv * scale + u_time * u_speed) * u_distortion`.
3. Apply rotational warping matrix scale multiplied by `u_swirl`.

### Step 3: Map Palette Colors
Interpolate smoothly between the 5-color palette array `u_palette[5]` based on noise calculations. Do not hardcode HEX color conversions; use smooth step interpolation.

### Step 4: Inject Film Grain Overlay
Overlay fine analog dithered grain based on `u_grain` to create a premium, tactile texture:
```glsl
float grainNoise = (rand(uv + u_time) - 0.5) * u_grain;
color += vec3(grainNoise);
```

### Step 5: WebGL Context Safety
Ensure the renderer binds the `webglcontextlost` and `webglcontextrestored` listeners, and falls back to a solid `palette.background` color on compile failure.

---

## Critical Rules
- **No Vertex Customization**: Never write custom vertex shaders. All shaders run on a flat fullscreen quad managed in `webgl-stage.tsx`.
- **Preserve Drawing Buffer**: Initialize the WebGL context with `{ preserveDrawingBuffer: true }` to enable composite PNG exports.
- **No High-Complexity loops**: Avoid massive `for` loops inside the shader to maintain $\ge 60$ FPS on standard displays. Limit FBM octaves to 4.
