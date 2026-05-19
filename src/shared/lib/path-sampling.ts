import type { Font, PathCommand } from "opentype.js";
import { parse } from "svgson";
import type { Vec2Like } from "@/shared/types/app";
import { Vec2 } from "./math";
import { normalizePoints } from "./text-sampler";

type SvgNode = {
  name: string;
  attributes: Record<string, string>;
  children?: SvgNode[];
};

type Polyline = Vec2[];

const FLATTEN_STEPS = 16;

export function sampleFontTextPoints(font: Font, text: string, fontSize: number, targetCount: number): Vec2Like[] {
  const path = font.getPath(text.trim() || "SHAPE", 0, 0, fontSize);
  const polylines = pathCommandsToPolylines(path.commands);
  return normalizePoints(sampleEquidistantPoints(polylines, targetCount));
}

export async function sampleSvgPoints(svgSource: string, targetCount: number, mode: "outline" | "fill" = "outline"): Promise<Vec2Like[]> {
  if (mode === "fill") {
    const filled = await sampleSvgFillPoints(svgSource, targetCount);
    if (filled.length > 0) {
      return filled;
    }
  }

  const root = (await parse(svgSource)) as SvgNode;
  const nodes = flattenNodes(root);
  const polylines: Polyline[] = [];

  for (const node of nodes) {
    if (node.name === "path" && node.attributes.d) {
      polylines.push(...pathDataToPolylines(node.attributes.d));
    }
    if (node.name === "rect") {
      polylines.push(rectToPolyline(node.attributes));
    }
    if (node.name === "circle") {
      polylines.push(ellipseToPolyline(node.attributes, true));
    }
    if (node.name === "ellipse") {
      polylines.push(ellipseToPolyline(node.attributes, false));
    }
    if (node.name === "polygon" || node.name === "polyline") {
      polylines.push(pointsAttributeToPolyline(node.attributes.points ?? "", node.name === "polygon"));
    }
  }

  const valid = polylines.filter((polyline) => polyline.length > 1);
  if (valid.length === 0) {
    return [];
  }

  return normalizePoints(sampleEquidistantPoints(valid, targetCount));
}

