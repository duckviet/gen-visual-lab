export function noise2D(x: number, y: number): number {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

export function smoothNoise2D(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const a = noise2D(ix, iy);
  const b = noise2D(ix + 1, iy);
  const c = noise2D(ix, iy + 1);
  const d = noise2D(ix + 1, iy + 1);
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy) * 2 - 1;
}

export function curlNoise2D(x: number, y: number, time: number): { x: number; y: number } {
  const eps = 0.001;
  const n1 = smoothNoise2D(x, y + eps + time);
  const n2 = smoothNoise2D(x, y - eps + time);
  const a = (n1 - n2) / (2 * eps);
  const n3 = smoothNoise2D(x + eps + time, y);
  const n4 = smoothNoise2D(x - eps + time, y);
  const b = (n3 - n4) / (2 * eps);
  return { x: a, y: -b };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
