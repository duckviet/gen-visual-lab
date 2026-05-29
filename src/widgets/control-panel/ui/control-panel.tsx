import { useEffect, useState } from "react";
import * as opentype from "opentype.js";
import { BUILT_IN_PRESETS } from "@/entities/preset/config/default-presets";
import { downloadPreset, parsePreset, serializePreset } from "@/features/export-image/model/presets";
import { sampleFontTextPoints, sampleSvgPoints } from "@/shared/lib/path-sampling";
import { sampleTextPoints } from "@/shared/lib/text-sampler";
import { useAppStore } from "@/entities/preset/model/store";
import { CANVAS_SIZE_OPTIONS, MODE_OPTIONS } from "../config/control-config";
import {
  ColorControl,
  Panel,
  SegmentedButtons,
  SelectControl,
} from "./control-fields";
import { BoidsPanel } from "./boids-panel";
import { DotsPanel } from "./dots-panel";
import { FlowPanel } from "./flow-panel";
import { GrowthPanel } from "./growth-panel";
import { MosaicPanel } from "./mosaic-panel";
import { ShaderPanel } from "./shader-panel";
import { SourcePanel } from "./source-panel";
import { VoxelPanel } from "./voxel-panel";

type Props = {
  isOpen: boolean;
  onToggleOpen: () => void;
};

