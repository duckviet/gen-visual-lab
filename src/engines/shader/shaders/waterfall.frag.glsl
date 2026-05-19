precision mediump float;

uniform vec2  u_resolution;
uniform float u_time;
uniform vec3  u_palette[5];
uniform float u_speed;

float rand(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(rand(i), rand(i + vec2(1.0, 0.0)), f.x),
    mix(rand(i + vec2(0.0, 1.0)), rand(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  
  float time = u_time * u_speed * 0.4;
  
  vec2 uv_pixel = floor(uv * (u_resolution / 8.0)) / (u_resolution / 8.0);
  
  float disp = valueNoise(vec2(uv_pixel.x * 10.0, time * 0.08)) - 0.5;
  vec2 displace = vec2(disp * 0.12, 0.0);
  
  vec2 uv_tmp = vec2(
    uv_pixel.x + displace.x,
    (uv_pixel.y + time) * 0.06
  );
  
  float colorN = valueNoise(uv_tmp * vec2(7.0, 1.0));
  float noise  = floor(colorN * 7.0) / 7.0;
  
  vec3 dark   = mix(u_palette[0], u_palette[1], uv.y);
  vec3 bright = mix(u_palette[2], u_palette[3], uv.y);
  vec3 col    = mix(dark, bright, noise);
  
  float inv_uv = 1.0 - uv.y;
  
  col -= 0.55 * pow(uv.y, 6.0);
  col += pow(inv_uv, 5.0) * 0.9;
  col = clamp(col, 0.0, 1.0);
  
  gl_FragColor = vec4(col, 1.0);
}
