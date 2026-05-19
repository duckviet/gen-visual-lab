precision mediump float;

uniform float u_time;
uniform vec2  u_resolution;
uniform float u_grain;
uniform float u_speed;
uniform vec3  u_palette[5];
uniform float u_stripeAngle;
uniform float u_stripeFrequency;
uniform float u_stripeWidth;    // repurposed: ridge sharpness (0.5–3.0)
uniform float u_waveAmplitude;
uniform float u_waveFrequency;
uniform float u_glow;

const float PI = 3.141592653589793;

// ── Noise helpers ─────────────────────────────────────────────────────────────

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);                    // smoothstep curve
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// 5-octave FBM — creates organic, layered distortion
float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    v   += amp * valueNoise(p);
    p   *= 2.17;          // slight non-power-of-2 avoids grid artefacts
    amp *= 0.48;
  }
  return v;               // range ≈ 0..1
}

// ── Main ──────────────────────────────────────────────────────────────────────

void main() {
  vec2 uv  = gl_FragCoord.xy / u_resolution.xy;
  float ar = u_resolution.x / u_resolution.y;
  vec2 uvA = vec2(uv.x * ar, uv.y);   // aspect-corrected

  float t = u_time * u_speed;

  // ── Two-layer FBM distortion ───────────────────────────────────────────────
  // Layer 1: coarse organic warp
  float d1 = fbm(uvA * u_waveFrequency + vec2(t * 0.31, t * 0.17));
  // Layer 2: finer detail driven by layer 1 (domain warping)
  float d2 = fbm(uvA * u_waveFrequency * 1.8 + d1 * 0.9 + vec2(-t * 0.19, t * 0.13));

  float distort = (d1 * 0.65 + d2 * 0.35 - 0.5) * u_waveAmplitude;

  // ── Rotated stripe axis ────────────────────────────────────────────────────
  float angle   = u_stripeAngle * PI / 180.0;
  float rotated = uv.x * cos(angle) + uv.y * sin(angle) + distort;

  // ── Ridge profile (volumetric 3D feel) ────────────────────────────────────
  // sin() gives -1..1 wave; we want bright ridges with dark valleys.
  float wave   = sin(rotated * u_stripeFrequency * PI * 2.0);

  // Positive lobe  → lit face of ridge
  float ridge  = pow(max(wave, 0.0), u_stripeWidth);   // sharpness via exponent
  // Negative lobe → shadow in valley (subtle, keeps blacks deep)
  float shadow = pow(max(-wave, 0.0), 1.2) * 0.55;

  // Internal texture: FBM noise mapped onto each stripe surface
  float surfNoise = fbm(uvA * 5.0 + vec2(t * 0.08, 0.0));
  ridge *= 0.80 + surfNoise * 0.20;                     // micro-variation in brightness

  // ── Color assembly ────────────────────────────────────────────────────────
  // u_palette[0] = near-black background / valley
  // u_palette[1] = base amber / mid-tone
  // u_palette[2] = bright highlight (specular)

  vec3 col = u_palette[0];                              // start from dark

  // Fill ridge with amber gradient
  col = mix(col, u_palette[1], ridge);

  // Deepen valleys with shadow
  col = mix(col, u_palette[0] * 0.3, shadow);

  // Specular hot-spot at ridge peak
  col += u_palette[2] * pow(ridge, 4.0) * u_glow;

  // Subtle ambient occlusion: darken where both ridge and neighbor are low
  float ao = 1.0 - (1.0 - ridge) * shadow * 0.4;
  col *= ao;

  // ── Grain ─────────────────────────────────────────────────────────────────
  col += vec3((rand(uv + u_time * 0.1) - 0.5) * u_grain);

  col = clamp(col, 0.0, 1.0);
  gl_FragColor = vec4(col, 1.0);
}
