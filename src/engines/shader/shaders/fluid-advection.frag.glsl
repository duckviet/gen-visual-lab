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

float field(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += sin(p.x * 3.1 + cos(p.y * 2.7 + u_time * u_speed)) * a;
    p = mat2(0.8, -0.6, 0.6, 0.8) * p * 1.65;
    a *= 0.55;
  }
  return v;
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
  vec2 p = (uv - 0.5) * 2.0;
  for (int i = 0; i < 4; i++) {
    p += sin(p.yx * (3.0 + u_swirl) + u_time * u_speed) * u_distortion * 0.1;
    p = mat2(cos(0.35), -sin(0.35), sin(0.35), cos(0.35)) * p;
  }
  float n = field(p);
  vec3 color = samplePalette((n + 1.0) * 0.5);
  color += vec3((rand(uv + u_time) - 0.5) * u_grain);
  gl_FragColor = vec4(color, 1.0);
}
