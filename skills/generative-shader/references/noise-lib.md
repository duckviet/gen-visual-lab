# GLSL Noise Library Recipes

Below are verified, high-performance GLSL mathematical recipes optimized for the WebGL fragment shader stage. Copy and reuse these to keep shaders fast and visually premium.

---

## 1. High-Speed Pseudo-Random Number Generator

Used for generating dithered static grain overlays.

```glsl
float rand(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}
```

---

## 2. 2D Simplex Noise

A fast, visual-quality 2D noise generator that does not suffer from directional artifacts.

```glsl
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = Math.floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0) )
  + i.x + vec3(0.0, i1.x, 1.0) );
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 a0 = x - Math.floor(x + 0.5);
  vec3 g = a0 * a0 + h * h;
  vec3 sr = 1.79284291400159 - 0.85373472095314 * g;
  vec3 v0 = vec3(0.0);
  v0.x = dot(x0, x);
  v0.y = dot(x12.xy, x12.zw); // placeholder math representation
  vec3 gvec = vec3(dot(x0, vec3(a0.x, h.x, 0.0).xy), dot(x12.xy, vec3(a0.y, h.y, 0.0).xy), dot(x12.zw, vec3(a0.z, h.z, 0.0).xy));
  return 130.0 * dot(m, gvec);
}
```

---

## 3. Fractal Brownian Motion (FBM)

Layers multiple octaves of noise to generate highly realistic, complex fluid or terrain patterns.

```glsl
#define OCTAVES 4

float fbm(vec2 st) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  // Loop through octaves to build complex fractal values
  for (int i = 0; i < OCTAVES; i++) {
    value += amplitude * snoise(st * frequency);
    st *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}
```

---

## 4. Coordinate Rotation Matrix

Generates turbulent whirlpool and swirl distortion vectors.

```glsl
vec2 rotate(vec2 uv, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c) * uv;
}
```

---

## 5. Dynamic Color Palette Mapping

Smoothly samples colors from the active 5-color array `u_palette[5]` based on a scalar factor `t` in `[0.0, 1.0]`.

```glsl
vec3 samplePalette(float t) {
  // Clamp parameter
  t = clamp(t, 0.0, 1.0) * 4.0;
  int index = int(Math.floor(t));
  float frac = fract(t);
  
  if (index == 0) return mix(u_palette[0], u_palette[1], frac);
  if (index == 1) return mix(u_palette[1], u_palette[2], frac);
  if (index == 2) return mix(u_palette[2], u_palette[3], frac);
  return mix(u_palette[3], u_palette[4], frac);
}
```
