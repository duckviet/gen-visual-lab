import type { Vec2Like } from "@/shared/types/app";

export function sampleTextPoints(text: string, fontSize: number, targetCount: number): Vec2Like[] {
  const value = text.trim() || "SHAPE";
  const canvas = document.createElement("canvas");
  const width = 1024;
  const height = 512;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return [{ x: 0.5, y: 0.5 }];
  }

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${fontSize * 3}px system-ui, sans-serif`;
  ctx.fillText(value.slice(0, 30), width / 2, height / 2);

  const imageData = ctx.getImageData(0, 0, width, height);
  const rawPoints: Vec2Like[] = [];
  const stride = 3;

  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < width; x += stride) {
      const alpha = imageData.data[(y * width + x) * 4 + 3];
      if (alpha > 40) {
        rawPoints.push({ x, y });
      }
    }
  }

  if (rawPoints.length === 0) {
    return [{ x: 0.5, y: 0.5 }];
  }

  const sampled: Vec2Like[] = [];
  const step = Math.max(1, Math.floor(rawPoints.length / targetCount));

  for (let i = 0; i < rawPoints.length && sampled.length < targetCount; i += step) {
    sampled.push(rawPoints[i]);
  }

  return normalizePoints(sampled);
}

export function normalizePoints(points: Vec2Like[]): Vec2Like[] {
  if (points.length === 0) {
    return [];
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  const width = maxX - minX;
  const height = maxY - minY;

  if (width === 0 && height === 0) {
    return points.map(() => ({ x: 0.5, y: 0.5 }));
  }

  const maxDim = Math.max(width, height, 1);
  const scale = 1 / maxDim;

  return points.map((point) => ({
    x: (point.x - (minX + width * 0.5)) * scale + 0.5,
    y: (point.y - (minY + height * 0.5)) * scale + 0.5,
  }));
}
