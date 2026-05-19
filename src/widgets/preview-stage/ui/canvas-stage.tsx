import { useEffect, useRef } from "react";
import { BoidsEngine } from "@/engines/boids/boids-engine";
import { DotsEngine } from "@/engines/dots/dots-engine";
import { FlowEngine } from "@/engines/flow/flow-engine";
import { GrowthEngine } from "@/engines/growth/growth-engine";
import { MosaicEngine } from "@/engines/mosaic/mosaic-engine";
import { VoxelEngine } from "@/engines/voxel/voxel-engine";
import { useAppStore } from "@/entities/preset/model/store";
import type { GenerativeEngine, Mode } from "@/shared/types/app";

type Props = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
};

export function CanvasStage({ canvasRef }: Props) {
  const mode = useAppStore((state) => state.mode);
  const animationRef = useRef<number | null>(null);
  const engineRef = useRef<GenerativeEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    engineRef.current?.destroy();
    engineRef.current = createEngine(mode);
    engineRef.current.init(canvas, useAppStore.getState);

    const tick = () => {
      engineRef.current?.update();
      animationRef.current = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, [canvasRef, mode]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />;
}

function createEngine(mode: Mode): GenerativeEngine {
  if (mode === "shader") {
    return new EmptyEngine();
  }

  if (mode === "dots") {
    return new DotsEngine();
  }

  if (mode === "flow") {
    return new FlowEngine();
  }

  if (mode === "growth") {
    return new GrowthEngine();
  }

  if (mode === "mosaic") {
    return new MosaicEngine();
  }

  if (mode === "voxel") {
    return new VoxelEngine();
  }

  return new BoidsEngine();
}

class EmptyEngine implements GenerativeEngine {
  private canvas: HTMLCanvasElement | null = null;
  private getState: (() => ReturnType<typeof useAppStore.getState>) | null = null;

  public init(canvas: HTMLCanvasElement, getState: () => ReturnType<typeof useAppStore.getState>): void {
    this.canvas = canvas;
    this.getState = getState;
  }

  public update(): void {
    if (!this.canvas || !this.getState) {
      return;
    }

    const state = this.getState();
    if (this.canvas.width !== state.canvas.width || this.canvas.height !== state.canvas.height) {
      this.canvas.width = state.canvas.width;
      this.canvas.height = state.canvas.height;
    }

    const ctx = this.canvas.getContext("2d");
    ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (ctx && state.shader.symmetry === "quad") {
      this.renderGrid(ctx);
    }
  }

  public destroy(): void {
    this.canvas = null;
    this.getState = null;
  }

  private renderGrid(ctx: CanvasRenderingContext2D): void {
    if (!this.canvas) return;

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= this.canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= this.canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }
}
