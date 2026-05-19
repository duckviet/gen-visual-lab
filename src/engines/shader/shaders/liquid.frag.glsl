precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_grain;
uniform float u_speed;
uniform vec3 u_palette[5];
uniform float u_symmetry;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = x0.x > x0.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 st) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * snoise(st);
    st *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

float rand(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
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

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  if (u_symmetry > 1.5 && u_symmetry < 2.5) {
    uv = abs(uv * 2.0 - 1.0);
  } else if (u_symmetry > 0.5 && u_symmetry < 1.5) {
    uv.x = abs(uv.x * 2.0 - 1.0);
  } else if (u_symmetry > 2.5) {
    vec2 centeredRadial = uv - 0.5;
    float radius = length(centeredRadial);
    float angleRadial = atan(centeredRadial.y, centeredRadial.x);
    angleRadial = mod(angleRadial, 1.5707963);
    uv = vec2(cos(angleRadial), sin(angleRadial)) * radius + 0.5;
  }
  vec2 centered = uv - 0.5;
  float distFromCenter = length(centered);
  centered = rotate(centered, distFromCenter * u_swirl * 4.0 + u_time * u_speed * 0.5);
  uv = centered + 0.5;
  float displacement = fbm(uv * 3.0 + u_time * u_speed * 0.2) * u_distortion;
  uv += vec2(displacement);
  float colorWeight = (fbm(uv * 2.5 - u_time * u_speed * 0.1) + 1.0) * 0.5;
  vec3 finalColor = samplePalette(colorWeight);
  finalColor += vec3((rand(uv + u_time) - 0.5) * u_grain * 0.25);
  gl_FragColor = vec4(finalColor, 1.0);
}