export function ControlPanel({ isOpen, onToggleOpen }: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const mode = useAppStore((state) => state.mode);
  const text = useAppStore((state) => state.text);
  const boids = useAppStore((state) => state.boids);
  const shader = useAppStore((state) => state.shader);
  const dots = useAppStore((state) => state.dots);
  const flow = useAppStore((state) => state.flow);
  const growth = useAppStore((state) => state.growth);
  const mosaic = useAppStore((state) => state.mosaic);
  const voxel = useAppStore((state) => state.voxel);
  const svg = useAppStore((state) => state.svg);
  const inputType = useAppStore((state) => state.inputType);
  const canvas = useAppStore((state) => state.canvas);
  const palette = useAppStore((state) => state.palette);
  const isPlaying = useAppStore((state) => state.isPlaying);
  const setMode = useAppStore((state) => state.setMode);
  const setInputType = useAppStore((state) => state.setInputType);
  const setText = useAppStore((state) => state.setText);
  const setSvg = useAppStore((state) => state.setSvg);
  const setBoids = useAppStore((state) => state.setBoids);
  const setShader = useAppStore((state) => state.setShader);
  const setDots = useAppStore((state) => state.setDots);
  const setFlow = useAppStore((state) => state.setFlow);
  const setGrowth = useAppStore((state) => state.setGrowth);
  const setMosaic = useAppStore((state) => state.setMosaic);
  const setVoxel = useAppStore((state) => state.setVoxel);
  const setCanvasSize = useAppStore((state) => state.setCanvasSize);
  const setTargetPoints = useAppStore((state) => state.setTargetPoints);
  const setPaletteColor = useAppStore((state) => state.setPaletteColor);
  const setPaletteField = useAppStore((state) => state.setPaletteField);
  const randomizePalette = useAppStore((state) => state.randomizePalette);
  const loadPreset = useAppStore((state) => state.loadPreset);
  const togglePlaying = useAppStore((state) => state.togglePlaying);
  const reset = useAppStore((state) => state.reset);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (mode === "shader" || mode === "mosaic" || mode === "voxel") {
        setTargetPoints([]);
        return;
      }

      async function updateTargets() {
        setIsParsing(true);
        try {
          const count = Math.max(boids.count, flow.particleCount, growth.attractorCount, svg.samplePoints, 800);
          if (inputType === "svg") {
            const points = svg.source ? await sampleSvgWithWorker(svg.source, svg.samplePoints, svg.sampleMode) : [];
            if (!cancelled) setTargetPoints(points);
            return;
          }

          if (text.fontFamily === "custom" && text.fontBuffer) {
            const font = opentype.parse(text.fontBuffer.slice(0));
            const points = sampleFontTextPoints(font, text.value, text.fontSize, count);
            if (!cancelled) setTargetPoints(points);
            return;
          }

          if (!cancelled) setTargetPoints(sampleTextPoints(text.value, text.fontSize, count));
        } catch (error) {
          console.error("Failed to sample source", error);
          showToast("Source sampling failed. Using an empty target set.");
          if (!cancelled) setTargetPoints([]);
        } finally {
          if (!cancelled) setIsParsing(false);
        }
      }

      void updateTargets();
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    boids.count,
    flow.particleCount,
    growth.attractorCount,
    inputType,
    mode,
    setTargetPoints,
    svg.sampleMode,
    svg.samplePoints,
    svg.source,
    text.fontBuffer,
    text.fontFamily,
    text.fontSize,
    text.value,
  ]);

  const handleFontUpload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.name.endsWith(".ttf") && !file.name.endsWith(".otf")) {
      showToast("Failed to parse font file. Use a valid .ttf or .otf file.");
      setText({ fontFamily: "system-ui", fontBuffer: undefined, fontName: undefined });
      return;
    }

    try {
      setIsParsing(true);
      const buffer = await file.arrayBuffer();
      opentype.parse(buffer.slice(0));
      setText({ fontFamily: "custom", fontBuffer: buffer, fontName: file.name });
      setInputType("text");
      showToast("Font loaded.");
    } catch (error) {
      console.error("Failed to parse font file", error);
      showToast("Failed to parse font file. Falling back to system-ui.");
      setText({ fontFamily: "system-ui", fontBuffer: undefined, fontName: undefined });
    } finally {
      setIsParsing(false);
    }
  };

  const handleSvgUpload = async (file: File | undefined) => {
    if (!file) return;
    try {
      setIsParsing(true);
      const source = await file.text();
      const points = await sampleSvgWithWorker(source, svg.samplePoints, svg.sampleMode);
      setSvg({ source });
      setInputType("svg");
      setTargetPoints(points);
      showToast(points.length > 0 ? "SVG loaded." : "SVG loaded, but no parseable vectors were found.");
    } catch (error) {
      console.error("Unable to parse SVG. Please verify the file is a valid vector drawing containing vector paths.", error);
      showToast("Unable to parse SVG. Keeping an empty target set.");
      setSvg({ source: undefined });
      setInputType("svg");
      setTargetPoints([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handlePresetUpload = async (file: File | undefined) => {
    if (!file) return;
    try {
      loadPreset(parsePreset(await file.text()));
      showToast("Preset loaded.");
    } catch (error) {
      console.error("Failed to load preset JSON", error);
      showToast("Failed to load preset JSON.");
    }
  };

  function showToast(message: string): void {
    setToast(message);
    window.setTimeout(() => setToast((current) => (current === message ? null : current)), 2800);
  }

  return (
    <aside
      className={`control-panel ${isOpen ? "control-panel-open" : "control-panel-closed"}`}
    >
      {toast ? <div className="ds-toast">{toast}</div> : null}
      <div className="ds-hero">
        <p className="ds-brand-title">Shape Lab</p>
        <p className="mt-2 uppercase">Generative canvas workstation</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            className="ds-button ds-button-compact ds-button-on-surface lg:hidden"
            onClick={onToggleOpen}
            type="button"
          >
            Canvas
          </button>
          <button
            className="ds-button ds-button-compact ds-button-on-surface"
            onClick={() => setIsAboutOpen(true)}
            type="button"
          >
            About
          </button>
        </div>
      </div>

      {isParsing ? <div className="ds-loading">Parsing source...</div> : null}

      <Panel title="Mode">
        <SegmentedButtons
          columns={3}
          onChange={setMode}
          options={MODE_OPTIONS}
          value={mode}
        />
      </Panel>

      <Panel title="Playback">
        <div className="grid grid-cols-2 gap-2">
          <button className="ds-button" onClick={togglePlaying} type="button">
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button className="ds-button" onClick={reset} type="button">
            Reset
          </button>
        </div>
      </Panel>

      {mode !== "shader" && mode !== "mosaic" && mode !== "voxel" ? (
        <SourcePanel
          inputType={inputType}
          onFontUpload={handleFontUpload}
          onInputTypeChange={setInputType}
          onSvgUpload={handleSvgUpload}
          setSvg={setSvg}
          setText={setText}
          svg={svg}
          text={text}
        />
      ) : null}

      {mode === "shader" ? (
        <ShaderPanel setShader={setShader} shader={shader} />
      ) : null}
      {mode === "custom" || mode === "dots" ? (
        <BoidsPanel boids={boids} setBoids={setBoids} />
      ) : null}
      {mode === "dots" ? <DotsPanel dots={dots} setDots={setDots} /> : null}
      {mode === "flow" ? <FlowPanel flow={flow} setFlow={setFlow} /> : null}
      {mode === "growth" ? (
        <GrowthPanel growth={growth} setGrowth={setGrowth} />
      ) : null}
      {mode === "mosaic" ? (
        <MosaicPanel mosaic={mosaic} setMosaic={setMosaic} />
      ) : null}
      {mode === "voxel" ? (
        <VoxelPanel setVoxel={setVoxel} voxel={voxel} />
      ) : null}

      <Panel title="Canvas">
        <SelectControl
          label="Canvas Size"
          onChange={(value) => setCanvasSize(Number(value))}
          options={CANVAS_SIZE_OPTIONS}
          value={canvas.width}
        />
      </Panel>

      <Panel title="Palette">
        <div className="grid grid-cols-5 gap-2">
          {palette.colors.map((color, index) => (
            <input
              aria-label={`Palette color ${index + 1}`}
              className="color-swatch"
              key={`${index}-${color}`}
              onChange={(event) => setPaletteColor(index, event.target.value)}
              type="color"
              value={color}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ColorControl
            label="Background"
            onChange={(value) => setPaletteField("background", value)}
            value={palette.background}
          />
          <ColorControl
            label="Foreground"
            onChange={(value) => setPaletteField("foreground", value)}
            value={palette.foreground}
          />
        </div>
        <button className="ds-button" onClick={randomizePalette} type="button">
          Randomize Palette
        </button>
      </Panel>

      <Panel title="Presets">
        <div className="grid gap-2">
          {BUILT_IN_PRESETS.map((preset) => (
            <button
              className="ds-button"
              key={preset.name}
              onClick={() => loadPreset(preset.state)}
              type="button"
            >
              {preset.name}
            </button>
          ))}
        </div>
        <button
          className="ds-button"
          onClick={() =>
            downloadPreset(serializePreset(useAppStore.getState()))
          }
          type="button"
        >
          Save JSON
        </button>
        <label className="grid gap-2 uppercase">
          Load JSON
          <input
            accept=".json,application/json"
            className="ds-file"
            onChange={(event) =>
              void handlePresetUpload(event.target.files?.[0])
            }
            type="file"
          />
        </label>
      </Panel>

      {isAboutOpen ? (
        <div className="modal-backdrop">
          <div className="modal-panel">
            <h2 className="modal-title">Generative Shape Lab</h2>
            <p className="mt-3">
              Browser-based generative art tool using text, SVG, shaders, boids,
              dots, flow fields, and growth systems.
            </p>
            <button
              className="ds-button mt-4"
              onClick={() => setIsAboutOpen(false)}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function sampleSvgWithWorker(source: string, samplePoints: number, sampleMode: "outline" | "fill") {
  if (sampleMode === "fill" || source.length < 10_000 || !window.Worker) {
    return sampleSvgPoints(source, samplePoints, sampleMode);
  }

  return new Promise<Awaited<ReturnType<typeof sampleSvgPoints>>>((resolve, reject) => {
    const worker = new Worker(new URL("../../../features/svg-upload/model/svg-sampler.worker.ts", import.meta.url), {
      type: "module",
    });

    worker.onmessage = (event: MessageEvent<{ points?: Awaited<ReturnType<typeof sampleSvgPoints>>; error?: string }>) => {
      worker.terminate();
      if (event.data.error) {
        reject(new Error(event.data.error));
        return;
      }
      resolve(event.data.points ?? []);
    };
    worker.onerror = (event) => {
      worker.terminate();
      reject(new Error(event.message));
    };
    worker.postMessage({ source, samplePoints });
  });
}
