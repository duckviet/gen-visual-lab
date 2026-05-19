# GLSL Shader Uniforms

All fragment shaders in the **Generative Shape Lab** project must declare and map to the following set of active uniforms:

```glsl
uniform float     u_time;           // Absolute temporal accumulator (seconds)
uniform vec2      u_resolution;     // Width & Height of viewport (pixels)
uniform float     u_distortion;     // Coordinate grid distortion factor [0.0 - 2.0]
uniform float     u_swirl;          // Rotational turbulence multiplier [0.0 - 2.0]
uniform float     u_grain;          // Dithering analog grain opacity [0.0 - 1.0]
uniform float     u_speed;          // Time evolution multiplier [0.0 - 3.0]
uniform vec3      u_palette[5];     // Dynamic color swatches (3-component float colors)
```

---

## Uniform Descriptions & Mappings

### 1. `u_time`
- **React Source**: Managed inside the PreviewStage rendering tick using a high-precision timer or RAF clock: `timeVal += deltaTime * state.shader.speed`.
- **Purpose**: Evolves noise equations over time to create endless fluid motions.

### 2. `u_resolution`
- **React Source**: Matches the active canvas size: `[state.canvas.width, state.canvas.height]`.
- **Purpose**: Normalizes pixel coords `gl_FragCoord.xy` to relative UV coordinate space `[0.0, 1.0]^2`.

### 3. `u_distortion`
- **React Source**: Bound to `state.shader.distortion`.
- **Purpose**: Multiplies the displacement scale vector inside fractal Brownian noise calculations.

### 4. `u_swirl`
- **React Source**: Bound to `state.shader.swirl`.
- **Purpose**: Multiplies coordinate rotation matrices inside turbulent loops.

### 5. `u_grain`
- **React Source**: Bound to `state.shader.grain`.
- **Purpose**: Governs the strength of the static grain dithering overlay applied right before writing to `gl_FragColor`.

### 6. `u_speed`
- **React Source**: Bound to `state.shader.speed`.
- **Purpose**: Directly scales `u_time` increments to control animation speed.

### 7. `u_palette`
- **React Source**: Serialized from the Zustand 5 HEX swatches `state.palette.colors`.
- **Processing**: Each hex code (e.g. `"#FF007F"`) is converted to a 3-component float `vec3` where each value sits in the range `[0.0, 1.0]`:
  ```ts
  const hexToRGBFloat = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
  };
  ```
