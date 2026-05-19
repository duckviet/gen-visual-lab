import { useEffect, useRef } from "react";
import { downloadDataUrl, generateCompositeDataUrl } from "@/features/export-image/model/export";
import { useAppStore } from "@/entities/preset/model/store";
import { CanvasStage } from "./canvas-stage";
import { WebglStage } from "./webgl-stage";

export function PreviewStage() {
  const webglCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const vectorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvas = useAppStore((state) => state.canvas);
  const palette = useAppStore((state) => state.palette);
  const togglePlaying = useAppStore((state) => state.togglePlaying);
  const reset = useAppStore((state) => state.reset);

  const handleExport = () => {
    const webglCanvas = webglCanvasRef.current;
    const vectorCanvas = vectorCanvasRef.current;
    if (!webglCanvas || !vectorCanvas) {
      return;
    }

    const dataUrl = generateCompositeDataUrl(webglCanvas, vectorCanvas, canvas.width, canvas.height);
    downloadDataUrl(dataUrl, "generative-shape-lab.png");
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        togglePlaying();
      }
      if (event.key.toLowerCase() === "r") {
        reset();
      }
      if (event.key.toLowerCase() === "e") {
        handleExport();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [reset, togglePlaying]);

  return (
    <section className="preview-stage">
      <div className="grid min-h-0 place-items-center">
        <div
          className="preview-frame"
          style={{ backgroundColor: palette.background }}
        >
          <WebglStage canvasRef={webglCanvasRef} />
          <CanvasStage canvasRef={vectorCanvasRef} />
        </div>
      </div>
      <div className="preview-toolbar">
        <span>
          {canvas.width} x {canvas.height}
        </span>
        <button
          className="ds-button ds-button-on-surface"
          onClick={handleExport}
          type="button"
        >
          Export PNG
        </button>
      </div>
    </section>
  );
}
