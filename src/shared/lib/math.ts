import type { Vec2Like } from "@/shared/types/app";

export class Vec2 {
  public x: number;
  public y: number;

  public constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  public clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  public add(other: Vec2Like): Vec2 {
    return new Vec2(this.x + other.x, this.y + other.y);
  }

  public sub(other: Vec2Like): Vec2 {
    return new Vec2(this.x - other.x, this.y - other.y);
  }

  public scale(value: number): Vec2 {
    return new Vec2(this.x * value, this.y * value);
  }

  public mag(): number {
    return Math.hypot(this.x, this.y);
  }

  public normalize(): Vec2 {
    const magnitude = this.mag();
    if (magnitude === 0 || !Number.isFinite(magnitude)) {
      return new Vec2(0, 0);
    }
    return this.scale(1 / magnitude);
  }

  public limit(max: number): Vec2 {
    const magnitude = this.mag();
    if (magnitude > max && magnitude > 0) {
      return this.normalize().scale(max);
    }
    return this;
  }

  public dist(other: Vec2Like): number {
    return Math.hypot(this.x - other.x, this.y - other.y);
  }

  public lerp(other: Vec2Like, t: number): Vec2 {
    return new Vec2(this.x + (other.x - this.x) * t, this.y + (other.y - this.y) * t);
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function normalizedToCanvas(points: Vec2Like[], width: number, height: number): Vec2[] {
  const scaleX = width * 0.8;
  const scaleY = height * 0.8;
  const offsetX = width * 0.1;
  const offsetY = height * 0.1;

  return points.map((point) => new Vec2(point.x * scaleX + offsetX, point.y * scaleY + offsetY));
}
