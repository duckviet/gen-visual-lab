import { hexToRgba } from "@/shared/lib/color";
import { clamp, normalizedToCanvas, randomRange, Vec2 } from "@/shared/lib/math";
import type { AppState, GenerativeEngine } from "@/shared/types/app";

type Boid = {
  pos: Vec2;
  vel: Vec2;
  acc: Vec2;
};

const MAX_FORCE = 0.12;
const GRID_THRESHOLD = 500;

class SpatialGrid {
  private cells = new Map<number, Boid[]>();
  private cols: number;
  private rows: number;
  private cellSize: number;

  public constructor(width: number, height: number, cellSize: number) {
    this.cellSize = Math.max(1, cellSize);
    this.cols = Math.ceil(width / this.cellSize);
    this.rows = Math.ceil(height / this.cellSize);
  }

  public rebuild(boids: Boid[]): void {
    this.cells.clear();

    for (const boid of boids) {
      const index = this.getCellIndex(boid.pos);
      const bucket = this.cells.get(index);
      if (bucket) {
        bucket.push(boid);
      } else {
        this.cells.set(index, [boid]);
      }
    }
  }

  public getNeighbors(boid: Boid): Boid[] {
    const neighbors: Boid[] = [];
    const col = Math.floor(boid.pos.x / this.cellSize);
    const row = Math.floor(boid.pos.y / this.cellSize);

    for (let dRow = -1; dRow <= 1; dRow++) {
      for (let dCol = -1; dCol <= 1; dCol++) {
        const c = col + dCol;
        const r = row + dRow;

        if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
          const bucket = this.cells.get(c + r * this.cols);
          if (bucket) {
            for (const other of bucket) {
              if (other !== boid) {
                neighbors.push(other);
              }
            }
          }
        }
      }
    }

    return neighbors;
  }

  private getCellIndex(pos: Vec2): number {
    const col = clamp(Math.floor(pos.x / this.cellSize), 0, this.cols - 1);
    const row = clamp(Math.floor(pos.y / this.cellSize), 0, this.rows - 1);
    return col + row * this.cols;
  }
}

