precision mediump float;

uniform float u_time;
uniform vec2  u_resolution;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_grain;
uniform float u_speed;
uniform vec3  u_palette[5];

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
    p *= 2.03;
    amplitude *= 0.5;
  }

  return value;
}

vec2 rotate(vec2 uv, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c) * uv;
}

float foamBand(float y, float line, float width, float breakup) {
  float band = 1.0 - smoothstep(0.0, width, abs(y - line));
  return band * smoothstep(0.24, 0.78, breakup);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / u_resolution.y;
  float t = u_time * u_speed;

  vec2 noiseUv = vec2(uv.x * aspect, uv.y);
  vec2 drift = rotate(noiseUv - 0.5, sin(t * 0.21) * u_swirl * 0.25) + 0.5;
  float broadNoise = fbm(drift * vec2(2.0, 1.6) + vec2(t * 0.10, -t * 0.06));
  float fineNoise = fbm(noiseUv * vec2(8.0, 5.5) + broadNoise * 1.7 + vec2(-t * 0.22, t * 0.09));

  float primaryWave = sin(uv.x * 12.0 + t * 0.85) * 0.028;
  float secondaryWave = sin(uv.x * 27.0 - t * 0.65 + broadNoise * 3.0) * 0.014;
  float shoreLine = 0.35 + (broadNoise - 0.5) * 0.10 * u_distortion + primaryWave + secondaryWave;

  float breakerNoise = fbm(noiseUv * vec2(3.3, 2.0) + vec2(-t * 0.08, t * 0.12));
  float breakerLine = shoreLine + 0.20 + (breakerNoise - 0.5) * 0.08 * u_distortion + sin(uv.x * 16.0 + t * 0.42) * 0.018;

  float waterMask = smoothstep(shoreLine - 0.035, shoreLine + 0.035, uv.y);
  float deepWater = smoothstep(breakerLine + 0.06, 0.96, uv.y);
  float wetSand = (1.0 - waterMask) * (1.0 - smoothstep(0.00, 0.23, shoreLine - uv.y));

  float sandGrain = rand(floor(uv * u_resolution.xy * 0.82) + floor(t * 8.0));
  vec3 sandColor = mix(u_palette[4], u_palette[3], wetSand);
  sandColor += (sandGrain - 0.5) * 0.075;
  sandColor *= 0.93 + fbm(noiseUv * vec2(13.0, 8.0)) * 0.14;

  vec3 waterColor = mix(u_palette[1], u_palette[0], deepWater);
  waterColor += (fineNoise - 0.5) * vec3(0.02, 0.08, 0.07);
  waterColor = mix(waterColor, u_palette[2], smoothstep(shoreLine + 0.02, breakerLine, uv.y) * 0.16);

  float shoreFoamBreakup = fbm(noiseUv * vec2(18.0, 7.0) + vec2(t * 0.30, -t * 0.05));
  float breakerFoamBreakup = fbm(noiseUv * vec2(16.0, 9.0) + vec2(-t * 0.20, t * 0.18));
  float shoreFoam = foamBand(uv.y, shoreLine + 0.018, 0.082, shoreFoamBreakup);
  float breakerFoam = foamBand(uv.y, breakerLine, 0.055, breakerFoamBreakup);

  // Wave run-up pulse: moving wave fronts that push foam inland briefly
  float wavePulse = sin(uv.x * 24.0 - t * 6.0 + fineNoise * 2.0);
  wavePulse = max(0.0, wavePulse);
  wavePulse = pow(wavePulse, 3.0);
  float runupOffset = wavePulse * 0.06 * (0.6 + 0.4 * breakerFoam);
  float runupLine = shoreLine + runupOffset;
  float runupFoam = smoothstep(runupLine - 0.06, runupLine + 0.02, uv.y) * wavePulse * exp(- (uv.y - shoreLine) * 18.0);

  float veinNoise = fbm(vec2(noiseUv.x * 10.0 + fineNoise * 2.8, noiseUv.y * 18.0 - t * 0.70));
  float veinShape = smoothstep(0.62, 0.79, veinNoise) * (1.0 - smoothstep(0.88, 0.98, veinNoise));
  float shallowZone = smoothstep(shoreLine + 0.01, shoreLine + 0.16, uv.y) * (1.0 - smoothstep(breakerLine + 0.04, breakerLine + 0.18, uv.y));
  float veins = veinShape * shallowZone * smoothstep(0.22, 0.78, shoreFoamBreakup);

  // Mix in runup foam (short-lived, moves inland) and boost shore foam for visible crash
  float foam = clamp(shoreFoam * 1.35 + breakerFoam * 1.05 + veins * 0.58 + runupFoam * 1.6, 0.0, 1.0);
  // Slightly displace water mask while wavePulse is active so water looks like it's rushing up
  float waterMaskRun = smoothstep(shoreLine - 0.035 - runupOffset * 0.5, shoreLine + 0.035 + runupOffset * 0.2, uv.y);
  vec3 color = mix(sandColor, waterColor, waterMaskRun);
  color = mix(color, u_palette[2], foam);

  float vignette = smoothstep(0.0, 0.10, uv.y) * (1.0 - smoothstep(0.82, 1.0, uv.y));
  color *= mix(0.94, 1.03, vignette);
  color += vec3((rand(uv * u_resolution.xy + u_time * 0.1) - 0.5) * u_grain);

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
