import { hexToRgba } from "@/shared/lib/color";
import { normalizedToCanvas, randomRange, Vec2 } from "@/shared/lib/math";
import type { AppState, GenerativeEngine } from "@/shared/types/app";

type Node = {
  pos: Vec2;
  parent?: Vec2;
};

export class GrowthEngine implements GenerativeEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private getState: (() => AppState) | null = null;
  private nodes: Node[] = [];
  private attractors: Vec2[] = [];
  private cachedResetToken = -1;
  private cachedAttractorCount = 0;
  private cachedWidth = 0;
  private cachedHeight = 0;

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
    this.ensureGrowth(state);

    if (state.isPlaying && this.nodes.length < state.growth.maxBranches && this.attractors.length > 0) {
      for (let i = 0; i < 12 && this.nodes.length < state.growth.maxBranches; i++) {
        this.growOneStep(state);
      }
    }

    this.render(state);
  }

  public destroy(): void {
    this.canvas = null;
    this.ctx = null;
    this.getState = null;
    this.nodes = [];
    this.attractors = [];
  }

  private ensureCanvasSize(state: AppState): void {
    if (!this.canvas) return;
    if (this.canvas.width !== state.canvas.width || this.canvas.height !== state.canvas.height) {
      this.canvas.width = state.canvas.width;
      this.canvas.height = state.canvas.height;
    }
  }

  private ensureGrowth(state: AppState): void {
    const width = this.canvas?.width ?? 0;
    const height = this.canvas?.height ?? 0;
    if (
      state.resetToken !== this.cachedResetToken ||
      state.growth.attractorCount !== this.cachedAttractorCount ||
      width !== this.cachedWidth ||
      height !== this.cachedHeight
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
    const source = targets.length > 0 ? targets : [new Vec2(width * 0.5, height * 0.5)];
    const count = Math.min(state.growth.attractorCount, source.length);

    this.attractors = [];
    for (let i = 0; i < count; i++) {
      this.attractors.push(source[Math.floor((i / Math.max(1, count - 1)) * (source.length - 1))]);
    }

    this.nodes = [
      {
        pos: new Vec2(width * 0.5 + randomRange(-12, 12), height * 0.5 + randomRange(-12, 12)),
      },
    ];

    this.cachedResetToken = state.resetToken;
    this.cachedAttractorCount = state.growth.attractorCount;
    this.cachedWidth = width;
    this.cachedHeight = height;
  }

  private growOneStep(state: AppState): void {
    if (this.attractors.length === 0 || this.nodes.length === 0) {
      return;
    }

    const tip = this.nodes[Math.floor(Math.random() * this.nodes.length)];
    let closestIndex = 0;
    let closestDistance = tip.pos.dist(this.attractors[0]);

    for (let i = 1; i < this.attractors.length; i++) {
      const distance = tip.pos.dist(this.attractors[i]);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }

    const target = this.attractors[closestIndex];
    const direction = target.sub(tip.pos).normalize();
    const jitterAngle = ((Math.random() - 0.5) * state.growth.branchAngle * Math.PI) / 180;
    const rotated = new Vec2(
      direction.x * Math.cos(jitterAngle) - direction.y * Math.sin(jitterAngle),
      direction.x * Math.sin(jitterAngle) + direction.y * Math.cos(jitterAngle),
    );
    const next = tip.pos.add(rotated.scale(state.growth.stepSize));

    this.nodes.push({ pos: next, parent: tip.pos });

    if (closestDistance <= state.growth.stepSize * 2) {
      this.attractors.splice(closestIndex, 1);
    }
  }

  private render(state: AppState): void {
    if (!this.canvas || !this.ctx) return;

    this.ctx.fillStyle = hexToRgba(state.palette.background, 0.2);
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.strokeStyle = state.palette.foreground;
    this.ctx.lineWidth = 1.2;
    this.ctx.globalAlpha = 0.82;

    for (const node of this.nodes) {
      if (node.parent) {
        this.ctx.beginPath();
        this.ctx.moveTo(node.parent.x, node.parent.y);
        this.ctx.lineTo(node.pos.x, node.pos.y);
        this.ctx.stroke();
      }
    }

    this.ctx.globalAlpha = 1;
    this.renderTargetPreview(state);
  }

  private renderTargetPreview(state: AppState): void {
    if (!this.canvas || !this.ctx || !state.text.showOutline || state.targetPoints.length === 0) {
      return;
    }

    const targets = normalizedToCanvas(state.targetPoints, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.globalAlpha = 0.18;
    this.ctx.fillStyle = state.palette.colors[2];
    for (let i = 0; i < targets.length; i += Math.max(1, Math.floor(targets.length / 600))) {
      this.ctx.beginPath();
      this.ctx.arc(targets[i].x, targets[i].y, 1.1, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }
}
