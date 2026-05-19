precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_grain;
uniform float u_speed;
uniform vec3 u_palette[5];

float rand(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
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

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float scan = sin((uv.y + u_time * u_speed * 0.05) * 260.0) * 0.025 * u_swirl;
  float noise = (rand(uv * 80.0 + u_time * u_speed) - 0.5) * u_distortion;
  float gradientWeight = clamp(uv.x * 0.5 + uv.y * 0.5 + scan + noise * 0.2, 0.0, 1.0);
  vec3 finalColor = samplePalette(gradientWeight);
  finalColor += vec3((rand(uv + u_time * 0.001) - 0.5) * u_grain * 0.45);
  gl_FragColor = vec4(finalColor, 1.0);
}
