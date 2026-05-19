precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_speed;
uniform vec3 u_palette[5];
uniform float u_voronoiSiteCount;
uniform float u_voronoiEdgeWidth;
uniform float u_voronoiGlowRadius;
uniform float u_voronoiGlowIntensity;

float rand(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

vec2 sitePosition(float i, float time) {
  float a = rand(vec2(i, 3.7)) * 6.2831853;
  float r = pow(rand(vec2(i, 9.1)), 1.7) * 0.48;
  vec2 base = vec2(0.5) + vec2(cos(a), sin(a)) * r;
  vec2 drift = vec2(sin(time + i * 1.3), cos(time * 0.7 + i * 2.1)) * 0.018;
  return base + drift;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float d1 = 10.0;
  float d2 = 10.0;
  float count = min(u_voronoiSiteCount, 120.0);

  for (int i = 0; i < 120; i++) {
    if (float(i) >= count) break;
    float d = distance(uv, sitePosition(float(i), u_time * u_speed));
    if (d < d1) {
      d2 = d1;
      d1 = d;
    } else if (d < d2) {
      d2 = d;
    }
  }

  float edgeDistance = d2 - d1;
  float edge = smoothstep(u_voronoiEdgeWidth, 0.0, edgeDistance);
  float glow = smoothstep(u_voronoiGlowRadius, 0.0, edgeDistance) * u_voronoiGlowIntensity;
  vec3 color = u_palette[0] + u_palette[2] * edge + u_palette[3] * glow;
  gl_FragColor = vec4(color, 1.0);
}
