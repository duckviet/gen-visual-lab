import { hexToRgba } from "@/shared/lib/color";
import { normalizedToCanvas, randomRange, Vec2 } from "@/shared/lib/math";
import { curlNoise2D } from "@/shared/lib/noise";
import type { AppState, GenerativeEngine } from "@/shared/types/app";

type Particle = {
  pos: Vec2;
  prev: Vec2;
  vel: Vec2;
};

export class FlowEngine implements GenerativeEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private getState: (() => AppState) | null = null;
  private particles: Particle[] = [];
  private cachedCount = 0;
  private cachedWidth = 0;
  private cachedHeight = 0;
  private cachedResetToken = -1;
  private cachedCellSize = 0;
  private field: Vec2[] = [];
  private fieldCols = 0;
  private fieldRows = 0;
  private time = 0;

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
    this.ensureParticles(state);

    const width = this.canvas.width;
    const height = this.canvas.height;
    const targets = normalizedToCanvas(state.targetPoints, width, height);
    const fadeAlpha = 1 - state.flow.trailLength;
    const isShapeRenderer = state.flow.renderer === "capsule" || state.flow.renderer === "blob";

    this.ctx.fillStyle = hexToRgba(state.palette.background, isShapeRenderer ? 1 : fadeAlpha);
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.strokeStyle = state.palette.foreground;
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = state.flow.alpha;

    if (state.isPlaying) {
      this.time += 0.01 * state.flow.speed;
      this.rebuildField(state);

      for (const particle of this.particles) {
        particle.prev = particle.pos.clone();
        const flowForce = this.sampleField(particle.pos, state.flow.cellSize).scale(state.flow.turbulence);
        const centerForce = state.flow.centerAttractor ? new Vec2(width * 0.5, height * 0.5).sub(particle.pos).normalize().scale(0.55) : new Vec2(0, 0);
        const targetForce = this.computeTargetForce(particle.pos, targets).scale(0.8).add(centerForce);
        particle.vel = particle.vel.add(flowForce).add(targetForce).limit(state.flow.speed);
        particle.pos = particle.pos.add(particle.vel);

        if (particle.pos.x < 0) particle.pos.x = width;
        if (particle.pos.y < 0) particle.pos.y = height;
        if (particle.pos.x > width) particle.pos.x = 0;
        if (particle.pos.y > height) particle.pos.y = 0;
      }
    }

    this.renderParticles(state, width, height);

    this.ctx.globalAlpha = 1;
    this.renderTargetPreview(state);
  }

  public destroy(): void {
    this.canvas = null;
    this.ctx = null;
    this.getState = null;
    this.particles = [];
  }

  private ensureCanvasSize(state: AppState): void {
    if (!this.canvas) return;
    if (this.canvas.width !== state.canvas.width || this.canvas.height !== state.canvas.height) {
      this.canvas.width = state.canvas.width;
      this.canvas.height = state.canvas.height;
    }
  }

  private ensureParticles(state: AppState): void {
    const width = this.canvas?.width ?? 0;
    const height = this.canvas?.height ?? 0;
    if (
      state.flow.particleCount !== this.cachedCount ||
      width !== this.cachedWidth ||
      height !== this.cachedHeight ||
      state.resetToken !== this.cachedResetToken
    ) {
      this.rebuild();
    }
  }

  private rebuild(): void {
    if (!this.canvas || !this.getState) return;
    const state = this.getState();
    const width = this.canvas.width || state.canvas.width;
    const height = this.canvas.height || state.canvas.height;
    const targets = normalizedToCanvas(state.targetPoints, width, height);

    this.particles = Array.from({ length: state.flow.particleCount }, () => {
      const target = targets.length > 0 ? targets[Math.floor(Math.random() * targets.length)] : new Vec2(randomRange(0, width), randomRange(0, height));
      const pos = target.add(new Vec2(randomRange(-24, 24), randomRange(-24, 24)));
      return {
        pos,
        prev: pos.clone(),
        vel: new Vec2(randomRange(-1, 1), randomRange(-1, 1)),
      };
    });

    this.cachedCount = state.flow.particleCount;
    this.cachedWidth = width;
    this.cachedHeight = height;
    this.cachedResetToken = state.resetToken;
    this.cachedCellSize = 0;
  }

  private renderParticles(state: AppState, width: number, height: number): void {
    if (!this.ctx) return;

    for (const particle of this.particles) {
      const wrapped = Math.abs(particle.pos.x - particle.prev.x) > width * 0.5 || Math.abs(particle.pos.y - particle.prev.y) > height * 0.5;
      if (wrapped) continue;

      const color = this.resolveParticleColor(state, particle, width, height);
      if (state.flow.renderer === "capsule") {
        this.ctx.save();
        this.ctx.translate(particle.pos.x, particle.pos.y);
        this.ctx.rotate(Math.atan2(particle.vel.y, particle.vel.x));
        this.ctx.fillStyle = color;
        this.drawCapsule(state.flow.capsuleLength, state.flow.capsuleWidth);
        this.ctx.restore();
      } else if (state.flow.renderer === "blob") {
        this.ctx.fillStyle = color;
        for (let i = 0; i < state.flow.blobComplexity; i++) {
          const angle = (i / Math.max(1, state.flow.blobComplexity)) * Math.PI * 2 + particle.pos.x * 0.01;
          const radius = state.flow.blobRadius * (0.7 + (i % 2) * 0.2);
          this.ctx.beginPath();
          this.ctx.ellipse(
            particle.pos.x + Math.cos(angle) * radius * 0.35,
            particle.pos.y + Math.sin(angle) * radius * 0.35,
            radius,
            radius * 0.72,
            angle,
            0,
            Math.PI * 2,
          );
          this.ctx.fill();
        }
      } else {
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(particle.prev.x, particle.prev.y);
        this.ctx.lineTo(particle.pos.x, particle.pos.y);
        this.ctx.stroke();
      }
    }
  }

  private drawCapsule(length: number, width: number): void {
    if (!this.ctx) return;
    const radius = width * 0.5;
    this.ctx.beginPath();
    this.ctx.roundRect(-length * 0.5, -width * 0.5, length, width, radius);
    this.ctx.fill();
  }

  private resolveParticleColor(state: AppState, particle: Particle, width: number, height: number): string {
    if (state.flow.colorMode === "palette-by-angle") {
      const angle = Math.atan2(particle.vel.y, particle.vel.x);
      const index = Math.floor((((angle + Math.PI) / (Math.PI * 2)) * state.palette.colors.length) % state.palette.colors.length);
      return state.palette.colors[index] ?? state.palette.foreground;
    }

    if (state.flow.colorMode === "palette-by-position") {
      const index = Math.floor(((particle.pos.x / width + particle.pos.y / height) * 0.5) * state.palette.colors.length) % state.palette.colors.length;
      return state.palette.colors[index] ?? state.palette.foreground;
    }

    return state.palette.foreground;
  }

  private rebuildField(state: AppState): void {
    if (!this.canvas) return;

    const cellSize = state.flow.cellSize;
    const cols = Math.ceil(this.canvas.width / cellSize);
    const rows = Math.ceil(this.canvas.height / cellSize);

    if (cellSize !== this.cachedCellSize || cols !== this.fieldCols || rows !== this.fieldRows) {
      this.field = Array.from({ length: cols * rows }, () => new Vec2(0, 0));
      this.fieldCols = cols;
      this.fieldRows = rows;
      this.cachedCellSize = cellSize;
    }

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * cellSize * state.flow.noiseScale;
        const y = row * cellSize * state.flow.noiseScale;
        const flow = curlNoise2D(x, y, this.time);
        this.field[col + row * cols] = new Vec2(flow.x, flow.y).normalize();
      }
    }
  }

  private sampleField(pos: Vec2, cellSize: number): Vec2 {
    if (this.field.length === 0) return new Vec2(0, 0);
    const col = Math.max(0, Math.min(this.fieldCols - 1, Math.floor(pos.x / cellSize)));
    const row = Math.max(0, Math.min(this.fieldRows - 1, Math.floor(pos.y / cellSize)));
    return this.field[col + row * this.fieldCols] ?? new Vec2(0, 0);
  }

  private computeTargetForce(pos: Vec2, targets: Vec2[]): Vec2 {
    if (targets.length === 0) {
      return new Vec2(0, 0);
    }

    let closest = targets[0];
    let minDistance = pos.dist(closest);
    for (let i = 1; i < targets.length; i++) {
      const distance = pos.dist(targets[i]);
      if (distance < minDistance) {
        minDistance = distance;
        closest = targets[i];
      }
    }

    return closest.sub(pos).normalize();
  }

  private renderTargetPreview(state: AppState): void {
    if (!this.canvas || !this.ctx || !state.text.showOutline || state.targetPoints.length === 0) {
      return;
    }

    const targets = normalizedToCanvas(state.targetPoints, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.globalAlpha = 0.22;
    this.ctx.fillStyle = state.palette.colors[2];
    for (let i = 0; i < targets.length; i += Math.max(1, Math.floor(targets.length / 600))) {
      this.ctx.beginPath();
      this.ctx.arc(targets[i].x, targets[i].y, 1.1, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }
}
