precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_speed;
uniform vec3 u_palette[5];
uniform float u_voronoiSiteCount;
uniform float u_voronoiEdgeWidth;
uniform float u_voronoiEdgeSoftness;
uniform float u_voronoiGlowRadius;
uniform float u_voronoiGlowIntensity;
uniform float u_voronoiWarpStrength;
uniform float u_voronoiWarpScale;
uniform float u_voronoiThicknessVariation;
uniform float u_voronoiJunctionBoost;
uniform float u_voronoiContrast;
uniform float u_grain;

float rand(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += valueNoise(p) * amplitude;
    p *= 2.03;
    amplitude *= 0.5;
  }
  return value;
}

vec2 warpUv(vec2 uv, float time) {
  vec2 p = uv * u_voronoiWarpScale;
  vec2 warp = vec2(
    fbm(p + vec2(time * 0.25, 3.7)),
    fbm(p + vec2(8.1, -time * 0.22))
  ) - 0.5;
  return uv + warp * u_voronoiWarpStrength;
}

vec2 sitePosition(float i, float time) {
  float a = rand(vec2(i, 3.7)) * 6.2831853;
  float r = pow(rand(vec2(i, 9.1)), 1.7) * 0.48;
  vec2 base = vec2(0.5) + vec2(cos(a), sin(a)) * r;
  vec2 drift = vec2(sin(time + i * 1.3), cos(time * 0.7 + i * 2.1)) * 0.018;
  return base + drift;
}

void main() {
  vec2 baseUv = gl_FragCoord.xy / u_resolution.xy;
  vec2 uv = warpUv(baseUv, u_time * u_speed);
  float d1 = 10.0;
  float d2 = 10.0;
  float d3 = 10.0;
  float count = min(u_voronoiSiteCount, 120.0);

  for (int i = 0; i < 120; i++) {
    if (float(i) >= count) break;
    float d = distance(uv, sitePosition(float(i), u_time * u_speed));
    if (d < d1) {
      d3 = d2;
      d2 = d1;
      d1 = d;
    } else if (d < d2) {
      d3 = d2;
      d2 = d;
    } else if (d < d3) {
      d3 = d;
    }
  }

  float edgeDistance = d2 - d1;
  float localNoise = fbm(baseUv * u_voronoiWarpScale * 2.4 + u_time * u_speed * 0.1);
  float widthVariation = mix(1.0, 0.55 + localNoise * 0.9, u_voronoiThicknessVariation);
  float edgeWidth = u_voronoiEdgeWidth * widthVariation;
  float softness = max(u_voronoiEdgeSoftness, 0.0001);
  float edge = 1.0 - smoothstep(edgeWidth, edgeWidth + softness, edgeDistance);
  float glowBand = 1.0 - smoothstep(edgeWidth, edgeWidth + u_voronoiGlowRadius + softness, edgeDistance);
  float glow = max(glowBand - edge, 0.0) * u_voronoiGlowIntensity;
  float junction = 1.0 - smoothstep(0.0, edgeWidth * 2.5 + softness, abs(d3 - d2));
  vec3 membrane = u_palette[2] * edge + u_palette[3] * glow + u_palette[3] * junction * edge * u_voronoiJunctionBoost;
  vec3 color = u_palette[0] + membrane;
  color = pow(max(color, vec3(0.0)), vec3(1.0 / max(u_voronoiContrast, 0.001)));
  color += vec3((rand(baseUv + u_time) - 0.5) * u_grain);
  gl_FragColor = vec4(color, 1.0);
}
