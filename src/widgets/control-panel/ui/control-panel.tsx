import { useEffect, useState } from "react";
import * as opentype from "opentype.js";
import { BUILT_IN_PRESETS } from "@/entities/preset/config/default-presets";
import { downloadPreset, parsePreset, serializePreset } from "@/features/export-image/model/presets";
import { sampleFontTextPoints, sampleSvgPoints } from "@/shared/lib/path-sampling";
import { sampleTextPoints } from "@/shared/lib/text-sampler";
import { useAppStore } from "@/entities/preset/model/store";
import type { InputType, Mode, ShaderPreset } from "@/shared/types/app";

const MODES: Array<{ label: string; value: Mode; disabled?: boolean }> = [
  { label: "Custom", value: "custom" },
  { label: "Shader", value: "shader" },
  { label: "Dots", value: "dots" },
  { label: "Flow", value: "flow" },
  { label: "Growth", value: "growth" },
  { label: "Mosaic", value: "mosaic" },
  { label: "Voxel", value: "voxel" },
];

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

  const handleInputType = (value: InputType) => {
    setInputType(value);
  };

  function showToast(message: string): void {
    setToast(message);
    window.setTimeout(() => setToast((current) => (current === message ? null : current)), 2800);
  }

  return (
    <aside className={`control-panel ${isOpen ? "control-panel-open" : "control-panel-closed"}`}>
      {toast ? <div className="ds-toast">{toast}</div> : null}
      <div className="ds-hero">
        <p className="ds-brand-title">Shape Lab</p>
        <p className="mt-2 uppercase">Generative canvas workstation</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="ds-button ds-button-compact ds-button-on-surface lg:hidden" onClick={onToggleOpen} type="button">
            Canvas
          </button>
          <button className="ds-button ds-button-compact ds-button-on-surface" onClick={() => setIsAboutOpen(true)} type="button">
            About
          </button>
        </div>
      </div>

      {isParsing ? <div className="ds-loading">Parsing source...</div> : null}

      <Panel title="Mode">
        <div className="grid grid-cols-3 gap-2">
          {MODES.map((item) => (
            <button
              className={`${buttonClass(mode === item.value)} ds-button-compact ${item.disabled ? "opacity-45" : ""}`}
              disabled={item.disabled}
              key={item.value}
              onClick={() => setMode(item.value)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
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
        <Panel title="Source">
          <div className="grid grid-cols-2 gap-2">
            <button
              className={buttonClass(inputType === "text")}
              onClick={() => handleInputType("text")}
              type="button"
            >
              Text
            </button>
            <button
              className={buttonClass(inputType === "svg")}
              onClick={() => handleInputType("svg")}
              type="button"
            >
              SVG
            </button>
          </div>
          {inputType === "text" ? (
            <>
              <label className="grid gap-2 uppercase">
                Text
                <input
                  className="ds-input"
                  maxLength={30}
                  onChange={(event) => setText({ value: event.target.value })}
                  value={text.value}
                />
              </label>
              <RangeControl
                label="Font Size"
                max={300}
                min={20}
                onChange={(value) => setText({ fontSize: value })}
                step={1}
                value={text.fontSize}
              />
              <label className="ds-check-row">
                Preview Outline
                <input checked={text.showOutline} onChange={(event) => setText({ showOutline: event.target.checked })} type="checkbox" />
              </label>
              <label className="grid gap-2 uppercase">
                Font Upload
                <input accept=".ttf,.otf" className="ds-file" onChange={(event) => void handleFontUpload(event.target.files?.[0])} type="file" />
              </label>
              <p className="ds-muted">{text.fontName ?? "system-ui"}</p>
            </>
          ) : (
            <>
              <label className="grid gap-2 uppercase">
                SVG Upload
                <input accept=".svg" className="ds-file" onChange={(event) => void handleSvgUpload(event.target.files?.[0])} type="file" />
              </label>
              <RangeControl
                label="Sample Density"
                max={5000}
                min={100}
                onChange={(value) => setSvg({ samplePoints: value })}
                step={50}
                value={svg.samplePoints}
              />
              <label className="grid gap-2 uppercase">
                Sampling
                <select
                  className="ds-select"
                  onChange={(event) => setSvg({ sampleMode: event.target.value as "outline" | "fill" })}
                  value={svg.sampleMode}
                >
                  <option value="outline">Outline</option>
                  <option value="fill">Fill</option>
                </select>
              </label>
              <label className="ds-check-row">
                Preview Points
                <input checked={text.showOutline} onChange={(event) => setText({ showOutline: event.target.checked })} type="checkbox" />
              </label>
              <label className="grid gap-2 uppercase">
                Fitting Mode
                <select className="ds-select" onChange={(event) => setSvg({ fit: event.target.value as "contain" | "cover" })} value={svg.fit}>
                  <option value="contain">Contain</option>
                  <option value="cover">Cover</option>
                </select>
              </label>
            </>
          )}
        </Panel>
      ) : null}

      {mode === "shader" ? (
        <Panel title="Shader">
          <label className="grid gap-2 uppercase">
            Preset
            <select
              className="ds-select"
              onChange={(event) => setShader({ preset: event.target.value as ShaderPreset })}
              value={shader.preset}
            >
              <option value="liquid">Liquid</option>
              <option value="grain">Grain</option>
              <option value="terrain">Terrain</option>
              <option value="fluid-advection">Fluid Advection</option>
              <option value="tiger-wave">Tiger Wave</option>
              <option value="voronoi">Voronoi</option>
              <option value="waterfall">Waterfall</option>
            </select>
          </label>
          <label className="grid gap-2 uppercase">
            Symmetry
            <select
              className="ds-select"
              onChange={(event) => setShader({ symmetry: event.target.value as any })}
              value={shader.symmetry}
            >
              <option value="none">None</option>
              <option value="mirror">Mirror</option>
              <option value="quad">Quad</option>
              <option value="radial">Radial</option>
            </select>
          </label>
          <RangeControl label="Flow Speed" max={3} min={0} onChange={(value) => setShader({ speed: value })} step={0.05} value={shader.speed} />

          {shader.preset === "tiger-wave" ? (
            <>
              <RangeControl label="Stripe Angle" max={180} min={0} onChange={(value) => setShader({ stripeAngle: value })} step={1} value={shader.stripeAngle} />
              <RangeControl label="Stripe Frequency" max={32} min={1} onChange={(value) => setShader({ stripeFrequency: value })} step={0.5} value={shader.stripeFrequency} />
              <RangeControl label="Ridge Sharpness" max={3.0} min={0.3} onChange={(value) => setShader({ stripeWidth: value })} step={0.1} value={shader.stripeWidth} />
              <RangeControl label="Wave Amplitude" max={0.5} min={0} onChange={(value) => setShader({ waveAmplitude: value })} step={0.01} value={shader.waveAmplitude} />
              <RangeControl label="Wave Frequency" max={12.0} min={0.1} onChange={(value) => setShader({ waveFrequency: value })} step={0.1} value={shader.waveFrequency} />
              <RangeControl label="Glow Intensity" max={2.0} min={0} onChange={(value) => setShader({ glow: value })} step={0.05} value={shader.glow} />
              <RangeControl label="Noise Grain" max={1} min={0} onChange={(value) => setShader({ grain: value })} step={0.01} value={shader.grain} />
            </>
          ) : shader.preset === "voronoi" ? (
            <>
              <RangeControl label="Site Count" max={120} min={10} onChange={(value) => setShader({ voronoiSiteCount: value })} step={1} value={shader.voronoiSiteCount} />
              <RangeControl label="Edge Width" max={0.05} min={0.001} onChange={(value) => setShader({ voronoiEdgeWidth: value })} step={0.001} value={shader.voronoiEdgeWidth} />
              <RangeControl label="Edge Softness" max={0.03} min={0} onChange={(value) => setShader({ voronoiEdgeSoftness: value })} step={0.001} value={shader.voronoiEdgeSoftness} />
              <RangeControl label="Glow Radius" max={0.12} min={0.005} onChange={(value) => setShader({ voronoiGlowRadius: value })} step={0.005} value={shader.voronoiGlowRadius} />
              <RangeControl label="Glow Intensity" max={2.0} min={0} onChange={(value) => setShader({ voronoiGlowIntensity: value })} step={0.05} value={shader.voronoiGlowIntensity} />
              <RangeControl label="Warp Strength" max={0.12} min={0} onChange={(value) => setShader({ voronoiWarpStrength: value })} step={0.005} value={shader.voronoiWarpStrength} />
              <RangeControl label="Warp Scale" max={16} min={0.5} onChange={(value) => setShader({ voronoiWarpScale: value })} step={0.5} value={shader.voronoiWarpScale} />
              <RangeControl label="Thickness Var" max={1} min={0} onChange={(value) => setShader({ voronoiThicknessVariation: value })} step={0.05} value={shader.voronoiThicknessVariation} />
              <RangeControl label="Junction Boost" max={2} min={0} onChange={(value) => setShader({ voronoiJunctionBoost: value })} step={0.05} value={shader.voronoiJunctionBoost} />
              <RangeControl label="Contrast" max={3} min={0.2} onChange={(value) => setShader({ voronoiContrast: value })} step={0.05} value={shader.voronoiContrast} />
              <RangeControl label="Grain" max={0.2} min={0} onChange={(value) => setShader({ grain: value })} step={0.005} value={shader.grain} />
            </>
          ) : (
            <>
              <RangeControl label="Distortion" max={2} min={0} onChange={(value) => setShader({ distortion: value })} step={0.05} value={shader.distortion} />
              <RangeControl label="Swirl Rate" max={2} min={0} onChange={(value) => setShader({ swirl: value })} step={0.05} value={shader.swirl} />
              <RangeControl label="Noise Grain" max={1} min={0} onChange={(value) => setShader({ grain: value })} step={0.01} value={shader.grain} />
            </>
          )}
        </Panel>
      ) : mode === "custom" || mode === "dots" ? (
        <Panel title="Boids">
          <RangeControl label="Count" max={5000} min={10} onChange={(value) => setBoids({ count: value })} step={10} value={boids.count} />
          <RangeControl label="Speed" max={10} min={0.5} onChange={(value) => setBoids({ speed: value })} step={0.1} value={boids.speed} />
          <RangeControl label="View Distance" max={200} min={20} onChange={(value) => setBoids({ viewDistance: value })} step={1} value={boids.viewDistance} />
          <RangeControl label="Separation" max={5} min={0} onChange={(value) => setBoids({ separation: value })} step={0.1} value={boids.separation} />
          <RangeControl label="Alignment" max={5} min={0} onChange={(value) => setBoids({ alignment: value })} step={0.1} value={boids.alignment} />
          <RangeControl label="Cohesion" max={5} min={0} onChange={(value) => setBoids({ cohesion: value })} step={0.1} value={boids.cohesion} />
          <RangeControl label="Target Force" max={5} min={0} onChange={(value) => setBoids({ targetForce: value })} step={0.1} value={boids.targetForce} />
          <RangeControl label="Trail Fade" max={1} min={0} onChange={(value) => setBoids({ trail: value })} step={0.01} value={boids.trail} />
          <label className="ds-check-row">
            Wrap Boundaries
            <input checked={boids.wrap} onChange={(event) => setBoids({ wrap: event.target.checked })} type="checkbox" />
          </label>
        </Panel>
      ) : null}

      {mode === "dots" ? (
        <Panel title="Dots">
          <RangeControl label="Spacing" max={44} min={8} onChange={(value) => setDots({ spacing: value })} step={1} value={dots.spacing} />
          <RangeControl
            label="Influence Radius"
            max={180}
            min={20}
            onChange={(value) => setDots({ influenceRadius: value })}
            step={1}
            value={dots.influenceRadius}
          />
          <RangeControl label="Strength" max={4} min={0.2} onChange={(value) => setDots({ strength: value })} step={0.1} value={dots.strength} />
        </Panel>
      ) : null}

      {mode === "flow" ? (
        <Panel title="Flow Field">
          <RangeControl label="Particle Count" max={12000} min={100} onChange={(value) => setFlow({ particleCount: value })} step={50} value={flow.particleCount} />
          <RangeControl label="Cell Size" max={64} min={8} onChange={(value) => setFlow({ cellSize: value })} step={1} value={flow.cellSize} />
          <RangeControl label="Noise Scale" max={0.05} min={0.001} onChange={(value) => setFlow({ noiseScale: value })} step={0.001} value={flow.noiseScale} />
          <RangeControl label="Turbulence" max={5} min={0.1} onChange={(value) => setFlow({ turbulence: value })} step={0.1} value={flow.turbulence} />
          <RangeControl label="Trail Length" max={0.99} min={0.01} onChange={(value) => setFlow({ trailLength: value })} step={0.01} value={flow.trailLength} />
          <RangeControl label="Flow Speed" max={10} min={0.5} onChange={(value) => setFlow({ speed: value })} step={0.1} value={flow.speed} />
        </Panel>
      ) : null}

      {mode === "growth" ? (
        <Panel title="Growth">
          <RangeControl label="Step Size" max={20} min={1} onChange={(value) => setGrowth({ stepSize: value })} step={1} value={growth.stepSize} />
          <RangeControl label="Branch Angle" max={90} min={5} onChange={(value) => setGrowth({ branchAngle: value })} step={1} value={growth.branchAngle} />
          <RangeControl label="Max Branches" max={10000} min={100} onChange={(value) => setGrowth({ maxBranches: value })} step={100} value={growth.maxBranches} />
          <RangeControl label="Attractors Count" max={5000} min={100} onChange={(value) => setGrowth({ attractorCount: value })} step={50} value={growth.attractorCount} />
        </Panel>
      ) : null}

      {mode === "mosaic" ? (
        <Panel title="Mosaic">
          <RangeControl label="Cell Size" max={64} min={4} onChange={(value) => setMosaic({ cellSize: value })} step={1} value={mosaic.cellSize} />
          <RangeControl label="Levels" max={9} min={1} onChange={(value) => setMosaic({ concentricLevels: value })} step={1} value={mosaic.concentricLevels} />
          <RangeControl label="Gap Ratio" max={0.35} min={0.02} onChange={(value) => setMosaic({ gapRatio: value })} step={0.01} value={mosaic.gapRatio} />
          <RangeControl label="Border Width" max={4} min={0} onChange={(value) => setMosaic({ borderWidth: value })} step={0.5} value={mosaic.borderWidth} />
        </Panel>
      ) : null}

      {mode === "voxel" ? (
        <Panel title="Voxel">
          <RangeControl label="Grid Cols" max={70} min={12} onChange={(value) => setVoxel({ gridCols: value })} step={1} value={voxel.gridCols} />
          <RangeControl label="Grid Rows" max={90} min={12} onChange={(value) => setVoxel({ gridRows: value })} step={1} value={voxel.gridRows} />
          <RangeControl label="Cube Size" max={42} min={8} onChange={(value) => setVoxel({ cubeSize: value })} step={1} value={voxel.cubeSize} />
          <RangeControl label="Max Height" max={16} min={1} onChange={(value) => setVoxel({ maxHeight: value })} step={1} value={voxel.maxHeight} />
          <RangeControl label="Noise Scale" max={0.2} min={0.01} onChange={(value) => setVoxel({ noiseScale: value })} step={0.01} value={voxel.noiseScale} />
        </Panel>
      ) : null}

      <Panel title="Canvas">
        <label className="grid gap-2 uppercase">
          Canvas Size
          <select
            className="ds-select"
            onChange={(event) => setCanvasSize(Number(event.target.value))}
            value={canvas.width}
          >
            <option value={400}>400 Small</option>
            <option value={800}>800 Medium</option>
            <option value={1080}>1080 High</option>
          </select>
        </label>
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
          <label className="grid gap-2 uppercase">
            Background
            <input onChange={(event) => setPaletteField("background", event.target.value)} type="color" value={palette.background} />
          </label>
          <label className="grid gap-2 uppercase">
            Foreground
            <input onChange={(event) => setPaletteField("foreground", event.target.value)} type="color" value={palette.foreground} />
          </label>
        </div>
        <button className="ds-button" onClick={randomizePalette} type="button">
          Randomize Palette
        </button>
      </Panel>

      <Panel title="Presets">
        <div className="grid gap-2">
          {BUILT_IN_PRESETS.map((preset) => (
            <button className="ds-button" key={preset.name} onClick={() => loadPreset(preset.state)} type="button">
              {preset.name}
            </button>
          ))}
        </div>
        <button className="ds-button" onClick={() => downloadPreset(serializePreset(useAppStore.getState()))} type="button">
          Save JSON
        </button>
        <label className="grid gap-2 uppercase">
          Load JSON
          <input accept=".json,application/json" className="ds-file" onChange={(event) => void handlePresetUpload(event.target.files?.[0])} type="file" />
        </label>
      </Panel>
      {isAboutOpen ? (
        <div className="modal-backdrop">
          <div className="modal-panel">
            <h2 className="modal-title">Generative Shape Lab</h2>
            <p className="mt-3">
              Browser-based generative art tool using text, SVG, shaders, boids, dots, flow fields, and growth systems.
            </p>
            <button className="ds-button mt-4" onClick={() => setIsAboutOpen(false)} type="button">
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

function buttonClass(isActive: boolean): string {
  return `ds-button ${isActive ? "ds-button-active" : ""}`;
}

type PanelProps = {
  title: string;
  children: React.ReactNode;
};

function Panel({ title, children }: PanelProps) {
  return (
    <section className="ds-panel">
      <h2 className="ds-panel-title">{title}</h2>
      {children}
    </section>
  );
}

type RangeControlProps = {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
};

function RangeControl({ label, min, max, step, value, onChange }: RangeControlProps) {
  return (
    <label className="grid gap-2 uppercase">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <span>{value}</span>
      </span>
      <input
        className="ds-range"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
    </label>
  );
}