export class BoidsEngine implements GenerativeEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private getState: (() => AppState) | null = null;
  private boids: Boid[] = [];
  private cachedCount = 0;
  private cachedWidth = 0;
  private cachedHeight = 0;
  private cachedResetToken = -1;

  public init(canvas: HTMLCanvasElement, getState: () => AppState): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.getState = getState;
    this.rebuildBoids();
  }

  public update(): void {
    if (!this.canvas || !this.ctx || !this.getState) {
      return;
    }

    const state = this.getState();
    this.ensureCanvasSize(state);
    this.ensureBoids(state);

    const width = this.canvas.width;
    const height = this.canvas.height;
    const settings = state.boids;
    const targets = normalizedToCanvas(state.targetPoints, width, height);

    this.ctx.fillStyle = hexToRgba(state.palette.background, settings.trail);
    this.ctx.fillRect(0, 0, width, height);

    if (!state.isPlaying) {
      this.render(state);
      return;
    }

    const grid =
      this.boids.length > GRID_THRESHOLD ? new SpatialGrid(width, height, settings.viewDistance) : null;
    grid?.rebuild(this.boids);

    for (const boid of this.boids) {
      const neighbors = grid ? grid.getNeighbors(boid) : this.findDirectNeighbors(boid, settings.viewDistance);
      const separation = this.computeSeparation(boid, neighbors, settings.viewDistance, settings.speed);
      const alignment = this.computeAlignment(boid, neighbors, settings.speed);
      const cohesion = this.computeCohesion(boid, neighbors, settings.speed);
      const target = this.computeTargetAttraction(boid, targets, settings.speed);

      boid.acc = separation
        .scale(settings.separation)
        .add(alignment.scale(settings.alignment))
        .add(cohesion.scale(settings.cohesion))
        .add(target.scale(settings.targetForce))
        .limit(MAX_FORCE * 8);

      boid.vel = boid.vel.add(boid.acc).limit(settings.speed);
      boid.pos = boid.pos.add(boid.vel);
      this.applyBounds(boid, width, height, settings.wrap);
    }

    this.render(state);
    this.renderTargetPreview(state);
  }

  public destroy(): void {
    this.canvas = null;
    this.ctx = null;
    this.getState = null;
    this.boids = [];
  }

  private ensureCanvasSize(state: AppState): void {
    if (!this.canvas) {
      return;
    }

    const width = state.canvas.width;
    const height = state.canvas.height;

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  private ensureBoids(state: AppState): void {
    const width = this.canvas?.width ?? 0;
    const height = this.canvas?.height ?? 0;

    if (
      state.boids.count !== this.cachedCount ||
      width !== this.cachedWidth ||
      height !== this.cachedHeight ||
      state.resetToken !== this.cachedResetToken
    ) {
      this.rebuildBoids();
    }
  }

  private rebuildBoids(): void {
    if (!this.canvas || !this.getState) {
      return;
    }

    const state = this.getState();
    const width = this.canvas.width || state.canvas.width;
    const height = this.canvas.height || state.canvas.height;

    this.boids = Array.from({ length: state.boids.count }, () => ({
      pos: new Vec2(randomRange(0, width), randomRange(0, height)),
      vel: new Vec2(randomRange(-1, 1), randomRange(-1, 1)).normalize().scale(state.boids.speed),
      acc: new Vec2(0, 0),
    }));

    this.cachedCount = state.boids.count;
    this.cachedWidth = width;
    this.cachedHeight = height;
    this.cachedResetToken = state.resetToken;
  }

  private findDirectNeighbors(boid: Boid, viewDistance: number): Boid[] {
    return this.boids.filter((other) => other !== boid && boid.pos.dist(other.pos) < viewDistance);
  }

  private computeSeparation(boid: Boid, neighbors: Boid[], viewDistance: number, maxSpeed: number): Vec2 {
    let steer = new Vec2(0, 0);
    let count = 0;
    const personalSpace = viewDistance * 0.4;

    for (const other of neighbors) {
      const distance = boid.pos.dist(other.pos);
      if (distance > 0 && distance < personalSpace) {
        steer = steer.add(boid.pos.sub(other.pos).normalize().scale(1 / distance));
        count++;
      }
    }

    if (count > 0) {
      steer = steer.scale(1 / count);
    }

    if (steer.mag() > 0) {
      return steer.normalize().scale(maxSpeed).sub(boid.vel).limit(MAX_FORCE);
    }

    return new Vec2(0, 0);
  }

  private computeAlignment(boid: Boid, neighbors: Boid[], maxSpeed: number): Vec2 {
    if (neighbors.length === 0) {
      return new Vec2(0, 0);
    }

    const sum = neighbors.reduce((acc, other) => acc.add(other.vel), new Vec2(0, 0));
    return sum.scale(1 / neighbors.length).normalize().scale(maxSpeed).sub(boid.vel).limit(MAX_FORCE);
  }

  private computeCohesion(boid: Boid, neighbors: Boid[], maxSpeed: number): Vec2 {
    if (neighbors.length === 0) {
      return new Vec2(0, 0);
    }

    const sum = neighbors.reduce((acc, other) => acc.add(other.pos), new Vec2(0, 0));
    const desired = sum.scale(1 / neighbors.length).sub(boid.pos).normalize().scale(maxSpeed);
    return desired.sub(boid.vel).limit(MAX_FORCE);
  }

  private computeTargetAttraction(boid: Boid, targetPoints: Vec2[], maxSpeed: number): Vec2 {
    if (targetPoints.length === 0) {
      return new Vec2(0, 0);
    }

    let closest = targetPoints[0];
    let minDistance = boid.pos.dist(closest);

    for (let i = 1; i < targetPoints.length; i++) {
      const distance = boid.pos.dist(targetPoints[i]);
      if (distance < minDistance) {
        minDistance = distance;
        closest = targetPoints[i];
      }
    }

    const desired = closest.sub(boid.pos).normalize().scale(maxSpeed);
    return desired.sub(boid.vel).limit(MAX_FORCE);
  }

  private applyBounds(boid: Boid, width: number, height: number, wrap: boolean): void {
    if (wrap) {
      if (boid.pos.x < 0) boid.pos.x = width;
      if (boid.pos.y < 0) boid.pos.y = height;
      if (boid.pos.x > width) boid.pos.x = 0;
      if (boid.pos.y > height) boid.pos.y = 0;
      return;
    }

    if (boid.pos.x < 0) {
      boid.pos.x = 0;
      boid.vel.x *= -1;
    }
    if (boid.pos.y < 0) {
      boid.pos.y = 0;
      boid.vel.y *= -1;
    }
    if (boid.pos.x > width) {
      boid.pos.x = width;
      boid.vel.x *= -1;
    }
    if (boid.pos.y > height) {
      boid.pos.y = height;
      boid.vel.y *= -1;
    }
  }

  private render(state: AppState): void {
    if (!this.ctx) {
      return;
    }

    this.ctx.fillStyle = state.palette.foreground;

    for (const boid of this.boids) {
      this.ctx.beginPath();
      this.ctx.arc(boid.pos.x, boid.pos.y, 1.8, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private renderTargetPreview(state: AppState): void {
    if (!this.canvas || !this.ctx || !state.text.showOutline || state.targetPoints.length === 0) {
      return;
    }

    const targets = normalizedToCanvas(state.targetPoints, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.globalAlpha = 0.28;
    this.ctx.fillStyle = state.palette.colors[2];
    for (let i = 0; i < targets.length; i += Math.max(1, Math.floor(targets.length / 600))) {
      this.ctx.beginPath();
      this.ctx.arc(targets[i].x, targets[i].y, 1.2, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }
}
