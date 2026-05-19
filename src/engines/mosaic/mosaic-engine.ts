import { hexToRgbFloat } from "@/shared/lib/color";
import { smoothNoise2D } from "@/shared/lib/noise";
import type { AppState, GenerativeEngine } from "@/shared/types/app";

export class MosaicEngine implements GenerativeEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private getState: (() => AppState) | null = null;
  private time = 0;

  public init(canvas: HTMLCanvasElement, getState: () => AppState): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.getState = getState;
  }

  public update(): void {
    if (!this.canvas || !this.ctx || !this.getState) return;

    const state = this.getState();
    if (this.canvas.width !== state.canvas.width || this.canvas.height !== state.canvas.height) {
      this.canvas.width = state.canvas.width;
      this.canvas.height = state.canvas.height;
    }
    if (state.isPlaying) {
      this.time += 0.012;
    }

    const { width, height } = this.canvas;
    const cell = state.mosaic.cellSize;
    this.ctx.fillStyle = state.palette.background;
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.lineWidth = state.mosaic.borderWidth;
    this.ctx.strokeStyle = state.palette.background;

    for (let y = 0; y < height; y += cell) {
      for (let x = 0; x < width; x += cell) {
        const n = (smoothNoise2D(x * 0.012 + this.time, y * 0.012 - this.time) + 1) * 0.5;
        const base = state.palette.colors[Math.floor(n * state.palette.colors.length) % state.palette.colors.length];
        for (let level = 0; level < state.mosaic.concentricLevels; level++) {
          const inset = level * cell * state.mosaic.gapRatio;
          const size = cell - inset * 2;
          if (size <= 1) continue;
          this.ctx.fillStyle = shiftColor(base, 1 - level * 0.11);
          this.ctx.fillRect(x + inset, y + inset, size, size);
          this.ctx.strokeRect(x + inset, y + inset, size, size);
        }
      }
    }
  }

  public destroy(): void {
    this.canvas = null;
    this.ctx = null;
    this.getState = null;
  }
}

function shiftColor(hex: string, factor: number): string {
  const [r, g, b] = hexToRgbFloat(hex).map((value) => Math.round(Math.max(0, Math.min(1, value * factor)) * 255));
  return `rgb(${r}, ${g}, ${b})`;
}
