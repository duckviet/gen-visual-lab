import { hexToRgba } from "@/shared/lib/color";
import { clamp, normalizedToCanvas, randomRange, Vec2 } from "@/shared/lib/math";
import type { AppState, GenerativeEngine } from "@/shared/types/app";

type Particle = {
  pos: Vec2;
  vel: Vec2;
};

type Dot = {
  pos: Vec2;
  baseOpacity: number;
};

export class DotsEngine implements GenerativeEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private getState: (() => AppState) | null = null;
  private particles: Particle[] = [];
  private dots: Dot[] = [];
  private cachedCount = 0;
  private cachedSpacing = 0;
  private cachedWidth = 0;
  private cachedHeight = 0;
  private cachedResetToken = -1;

  public init(canvas: HTMLCanvasElement, getState: () => AppState): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.getState = getState;
    this.rebuild();
  }

  public update(): void {
    if (!this.canvas || !this.ctx || !this.getState) {
      return;
    }

    const state = this.getState();
    this.ensureCanvasSize(state);
    this.ensureEntities(state);

    const width = this.canvas.width;
    const height = this.canvas.height;
    const targets = normalizedToCanvas(state.targetPoints, width, height);

    this.ctx.fillStyle = hexToRgba(state.palette.background, 0.35);
    this.ctx.fillRect(0, 0, width, height);

    if (state.isPlaying) {
      for (const particle of this.particles) {
        const targetForce = this.computeTargetForce(particle, targets, state.boids.speed);
        particle.vel = particle.vel.add(targetForce.scale(state.boids.targetForce)).limit(state.boids.speed);
        particle.pos = particle.pos.add(particle.vel);
        if (particle.pos.x < 0) particle.pos.x = width;
        if (particle.pos.y < 0) particle.pos.y = height;
        if (particle.pos.x > width) particle.pos.x = 0;
        if (particle.pos.y > height) particle.pos.y = 0;
      }
    }

    this.render(state);
    this.renderTargetPreview(state);
  }

  public destroy(): void {
    this.canvas = null;
    this.ctx = null;
    this.getState = null;
    this.particles = [];
    this.dots = [];
  }

  private ensureCanvasSize(state: AppState): void {
    if (!this.canvas) {
      return;
    }

    if (this.canvas.width !== state.canvas.width || this.canvas.height !== state.canvas.height) {
      this.canvas.width = state.canvas.width;
      this.canvas.height = state.canvas.height;
    }
  }

  private ensureEntities(state: AppState): void {
    const width = this.canvas?.width ?? 0;
    const height = this.canvas?.height ?? 0;

    if (
      state.boids.count !== this.cachedCount ||
      state.dots.spacing !== this.cachedSpacing ||
      width !== this.cachedWidth ||
      height !== this.cachedHeight ||
      state.resetToken !== this.cachedResetToken
    ) {
      this.rebuild();
    }
  }

  private rebuild(): void {
    if (!this.canvas || !this.getState) {
      return;
    }

    const state = this.getState();
    const width = this.canvas.width || state.canvas.width;
    const height = this.canvas.height || state.canvas.height;

    this.particles = Array.from({ length: state.boids.count }, () => ({
      pos: new Vec2(randomRange(0, width), randomRange(0, height)),
      vel: new Vec2(randomRange(-1, 1), randomRange(-1, 1)).normalize().scale(state.boids.speed),
    }));

    this.dots = [];
    for (let y = state.dots.spacing; y < height; y += state.dots.spacing) {
      for (let x = state.dots.spacing; x < width; x += state.dots.spacing) {
        this.dots.push({ pos: new Vec2(x, y), baseOpacity: 0.08 });
      }
    }

    this.cachedCount = state.boids.count;
    this.cachedSpacing = state.dots.spacing;
    this.cachedWidth = width;
    this.cachedHeight = height;
    this.cachedResetToken = state.resetToken;
  }

  private computeTargetForce(particle: Particle, targetPoints: Vec2[], maxSpeed: number): Vec2 {
    if (targetPoints.length === 0) {
      return new Vec2(0, 0);
    }

    let closest = targetPoints[0];
    let minDistance = particle.pos.dist(closest);
    for (let i = 1; i < targetPoints.length; i++) {
      const distance = particle.pos.dist(targetPoints[i]);
      if (distance < minDistance) {
        minDistance = distance;
        closest = targetPoints[i];
      }
    }

    return closest.sub(particle.pos).normalize().scale(maxSpeed).sub(particle.vel).limit(0.08);
  }

  private render(state: AppState): void {
    if (!this.ctx) {
      return;
    }

    const radius = state.dots.influenceRadius;
    this.ctx.fillStyle = state.palette.foreground;

    for (const dot of this.dots) {
      let influence = 0;
      for (const particle of this.particles) {
        const distance = dot.pos.dist(particle.pos);
        if (distance < radius) {
          influence += 1 - distance / radius;
        }
      }

      const opacity = clamp(dot.baseOpacity + influence * 0.08 * state.dots.strength, 0, 1);
      const size = 1.4 + opacity * 3.2;
      this.ctx.globalAlpha = opacity;
      this.ctx.beginPath();
      this.ctx.arc(dot.pos.x, dot.pos.y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;
  }

  private renderTargetPreview(state: AppState): void {
    if (!this.canvas || !this.ctx || !state.text.showOutline || state.targetPoints.length === 0) {
      return;
    }

    const targets = normalizedToCanvas(state.targetPoints, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.globalAlpha = 0.25;
    this.ctx.fillStyle = state.palette.colors[2];
    for (let i = 0; i < targets.length; i += Math.max(1, Math.floor(targets.length / 600))) {
      this.ctx.beginPath();
      this.ctx.arc(targets[i].x, targets[i].y, 1.2, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }
}
