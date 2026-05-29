precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_grain;
uniform float u_speed;
uniform vec3 u_palette[5];
uniform float u_glow;

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
  float value = 0.0;
  float amplitude = 0.5;

  for (int i = 0; i < 4; i++) {
    value += amplitude * valueNoise(p);
    p *= 2.04;
    amplitude *= 0.5;
  }

  return value;
}

vec2 rotate(vec2 uv, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c) * uv;
}

vec3 samplePalette(float t) {
  t = clamp(t, 0.0, 1.0) * 4.0;
  int index = int(floor(t));
  float f = fract(t);

  if (index == 0) return mix(u_palette[0], u_palette[1], f);
  if (index == 1) return mix(u_palette[1], u_palette[2], f);
  if (index == 2) return mix(u_palette[2], u_palette[3], f);
  return mix(u_palette[3], u_palette[4], f);
}

float softBand(float y, float center, float width, float feather) {
  float distanceFromCenter = abs(y - center);
  return 1.0 - smoothstep(width, width + feather, distanceFromCenter);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / u_resolution.y;
  float t = u_time * u_speed;
  float sharpness = clamp(u_glow, 0.0, 1.5);

  vec2 paperUv = vec2(uv.x * aspect, uv.y);
  vec2 centered = uv - 0.5;
  vec2 bowed = rotate(centered, (uv.y - 0.45) * u_swirl * 0.16 + sin(t * 0.55) * 0.025) + 0.5;

  float broadWarp = fbm(vec2(bowed.x * aspect * 1.4, bowed.y * 2.2) + vec2(t * 0.115, -t * 0.075));
  float lateralWarp = fbm(vec2(bowed.x * aspect * 3.0 - t * 0.125, bowed.y * 1.5 + broadWarp + t * 0.035));
  float y = uv.y + (broadWarp - 0.5) * 0.18 * u_distortion + sin(uv.x * 4.2 + lateralWarp * 2.4) * 0.025 * u_swirl;

  float pigmentCloud = fbm(vec2(paperUv.x * 1.55 + t * 0.08, uv.y * 4.8 - t * 0.095) + broadWarp * 0.72);
  float brushDensity = fbm(vec2(paperUv.x * 2.8 - t * 0.07, uv.y * 11.0 + lateralWarp * 1.8));
  float longFiber = fbm(vec2(paperUv.x * 7.0 - t * 0.16 + lateralWarp * 1.4, uv.y * 72.0 + broadWarp * 4.2));
  float softFiber = fbm(vec2(paperUv.x * 12.0 + t * 0.10, uv.y * 38.0 + lateralWarp * 2.0));
  float bristleNoise = mix(longFiber, softFiber, 0.35);
  float dryBrush = smoothstep(0.36, 0.76, bristleNoise) * smoothstep(0.02, 0.62, pigmentCloud);
  float horizontalScrape = smoothstep(0.38, 0.70, fbm(vec2(paperUv.x * 9.0 - t * 0.13, uv.y * 58.0 + t * 0.09 + broadWarp * 2.2)));

  float upperVeil = softBand(y, 0.68 + (broadWarp - 0.5) * 0.04, 0.085, 0.18);
  float mainWash = softBand(y, 0.48 + (lateralWarp - 0.5) * 0.065, 0.105, 0.17);
  float darkRidge = softBand(y, 0.34 + (broadWarp - 0.5) * 0.045, 0.052, 0.115);
  float lowerVeil = softBand(y, 0.19 + (lateralWarp - 0.5) * 0.055, 0.075, 0.16);
  float paperGapUpper = softBand(y, 0.58 + (broadWarp - 0.5) * 0.035, 0.035, 0.085);
  float paperGapLower = softBand(y, 0.25 + (lateralWarp - 0.5) * 0.04, 0.040, 0.090);
  float lowRightBias = smoothstep(0.34, 0.98, uv.x) * (1.0 - smoothstep(0.32, 0.70, uv.y));
  float ridgeMass = darkRidge * (0.52 + lowRightBias * 0.62);

  float paperReveal = clamp(paperGapUpper * 0.58 + paperGapLower * 0.42, 0.0, 0.72);
  float bandTexture = mix(0.82, 1.18, pigmentCloud) + smoothstep(0.32, 0.74, brushDensity) * 0.12;
  float wash = clamp(upperVeil * 0.24 + mainWash * 0.60 + ridgeMass * 0.58 + lowerVeil * 0.30, 0.0, 1.0);
  wash *= bandTexture;
  wash *= 1.0 - paperReveal;
  wash += dryBrush * (mainWash + ridgeMass) * 0.10 + horizontalScrape * wash * 0.095;
  wash = mix(wash, smoothstep(0.10, 0.82, wash), sharpness * 0.34);
  wash = clamp(wash, 0.0, 1.0);

  float shade = clamp(mainWash * 0.24 + ridgeMass * 0.72 + dryBrush * 0.10, 0.0, 1.0);
  vec3 paperColor = samplePalette(0.02);
  vec3 paleWash = samplePalette(0.32 + wash * 0.16);
  vec3 deepWash = samplePalette(0.54 + shade * 0.28);
  vec3 color = mix(paperColor, paleWash, wash * 0.78);
  color = mix(color, deepWash, smoothstep(0.34, 0.90, shade) * 0.58);
  color = mix(color, paperColor, paperReveal * mix(0.34, 0.54, sharpness / 1.5));

  float paperGrain = rand(floor(uv * u_resolution.xy * 0.72) + floor(t * 3.0));
  float fineFiber = fbm(vec2(paperUv.x * 52.0, uv.y * 44.0));
  float strokeLift = smoothstep(mix(0.50, 0.64, sharpness / 1.5), 0.94, bristleNoise) * wash * mix(0.05, 0.12, sharpness / 1.5);
  color += vec3((paperGrain - 0.5) * u_grain * 0.20);
  color += vec3((fineFiber - 0.5) * u_grain * 0.12);
  color = mix(color, paperColor, strokeLift);
  color = mix(vec3(0.5), color, 1.0 + sharpness * 0.14);

  float vignette = smoothstep(0.0, 0.08, uv.y) * (1.0 - smoothstep(0.94, 1.0, uv.y));
  color *= mix(0.96, 1.03, vignette);

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
