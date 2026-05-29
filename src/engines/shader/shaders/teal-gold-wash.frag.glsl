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

  vec2 aspectUv = vec2(uv.x * aspect, uv.y);
  vec2 centered = uv - 0.5;
  centered = rotate(centered, sin(t * 0.22) * u_swirl * 0.12);
  vec2 diagonalUv = rotate(vec2(centered.x * aspect, centered.y), -0.58) + 0.5;

  float broadWarp = fbm(diagonalUv * vec2(1.7, 2.8) + vec2(t * 0.060, -t * 0.045));
  float cloudWarp = fbm(aspectUv * vec2(2.2, 1.6) + vec2(-t * 0.040, t * 0.052) + broadWarp);
  float diagonalY = diagonalUv.y + (broadWarp - 0.5) * 0.24 * u_distortion + sin(diagonalUv.x * 7.0 + cloudWarp * 3.1) * 0.030 * u_swirl;

  float goldLower = softBand(diagonalY, 0.18 + (broadWarp - 0.5) * 0.06, 0.090, 0.20);
  float goldMiddle = softBand(diagonalY, 0.41 + (cloudWarp - 0.5) * 0.08, 0.060, 0.16);
  float goldUpper = softBand(diagonalY, 0.70 + (broadWarp - 0.5) * 0.07, 0.052, 0.15);
  float aquaMist = softBand(diagonalY, 0.56 + (cloudWarp - 0.5) * 0.08, 0.105, 0.24);
  float shadowBand = softBand(diagonalY, 0.30 + (broadWarp - 0.5) * 0.06, 0.075, 0.17);

  float pigment = fbm(diagonalUv * vec2(2.4, 8.0) + vec2(t * 0.045, -t * 0.075) + broadWarp * 0.9);
  float longFiber = fbm(vec2(diagonalUv.x * 11.0 - t * 0.16, diagonalUv.y * 56.0 + cloudWarp * 2.8));
  float softFiber = fbm(vec2(diagonalUv.x * 18.0 + t * 0.09, diagonalUv.y * 30.0 + broadWarp * 3.0));
  float fiber = mix(longFiber, softFiber, 0.35);
  float brushLift = smoothstep(0.52, 0.92, fiber);
  float paintBreakup = mix(0.72, 1.20, pigment) + smoothstep(0.34, 0.78, fiber) * 0.16;

  float goldMask = clamp(goldLower * 0.85 + goldMiddle * 0.78 + goldUpper * 0.52, 0.0, 1.0);
  goldMask *= paintBreakup;
  goldMask = mix(goldMask, smoothstep(0.10, 0.84, goldMask), sharpness * 0.30);
  goldMask = clamp(goldMask, 0.0, 1.0);

  float aquaMask = clamp(aquaMist * mix(0.54, 0.96, cloudWarp) + brushLift * 0.12, 0.0, 1.0);
  float shadow = clamp(shadowBand * 0.58 + (1.0 - smoothstep(0.38, 0.88, uv.y)) * 0.24 + (1.0 - cloudWarp) * 0.18, 0.0, 1.0);

  vec3 base = mix(samplePalette(0.02), samplePalette(0.28), smoothstep(0.10, 0.88, uv.x + uv.y * 0.18));
  base = mix(base, samplePalette(0.18), cloudWarp * 0.22);

  vec3 aqua = samplePalette(0.42 + aquaMask * 0.08);
  vec3 gold = mix(samplePalette(0.66), samplePalette(0.86), smoothstep(0.22, 0.92, goldMask));
  vec3 darkGlaze = mix(samplePalette(0.00), samplePalette(0.12), cloudWarp);

  vec3 color = mix(base, aqua, aquaMask * 0.38);
  color = mix(color, gold, goldMask * 0.72);
  color = mix(color, darkGlaze, shadow * 0.24);
  color = mix(color, samplePalette(0.44), brushLift * aquaMask * 0.18);

  float canvasGrain = rand(floor(uv * u_resolution.xy * 0.78) + floor(t * 3.0));
  float fineCanvas = fbm(vec2(aspectUv.x * 52.0, uv.y * 42.0));
  float dryTexture = brushLift * (goldMask + aquaMask) * mix(0.04, 0.13, sharpness / 1.5);
  color += vec3((canvasGrain - 0.5) * u_grain * 0.22);
  color += vec3((fineCanvas - 0.5) * u_grain * 0.13);
  color = mix(color, base, dryTexture);
  color = mix(vec3(0.5), color, 1.0 + sharpness * 0.12);

  float vignette = smoothstep(0.0, 0.10, uv.y) * (1.0 - smoothstep(0.92, 1.0, uv.y));
  color *= mix(0.90, 1.04, vignette);

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