export async function sampleSvgFillPoints(svgSource: string, targetCount: number): Promise<Vec2Like[]> {
  const canvas = document.createElement("canvas");
  const size = 512;
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return [];
  }

  const encoded = encodeURIComponent(svgSource)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encoded}`;

  try {
    await image.decode();
  } catch {
    return [];
  }

  ctx.drawImage(image, 0, 0, size, size);
  const imageData = ctx.getImageData(0, 0, size, size);
  const candidates: Vec2Like[] = [];
  const stride = 3;

  for (let y = 0; y < size; y += stride) {
    for (let x = 0; x < size; x += stride) {
      const alpha = imageData.data[(y * size + x) * 4 + 3];
      if (alpha > 32) {
        candidates.push({ x, y });
      }
    }
  }

  if (candidates.length === 0) {
    return [];
  }

  const sampled: Vec2Like[] = [];
  const step = Math.max(1, Math.floor(candidates.length / targetCount));
  for (let i = 0; i < candidates.length && sampled.length < targetCount; i += step) {
    sampled.push(candidates[i]);
  }

  return normalizePoints(sampled);
}

export function sampleEquidistantPoints(polylines: Polyline[], targetCount: number): Vec2Like[] {
  const segments: Array<{ start: Vec2; end: Vec2; length: number }> = [];
  let totalLength = 0;

  for (const polyline of polylines) {
    for (let i = 0; i < polyline.length - 1; i++) {
      const start = polyline[i];
      const end = polyline[i + 1];
      const length = start.dist(end);
      if (length > 0) {
        segments.push({ start, end, length });
        totalLength += length;
      }
    }
  }

  if (segments.length === 0 || targetCount <= 0) {
    return [];
  }

  const sampled: Vec2Like[] = [];
  const step = totalLength / Math.max(1, targetCount - 1);
  let segmentIndex = 0;
  let consumed = 0;

  for (let i = 0; i < targetCount; i++) {
    const targetDistance = i * step;

    while (segmentIndex < segments.length - 1 && consumed + segments[segmentIndex].length < targetDistance) {
      consumed += segments[segmentIndex].length;
      segmentIndex++;
    }

    const segment = segments[segmentIndex];
    const t = segment.length > 0 ? (targetDistance - consumed) / segment.length : 0;
    sampled.push(segment.start.lerp(segment.end, Math.max(0, Math.min(1, t))));
  }

  return sampled;
}

function pathCommandsToPolylines(commands: PathCommand[]): Polyline[] {
  const polylines: Polyline[] = [];
  let current: Polyline = [];
  let cursor = new Vec2(0, 0);
  let start = new Vec2(0, 0);

  for (const command of commands) {
    if (command.type === "M") {
      if (current.length > 1) polylines.push(current);
      cursor = new Vec2(command.x, command.y);
      start = cursor;
      current = [cursor];
    } else if (command.type === "L") {
      cursor = new Vec2(command.x, command.y);
      current.push(cursor);
    } else if (command.type === "Q") {
      const end = new Vec2(command.x, command.y);
      for (let i = 1; i <= FLATTEN_STEPS; i++) {
        current.push(quadraticPoint(cursor, new Vec2(command.x1, command.y1), end, i / FLATTEN_STEPS));
      }
      cursor = end;
    } else if (command.type === "C") {
      const end = new Vec2(command.x, command.y);
      for (let i = 1; i <= FLATTEN_STEPS; i++) {
        current.push(cubicPoint(cursor, new Vec2(command.x1, command.y1), new Vec2(command.x2, command.y2), end, i / FLATTEN_STEPS));
      }
      cursor = end;
    } else if (command.type === "Z") {
      current.push(start);
      if (current.length > 1) polylines.push(current);
      current = [];
    }
  }

  if (current.length > 1) {
    polylines.push(current);
  }

  return polylines;
}

function pathDataToPolylines(pathData: string): Polyline[] {
  const tokens = pathData.match(/[a-zA-Z]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/g) ?? [];
  const polylines: Polyline[] = [];
  let index = 0;
  let command = "";
  let current: Polyline = [];
  let cursor = new Vec2(0, 0);
  let start = new Vec2(0, 0);

  const read = () => Number(tokens[index++]);
  const isCommand = (token: string | undefined) => !!token && /^[a-zA-Z]$/.test(token);

  while (index < tokens.length) {
    if (isCommand(tokens[index])) {
      command = tokens[index++];
    }

    const relative = command === command.toLowerCase();
    const type = command.toUpperCase();

    if (type === "M") {
      const point = toPoint(read(), read(), relative, cursor);
      if (current.length > 1) polylines.push(current);
      cursor = point;
      start = point;
      current = [point];
      command = relative ? "l" : "L";
    } else if (type === "L") {
      cursor = toPoint(read(), read(), relative, cursor);
      current.push(cursor);
    } else if (type === "H") {
      const x = read();
      cursor = new Vec2(relative ? cursor.x + x : x, cursor.y);
      current.push(cursor);
    } else if (type === "V") {
      const y = read();
      cursor = new Vec2(cursor.x, relative ? cursor.y + y : y);
      current.push(cursor);
    } else if (type === "Q") {
      const control = toPoint(read(), read(), relative, cursor);
      const end = toPoint(read(), read(), relative, cursor);
      for (let i = 1; i <= FLATTEN_STEPS; i++) current.push(quadraticPoint(cursor, control, end, i / FLATTEN_STEPS));
      cursor = end;
    } else if (type === "C") {
      const c1 = toPoint(read(), read(), relative, cursor);
      const c2 = toPoint(read(), read(), relative, cursor);
      const end = toPoint(read(), read(), relative, cursor);
      for (let i = 1; i <= FLATTEN_STEPS; i++) current.push(cubicPoint(cursor, c1, c2, end, i / FLATTEN_STEPS));
      cursor = end;
    } else if (type === "Z") {
      current.push(start);
      if (current.length > 1) polylines.push(current);
      current = [];
    } else {
      break;
    }
  }

  if (current.length > 1) {
    polylines.push(current);
  }

  return polylines;
}

function quadraticPoint(p0: Vec2, p1: Vec2, p2: Vec2, t: number): Vec2 {
  const u = 1 - t;
  return p0.scale(u * u).add(p1.scale(2 * u * t)).add(p2.scale(t * t));
}

function cubicPoint(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number): Vec2 {
  const u = 1 - t;
  return p0.scale(u * u * u).add(p1.scale(3 * u * u * t)).add(p2.scale(3 * u * t * t)).add(p3.scale(t * t * t));
}

function toPoint(x: number, y: number, relative: boolean, cursor: Vec2): Vec2 {
  return relative ? new Vec2(cursor.x + x, cursor.y + y) : new Vec2(x, y);
}

function flattenNodes(node: SvgNode): SvgNode[] {
  return [node, ...(node.children ?? []).flatMap((child) => flattenNodes(child))];
}

function rectToPolyline(attributes: Record<string, string>): Polyline {
  const x = Number(attributes.x ?? 0);
  const y = Number(attributes.y ?? 0);
  const width = Number(attributes.width ?? 0);
  const height = Number(attributes.height ?? 0);
  return [new Vec2(x, y), new Vec2(x + width, y), new Vec2(x + width, y + height), new Vec2(x, y + height), new Vec2(x, y)];
}

function ellipseToPolyline(attributes: Record<string, string>, circle: boolean): Polyline {
  const cx = Number(attributes.cx ?? 0);
  const cy = Number(attributes.cy ?? 0);
  const rx = circle ? Number(attributes.r ?? 0) : Number(attributes.rx ?? 0);
  const ry = circle ? rx : Number(attributes.ry ?? 0);
  const points: Polyline = [];

  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    points.push(new Vec2(cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry));
  }

  return points;
}

function pointsAttributeToPolyline(value: string, closed: boolean): Polyline {
  const numbers = value
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter(Number.isFinite);
  const points: Polyline = [];

  for (let i = 0; i < numbers.length - 1; i += 2) {
    points.push(new Vec2(numbers[i], numbers[i + 1]));
  }

  if (closed && points.length > 0) {
    points.push(points[0]);
  }

  return points;
}
