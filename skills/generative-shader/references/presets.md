# Factory Shader Presets

These are the exact GLSL fragment source structures for the three factory background shader modes.

---

## 1. Liquid Flow Shader (`liquid.frag.glsl`)

Creates flowing organic patterns resembling liquid mercury or slow lava lamp motion.

```glsl
precision mediump float;

uniform float     u_time;
uniform vec2      u_resolution;
uniform float     u_distortion;
uniform float     u_swirl;
uniform float     u_grain;
uniform float     u_speed;
uniform vec3      u_palette[5];

// Insert Noise functions (snoise, fbm, rotate, samplePalette, rand) here...

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  
  // Center UV coordinates to run swirl matrix
  vec2 centeredUV = uv - 0.5;
  float distFromCenter = length(centeredUV);
  
  // Calculate swirl rotation factor
  float angle = distFromCenter * u_swirl * 4.0 + u_time * u_speed * 0.5;
  centeredUV = rotate(centeredUV, angle);
  
  // Map back to standard UV range
  uv = centeredUV + 0.5;
  
  // Step 1: Compute Fractal displacement
  float displacement = fbm(uv * 3.0 + u_time * u_speed * 0.2) * u_distortion;
  
  // Step 2: Warp coordinate grid
  uv.x += displacement;
  uv.y += displacement;
  
  // Step 3: Compute final color scalar using complex FBM layer
  float colorWeight = fbm(uv * 2.5 - u_time * u_speed * 0.1);
  colorWeight = (colorWeight + 1.0) * 0.5; // map from [-1, 1] to [0, 1]
  
  // Step 4: Sample Palette
  vec3 finalColor = samplePalette(colorWeight);
  
  // Step 5: Add Film Grain
  float grainAmount = (rand(uv + u_time) - 0.5) * u_grain * 0.25;
  finalColor += vec3(grainAmount);
  
  gl_FragColor = vec4(finalColor, 1.0);
}
```

---

## 2. Terrain Heightfield Shader (`terrain.frag.glsl`)

Renders a simulated top-down topographic topographic heat map of mountain ridges.

```glsl
precision mediump float;

uniform float     u_time;
uniform vec2      u_resolution;
uniform float     u_distortion;
uniform float     u_swirl;
uniform float     u_grain;
uniform float     u_speed;
uniform vec3      u_palette[5];

// Insert snoise, fbm, samplePalette, rand...

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  
  // Step 1: Coordinate translation with speed
  vec2 movingUV = uv * 3.0 + vec2(u_time * u_speed * 0.1, 0.0);
  
  // Step 2: Compute rigid noise ridges (simulates cliffs)
  float ridgeVal = 1.0 - abs(snoise(movingUV + fbm(uv * 2.0) * u_distortion));
  
  // Step 3: Layer multiple height octaves
  float height = ridgeVal * 0.6 + fbm(movingUV * 4.0) * 0.3;
  height = clamp(height, 0.0, 1.0);
  
  // Step 4: Sample Palette
  vec3 finalColor = samplePalette(height);
  
  // Step 5: Film Grain dither
  float grainAmount = (rand(uv + u_time) - 0.5) * u_grain * 0.20;
  finalColor += vec3(grainAmount);
  
  gl_FragColor = vec4(finalColor, 1.0);
}
```

---

## 3. Analog Noise Grain Shader (`grain.frag.glsl`)

A highly texturized, dithered gradient background with coarse noise particle distributions.

```glsl
precision mediump float;

uniform float     u_time;
uniform vec2      u_resolution;
uniform float     u_distortion;
uniform float     u_swirl;
uniform float     u_grain;
uniform float     u_speed;
uniform vec3      u_palette[5];

// Insert snoise, fbm, samplePalette, rand...

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  
  // Step 1: Calculate linear color gradient weight
  float gradientWeight = uv.x * 0.5 + uv.y * 0.5;
  
  // Step 2: Apply high-frequency noise overlay
  float noiseIntensity = snoise(uv * 12.0 + u_time * u_speed * 0.3) * u_distortion * 0.2;
  gradientWeight = clamp(gradientWeight + noiseIntensity, 0.0, 1.0);
  
  // Step 3: Sample colors
  vec3 finalColor = samplePalette(gradientWeight);
  
  // Step 4: Heavy grain overlay
  float grainAmount = (rand(uv + u_time * 0.001) - 0.5) * u_grain * 0.45;
  finalColor += vec3(grainAmount);
  
  gl_FragColor = vec4(finalColor, 1.0);
}
```
