import { hexToRgbFloat } from "@/shared/lib/color";
import { smoothNoise2D } from "@/shared/lib/noise";
import type { AppState, GenerativeEngine } from "@/shared/types/app";

type Point = { x: number; y: number };

export class VoxelEngine implements GenerativeEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private getState: (() => AppState) | null = null;
  private time = 0;

  public init(canvas: HTMLCanvasElement, getState: () => AppState): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.getState = getState;
    this.time = 0;
  }

  public update(): void {
    if (!this.canvas || !this.ctx || !this.getState) return;

    const state = this.getState();

    // Sync canvas size
    if (
      this.canvas.width !== state.canvas.width ||
      this.canvas.height !== state.canvas.height
    ) {
      this.canvas.width = state.canvas.width;
      this.canvas.height = state.canvas.height;
    }

    if (state.isPlaying) this.time += 0.005;

    const { width, height } = this.canvas;
    const { gridCols, gridRows, cubeSize, maxHeight, noiseScale } = state.voxel;

    // ── Auto-calculate origin so the grid fills the canvas ──────────────────
    const isoH = (gridCols + gridRows) * (cubeSize / 4);
    const topPad = maxHeight * (cubeSize / 2) + height * 0.04;
    const originX = width / 2;
    const originY = topPad + Math.max(0, (height - isoH - topPad) * 0.1);

    // ── Clear ────────────────────────────────────────────────────────────────
    this.ctx.fillStyle = state.palette.background;
    this.ctx.fillRect(0, 0, width, height);

    // ── Draw order: BACK → FRONT (painter's algorithm) ───────────────────────
    // Depth increases as (col + row) increases.
    // Back  = small (col + row) → draw FIRST (row: 0 → max, col: 0 → max)
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        // Noise → stack height
        const n = (smoothNoise2D(
          col * noiseScale + this.time,
          row * noiseScale - this.time
        ) + 1) * 0.5;                               // normalize to 0..1

        const stackHeight = Math.max(1, Math.floor(n * maxHeight));

        // Lerp through full 5-color palette
        const topColor = lerpPalette(state.palette.colors, n);

        this.drawCube(originX, originY, col, row, stackHeight, cubeSize, topColor);
      }
    }
  }

  public destroy(): void {
    this.canvas = null;
    this.ctx = null;
    this.getState = null;
  }

  // ── Cube renderer ──────────────────────────────────────────────────────────
  private drawCube(
    originX: number,
    originY: number,
    col: number,
    row: number,
    stackHeight: number,
    size: number,
    topColor: string
  ): void {
    if (!this.ctx) return;

    // Top-center of this pillar (screen space)
    const x = originX + (col - row) * (size / 2);
    const y = originY + (col + row) * (size / 4) - stackHeight * (size / 2);
    const wallH = stackHeight * (size / 2);  // screen height of side walls

    // Top face — diamond/rhombus
    const top: Point[] = [
      { x,               y               },  // apex
      { x: x + size / 2, y: y + size / 4 }, // right
      { x,               y: y + size / 2 }, // base
      { x: x - size / 2, y: y + size / 4 }, // left
    ];

    // Left face (bottom-left of diamond → down by wallH)
    const left: Point[] = [
      top[3],
      top[2],
      { x: top[2].x, y: top[2].y + wallH },
      { x: top[3].x, y: top[3].y + wallH },
    ];

    // Right face (bottom-right of diamond → down by wallH)
    const right: Point[] = [
      top[1],
      top[2],
      { x: top[2].x, y: top[2].y + wallH },
      { x: top[1].x, y: top[1].y + wallH },
    ];

    // Light from top-left → left face darkest, right face mid, top brightest
    this.drawPoly(left,  shade(topColor, 0.55));  // darkest
    this.drawPoly(right, shade(topColor, 0.78));  // mid
    this.drawPoly(top,   topColor);               // full brightness
  }

  private drawPoly(points: Point[], fill: string): void {
    if (!this.ctx || points.length < 2) return;
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) this.ctx.lineTo(points[i].x, points[i].y);
    this.ctx.closePath();
    this.ctx.fillStyle = fill;
    this.ctx.fill();

    // Subtle edge stroke — only on top face keeps it readable without noise
    this.ctx.strokeStyle = "rgba(0,0,0,0.15)";
    this.ctx.lineWidth = 0.4;
    this.ctx.stroke();
  }
}

// ── Color helpers ─────────────────────────────────────────────────────────────

function lerpPalette(colors: string[], t: number): string {
  const n = colors.length - 1;           // 4 segments for 5 colors
  const scaled = Math.min(t * n, n - 0.0001);
  const i = Math.floor(scaled);
  return lerpHex(colors[i], colors[i + 1], scaled - i);
}

function lerpHex(a: string, b: string, t: number): string {
  const ca = hexToRgbFloat(a);
  const cb = hexToRgbFloat(b);
  const rgb = ca.map((v, i) => Math.round((v + (cb[i] - v) * t) * 255));
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function shade(color: string, factor: number): string {
  let r = 255, g = 255, b = 255;
  if (color.startsWith("rgb(")) {
    const match = color.match(/\d+/g);
    if (match && match.length >= 3) {
      r = Number(match[0]);
      g = Number(match[1]);
      b = Number(match[2]);
    }
  } else {
    const rgb = hexToRgbFloat(color);
    r = Math.round(rgb[0] * 255);
    g = Math.round(rgb[1] * 255);
    b = Math.round(rgb[2] * 255);
  }
  r = Math.round(Math.max(0, Math.min(255, r * factor)));
  g = Math.round(Math.max(0, Math.min(255, g * factor)));
  b = Math.round(Math.max(0, Math.min(255, b * factor)));
  return `rgb(${r}, ${g}, ${b})`;
}
