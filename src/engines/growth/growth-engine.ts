import { hexToRgba } from "@/shared/lib/color";
import { clamp, normalizedToCanvas, Vec2 } from "@/shared/lib/math";
import type { AppState, GenerativeEngine } from "@/shared/types/app";

type Node = {
  pos: Vec2;
  parentIndex?: number;
  depth: number;
  active: boolean;
  seed: number;
};

type Influence = {
  direction: Vec2;
  count: number;
};

const MAX_NEW_NODES_PER_FRAME = 24;

export class GrowthEngine implements GenerativeEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private getState: (() => AppState) | null = null;
  private nodes: Node[] = [];
  private attractors: Vec2[] = [];
  private randomSeed = 1;
  private cachedResetToken = -1;
  private cachedAttractorCount = 0;
  private cachedWidth = 0;
  private cachedHeight = 0;
  private cachedStyle = "";
  private cachedLayout = "";
  private cachedStepSize = 0;
  private cachedBranchAngle = 0;
  private cachedMaxBranches = 0;
  private cachedTargetSignature = "";

  public init(canvas: HTMLCanvasElement, getState: () => AppState): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.getState = getState;

    const state = getState();
    canvas.width = state.canvas.width;
    canvas.height = state.canvas.height;
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
      this.growBatch(state);
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
    const targetSignature = this.getTargetSignature(state);

    if (
      state.resetToken !== this.cachedResetToken ||
      state.growth.attractorCount !== this.cachedAttractorCount ||
      state.growth.style !== this.cachedStyle ||
      state.growth.layout !== this.cachedLayout ||
      state.growth.stepSize !== this.cachedStepSize ||
      state.growth.branchAngle !== this.cachedBranchAngle ||
      state.growth.maxBranches !== this.cachedMaxBranches ||
      targetSignature !== this.cachedTargetSignature ||
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
    const seed = state.resetToken * 1009 + state.growth.attractorCount * 31 + width + height * 3;
    this.randomSeed = Math.max(1, Math.floor(seed));

    const targets = normalizedToCanvas(state.targetPoints, width, height);
    const useOrnamentFrame = state.growth.layout === "ornament-frame";
    const source = useOrnamentFrame
      ? this.createOrnamentAttractors(width, height, state.growth.attractorCount)
      : this.createTargetAttractors(targets, width, height, state.growth.attractorCount);

    this.attractors = source;
    this.nodes = useOrnamentFrame ? this.createOrnamentRoots(width, height) : this.createTargetRoots(targets, width, height);

    this.cachedResetToken = state.resetToken;
    this.cachedAttractorCount = state.growth.attractorCount;
    this.cachedWidth = width;
    this.cachedHeight = height;
    this.cachedStyle = state.growth.style;
    this.cachedLayout = state.growth.layout;
    this.cachedStepSize = state.growth.stepSize;
    this.cachedBranchAngle = state.growth.branchAngle;
    this.cachedMaxBranches = state.growth.maxBranches;
    this.cachedTargetSignature = this.getTargetSignature(state);
  }

  private createTargetAttractors(targets: Vec2[], width: number, height: number, count: number): Vec2[] {
    if (targets.length === 0) {
      return this.createFallbackAttractors(width, height, count);
    }

    const attractors: Vec2[] = [];
    const stride = Math.max(1, Math.floor(targets.length / Math.max(1, count)));
    for (let i = 0; i < targets.length && attractors.length < count; i += stride) {
      attractors.push(targets[i]);
    }

    return attractors;
  }

  private createFallbackAttractors(width: number, height: number, count: number): Vec2[] {
    const attractors: Vec2[] = [];
    for (let i = 0; i < count; i++) {
      const t = i / Math.max(1, count - 1);
      const wave = Math.sin(t * Math.PI * 5.0 + this.nextRandom() * 0.8);
      const x = width * (0.18 + t * 0.64) + wave * width * 0.08;
      const y = height * (0.72 - t * 0.44) + Math.sin(t * Math.PI * 2.0) * height * 0.16;
      attractors.push(new Vec2(clamp(x, width * 0.12, width * 0.88), clamp(y, height * 0.16, height * 0.86)));
    }

    return attractors;
  }

  private createOrnamentAttractors(width: number, height: number, count: number): Vec2[] {
    const attractors: Vec2[] = [];
    const outer = {
      left: width * 0.16,
      right: width * 0.84,
      top: height * 0.16,
      bottom: height * 0.84,
    };
    const inner = {
      left: width * 0.36,
      right: width * 0.64,
      top: height * 0.34,
      bottom: height * 0.66,
    };

    for (let i = 0; i < count; i++) {
      const side = i % 8;
      const t = this.nextRandom();
      const jitterX = (this.nextRandom() - 0.5) * width * 0.08;
      const jitterY = (this.nextRandom() - 0.5) * height * 0.08;
      let x = outer.left;
      let y = outer.top;

      if (side === 0) {
        x = outer.left + t * width * 0.22;
        y = outer.top + this.nextRandom() * height * 0.18;
      } else if (side === 1) {
        x = outer.right - t * width * 0.22;
        y = outer.top + this.nextRandom() * height * 0.18;
      } else if (side === 2) {
        x = outer.left + t * width * 0.22;
        y = outer.bottom - this.nextRandom() * height * 0.18;
      } else if (side === 3) {
        x = outer.right - t * width * 0.22;
        y = outer.bottom - this.nextRandom() * height * 0.18;
      } else if (side === 4) {
        x = outer.left + this.nextRandom() * width * 0.12;
        y = outer.top + t * height * 0.68;
      } else if (side === 5) {
        x = outer.right - this.nextRandom() * width * 0.12;
        y = outer.top + t * height * 0.68;
      } else if (side === 6) {
        x = outer.left + t * width * 0.68;
        y = outer.top + this.nextRandom() * height * 0.10;
      } else {
        x = outer.left + t * width * 0.68;
        y = outer.bottom - this.nextRandom() * height * 0.10;
      }

      x = clamp(x + jitterX, outer.left, outer.right);
      y = clamp(y + jitterY, outer.top, outer.bottom);

      if (x > inner.left && x < inner.right && y > inner.top && y < inner.bottom) {
        x = x < width * 0.5 ? inner.left : inner.right;
      }

      attractors.push(new Vec2(x, y));
    }

    return attractors;
  }

  private createTargetRoots(targets: Vec2[], width: number, height: number): Node[] {
    const bounds = this.getBounds(targets, width, height);
    const roots = [
      new Vec2(bounds.left, bounds.bottom),
      new Vec2(bounds.right, bounds.bottom),
      new Vec2(bounds.left, bounds.top),
      new Vec2(bounds.right, bounds.top),
      new Vec2((bounds.left + bounds.right) * 0.5, bounds.bottom),
      new Vec2(bounds.left, (bounds.top + bounds.bottom) * 0.5),
      new Vec2(bounds.right, (bounds.top + bounds.bottom) * 0.5),
    ];

    return roots.map((pos) => this.createNode(this.nudgeRoot(pos, width, height), undefined, 0));
  }

  private createOrnamentRoots(width: number, height: number): Node[] {
    const roots = [
      new Vec2(width * 0.18, height * 0.18),
      new Vec2(width * 0.82, height * 0.18),
      new Vec2(width * 0.18, height * 0.82),
      new Vec2(width * 0.82, height * 0.82),
      new Vec2(width * 0.18, height * 0.5),
      new Vec2(width * 0.82, height * 0.5),
    ];

    return roots.map((pos) => this.createNode(pos, undefined, 0));
  }

  private growBatch(state: AppState): void {
    const stepSize = state.growth.stepSize;
    const attractionRadius = stepSize * 10;
    const killRadius = stepSize * 2.2;
    const influences = new Map<number, Influence>();
    const remainingAttractors: Vec2[] = [];
    const activeIndices = this.getActiveNodeIndices();

    for (const attractor of this.attractors) {
      const closest = this.findClosestActiveNode(attractor, attractionRadius, activeIndices);

      if (!closest) {
        remainingAttractors.push(attractor);
        continue;
      }

      if (closest.distance <= killRadius) {
        continue;
      }

      remainingAttractors.push(attractor);
      const direction = attractor.sub(this.nodes[closest.index].pos).normalize();
      const influence = influences.get(closest.index);
      if (influence) {
        influence.direction = influence.direction.add(direction);
        influence.count += 1;
      } else {
        influences.set(closest.index, { direction, count: 1 });
      }
    }

    this.attractors = remainingAttractors;

    if (influences.size === 0) {
      this.bridgeTowardAttractors(state);
      return;
    }

    let created = 0;
    for (const [nodeIndex, influence] of influences) {
      if (created >= MAX_NEW_NODES_PER_FRAME || this.nodes.length >= state.growth.maxBranches) {
        break;
      }

      created += this.growFromNode(state, nodeIndex, influence.direction.normalize(), false);

      if (
        created < MAX_NEW_NODES_PER_FRAME &&
        this.nodes.length < state.growth.maxBranches &&
        influence.count >= 6 &&
        this.hash(this.nodes[nodeIndex].seed + influence.count * 17) < 0.16
      ) {
        const side = this.hash(this.nodes[nodeIndex].seed + 91) > 0.5 ? 1 : -1;
        const angle = (state.growth.branchAngle * Math.PI * side) / 180;
        created += this.growFromNode(state, nodeIndex, this.rotate(influence.direction.normalize(), angle), true);
      }
    }
  }

  private bridgeTowardAttractors(state: AppState): void {
    let created = 0;
    const activeIndices = this.getActiveNodeIndices();

    for (const nodeIndex of activeIndices) {
      if (created >= MAX_NEW_NODES_PER_FRAME || this.nodes.length >= state.growth.maxBranches || this.attractors.length === 0) {
        break;
      }

      const nearest = this.findNearestAttractor(this.nodes[nodeIndex].pos);
      if (!nearest) {
        break;
      }

      created += this.growFromNode(state, nodeIndex, nearest.sub(this.nodes[nodeIndex].pos).normalize(), false);
    }
  }

  private growFromNode(state: AppState, nodeIndex: number, direction: Vec2, keepParentActive: boolean): number {
    const node = this.nodes[nodeIndex];
    const jitterRange = (state.growth.branchAngle * Math.PI) / 180;
    const jitter = (this.hash(node.seed + this.nodes.length * 13) - 0.5) * jitterRange * 0.38;
    const nextDirection = this.rotate(direction, jitter).normalize();
    const next = node.pos.add(nextDirection.scale(state.growth.stepSize));

    if (!Number.isFinite(next.x) || !Number.isFinite(next.y)) {
      return 0;
    }

    if (!keepParentActive) {
      node.active = false;
    }

    this.nodes.push(this.createNode(next, nodeIndex, node.depth + 1));
    return 1;
  }

  private render(state: AppState): void {
    if (!this.canvas || !this.ctx) return;

    this.ctx.save();
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = state.palette.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (state.growth.style === "botanical") {
      this.renderBotanical(state);
    } else {
      this.renderVein(state);
    }

    this.renderTargetPreview(state);
    this.ctx.restore();
  }

  private renderVein(state: AppState): void {
    if (!this.ctx) return;

    this.ctx.strokeStyle = state.palette.foreground;
    this.ctx.lineWidth = state.growth.lineWidth;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.globalAlpha = 0.84;

    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      if (node.parentIndex === undefined) continue;

      const parent = this.nodes[node.parentIndex];
      this.ctx.beginPath();
      this.ctx.moveTo(parent.pos.x, parent.pos.y);
      this.ctx.lineTo(node.pos.x, node.pos.y);
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1;
  }

  private renderBotanical(state: AppState): void {
    if (!this.ctx) return;

    this.ctx.strokeStyle = state.palette.foreground;
    this.ctx.lineWidth = state.growth.lineWidth;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.globalAlpha = 0.78;

    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      if (node.parentIndex === undefined) continue;

      const parent = this.nodes[node.parentIndex];
      this.drawCurvedStem(parent, node);

      const leafChance = state.growth.leafDensity * (node.depth > 2 ? 0.58 : 0.18);
      if (node.depth % 2 === 0 && this.hash(node.seed + 3) < leafChance) {
        this.drawLeaf(state, parent.pos, node.pos, node.seed);
      }

      if (node.active && node.depth > 4 && this.hash(node.seed + 29) < state.growth.flowerDensity * 0.55) {
        this.drawBud(state, parent.pos, node.pos, node.seed);
      }
    }

    this.ctx.globalAlpha = 1;
  }

  private drawCurvedStem(parent: Node, node: Node): void {
    if (!this.ctx) return;

    const mid = parent.pos.lerp(node.pos, 0.5);
    const direction = node.pos.sub(parent.pos).normalize();
    const normal = new Vec2(-direction.y, direction.x);
    const bend = (this.hash(node.seed + 11) - 0.5) * parent.pos.dist(node.pos) * 0.45;
    const control = mid.add(normal.scale(bend));

    this.ctx.beginPath();
    this.ctx.moveTo(parent.pos.x, parent.pos.y);
    this.ctx.quadraticCurveTo(control.x, control.y, node.pos.x, node.pos.y);
    this.ctx.stroke();
  }

  private drawLeaf(state: AppState, from: Vec2, to: Vec2, seed: number): void {
    if (!this.ctx) return;

    const direction = to.sub(from).normalize();
    const normal = new Vec2(-direction.y, direction.x);
    const side = this.hash(seed + 7) > 0.5 ? 1 : -1;
    const anchor = from.lerp(to, 0.62);
    const size = state.growth.stepSize * (1.15 + this.hash(seed + 13) * 0.75);
    const width = size * 0.32;
    const tip = anchor.add(direction.scale(size * 0.82)).add(normal.scale(side * size * 0.55));
    const c1 = anchor.add(direction.scale(size * 0.24)).add(normal.scale(side * width));
    const c2 = anchor.add(direction.scale(size * 0.62)).add(normal.scale(side * -width * 0.08));

    this.ctx.save();
    this.ctx.globalAlpha = 0.62;
    this.ctx.strokeStyle = state.palette.foreground;
    this.ctx.fillStyle = hexToRgba(state.palette.colors[2], 0.08);
    this.ctx.lineWidth = Math.max(0.45, state.growth.lineWidth * 0.82);
    this.ctx.beginPath();
    this.ctx.moveTo(anchor.x, anchor.y);
    this.ctx.quadraticCurveTo(c1.x, c1.y, tip.x, tip.y);
    this.ctx.quadraticCurveTo(c2.x, c2.y, anchor.x, anchor.y);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.globalAlpha = 0.42;
    this.ctx.beginPath();
    this.ctx.moveTo(anchor.x, anchor.y);
    this.ctx.lineTo(tip.x, tip.y);
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawBud(state: AppState, from: Vec2, to: Vec2, seed: number): void {
    if (!this.ctx) return;

    const direction = to.sub(from).normalize();
    const normal = new Vec2(-direction.y, direction.x);
    const radius = state.growth.stepSize * (0.42 + this.hash(seed + 41) * 0.28);
    const base = to.add(direction.scale(radius * 0.45));
    const neck = to.add(direction.scale(radius * 0.18));
    const left = base.add(normal.scale(radius * 0.42));
    const right = base.add(normal.scale(-radius * 0.42));
    const tip = base.add(direction.scale(radius * 1.18));

    this.ctx.save();
    this.ctx.globalAlpha = 0.68;
    this.ctx.strokeStyle = state.palette.foreground;
    this.ctx.fillStyle = hexToRgba(state.palette.colors[2], 0.08);
    this.ctx.lineWidth = Math.max(0.45, state.growth.lineWidth * 0.85);
    this.ctx.beginPath();
    this.ctx.moveTo(to.x, to.y);
    this.ctx.quadraticCurveTo(neck.x, neck.y, base.x, base.y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(left.x, left.y);
    this.ctx.quadraticCurveTo(tip.x, tip.y, right.x, right.y);
    this.ctx.quadraticCurveTo(base.x, base.y, left.x, left.y);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();
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

  private findClosestActiveNode(target: Vec2, maxDistance: number, activeIndices: number[]): { index: number; distance: number } | null {
    let closest: { index: number; distance: number } | null = null;

    for (const index of activeIndices) {
      const distance = this.nodes[index].pos.dist(target);
      if (distance <= maxDistance && (!closest || distance < closest.distance)) {
        closest = { index, distance };
      }
    }

    return closest;
  }

  private findNearestAttractor(pos: Vec2): Vec2 | null {
    if (this.attractors.length === 0) {
      return null;
    }

    let nearest = this.attractors[0];
    let nearestDistance = pos.dist(nearest);
    for (let i = 1; i < this.attractors.length; i++) {
      const distance = pos.dist(this.attractors[i]);
      if (distance < nearestDistance) {
        nearest = this.attractors[i];
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  private getActiveNodeIndices(): number[] {
    const indices: number[] = [];
    for (let i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i].active) {
        indices.push(i);
      }
    }
    return indices;
  }

  private createNode(pos: Vec2, parentIndex: number | undefined, depth: number): Node {
    return {
      pos,
      parentIndex,
      depth,
      active: true,
      seed: Math.floor(this.nextRandom() * 1_000_000),
    };
  }

  private getBounds(targets: Vec2[], width: number, height: number): { left: number; right: number; top: number; bottom: number } {
    if (targets.length === 0) {
      return {
        left: width * 0.22,
        right: width * 0.78,
        top: height * 0.20,
        bottom: height * 0.82,
      };
    }

    let left = targets[0].x;
    let right = targets[0].x;
    let top = targets[0].y;
    let bottom = targets[0].y;

    for (const target of targets) {
      left = Math.min(left, target.x);
      right = Math.max(right, target.x);
      top = Math.min(top, target.y);
      bottom = Math.max(bottom, target.y);
    }

    const padding = Math.max(width, height) * 0.04;
    return {
      left: clamp(left - padding, width * 0.08, width * 0.92),
      right: clamp(right + padding, width * 0.08, width * 0.92),
      top: clamp(top - padding, height * 0.08, height * 0.92),
      bottom: clamp(bottom + padding, height * 0.08, height * 0.92),
    };
  }

  private nudgeRoot(pos: Vec2, width: number, height: number): Vec2 {
    const offset = Math.min(width, height) * 0.025;
    return new Vec2(
      clamp(pos.x + (this.nextRandom() - 0.5) * offset, width * 0.06, width * 0.94),
      clamp(pos.y + (this.nextRandom() - 0.5) * offset, height * 0.06, height * 0.94),
    );
  }

  private rotate(vector: Vec2, angle: number): Vec2 {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    return new Vec2(vector.x * cos - vector.y * sin, vector.x * sin + vector.y * cos);
  }

  private nextRandom(): number {
    this.randomSeed = (1664525 * this.randomSeed + 1013904223) % 4294967296;
    return this.randomSeed / 4294967296;
  }

  private hash(value: number): number {
    const x = Math.sin(value * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  private getTargetSignature(state: AppState): string {
    const points = state.targetPoints;
    if (points.length === 0) {
      return "0";
    }

    const mid = points[Math.floor(points.length / 2)];
    const last = points[points.length - 1];
    return `${points.length}:${points[0].x.toFixed(3)},${points[0].y.toFixed(3)}:${mid.x.toFixed(3)},${mid.y.toFixed(3)}:${last.x.toFixed(3)},${last.y.toFixed(3)}`;
  }
}
