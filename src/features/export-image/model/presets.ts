import { DEFAULT_APP_STATE } from "@/entities/preset/config/default-presets";
import type { AppState, InputType, Mode, SerializableAppState, ShaderPreset } from "@/shared/types/app";

export function serializePreset(state: AppState): string {
  const preset: SerializableAppState = {
    ...state,
    targetPoints: undefined,
    svg: {
      ...state.svg,
      source: state.svg.source && state.svg.source.length <= 100_000 ? state.svg.source : undefined,
    },
    text: {
      ...state.text,
      fontBuffer: undefined,
    },
  };

  return JSON.stringify(preset, null, 2);
}

export function downloadPreset(json: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "generative-shape-lab-preset.json";
  link.click();
  URL.revokeObjectURL(url);
}

export function parsePreset(value: string): Partial<AppState> {
  const parsed = JSON.parse(value) as unknown;
  if (!isRecord(parsed)) {
    throw new Error("Preset file is not a JSON object");
  }

  return validatePreset(parsed);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validatePreset(value: Record<string, unknown>): Partial<AppState> {
  const preset: Partial<AppState> = {};

  if (isMode(value.mode)) preset.mode = value.mode;
  if (isInputType(value.inputType)) preset.inputType = value.inputType;
  if (typeof value.isPlaying === "boolean") preset.isPlaying = value.isPlaying;

  if (isRecord(value.canvas)) {
    preset.canvas = {
      ...DEFAULT_APP_STATE.canvas,
      width: numberIn(value.canvas.width, [400, 800, 1080], DEFAULT_APP_STATE.canvas.width),
      height: numberIn(value.canvas.height, [400, 800, 1080], DEFAULT_APP_STATE.canvas.height),
      pixelRatio: numberRange(value.canvas.pixelRatio, 1, 2, DEFAULT_APP_STATE.canvas.pixelRatio),
    };
  }

  if (isRecord(value.palette) && Array.isArray(value.palette.colors) && value.palette.colors.length === 5) {
    const colors = value.palette.colors.map((color) => (isHex(color) ? color : "#FFFFFF")) as AppState["palette"]["colors"];
    preset.palette = {
      colors,
      background: isHex(value.palette.background) ? value.palette.background : DEFAULT_APP_STATE.palette.background,
      foreground: isHex(value.palette.foreground) ? value.palette.foreground : DEFAULT_APP_STATE.palette.foreground,
    };
  }

  if (isRecord(value.boids)) {
    preset.boids = {
      ...DEFAULT_APP_STATE.boids,
      count: numberRange(value.boids.count, 10, 5000, DEFAULT_APP_STATE.boids.count),
      speed: numberRange(value.boids.speed, 0.5, 10, DEFAULT_APP_STATE.boids.speed),
      viewDistance: numberRange(value.boids.viewDistance, 20, 200, DEFAULT_APP_STATE.boids.viewDistance),
      separation: numberRange(value.boids.separation, 0, 5, DEFAULT_APP_STATE.boids.separation),
      alignment: numberRange(value.boids.alignment, 0, 5, DEFAULT_APP_STATE.boids.alignment),
      cohesion: numberRange(value.boids.cohesion, 0, 5, DEFAULT_APP_STATE.boids.cohesion),
      targetForce: numberRange(value.boids.targetForce, 0, 5, DEFAULT_APP_STATE.boids.targetForce),
      trail: numberRange(value.boids.trail, 0, 1, DEFAULT_APP_STATE.boids.trail),
      wrap: typeof value.boids.wrap === "boolean" ? value.boids.wrap : DEFAULT_APP_STATE.boids.wrap,
    };
  }

  if (isRecord(value.shader)) {
    preset.shader = {
      ...DEFAULT_APP_STATE.shader,
      preset: isShaderPreset(value.shader.preset) ? value.shader.preset : DEFAULT_APP_STATE.shader.preset,
      speed: numberRange(value.shader.speed, 0, 3, DEFAULT_APP_STATE.shader.speed),
      distortion: numberRange(value.shader.distortion, 0, 2, DEFAULT_APP_STATE.shader.distortion),
      swirl: numberRange(value.shader.swirl, 0, 2, DEFAULT_APP_STATE.shader.swirl),
      grain: numberRange(value.shader.grain, 0, 1, DEFAULT_APP_STATE.shader.grain),
      seed: numberRange(value.shader.seed, 0, 100000, DEFAULT_APP_STATE.shader.seed),
      symmetry: value.shader.symmetry === "mirror" || value.shader.symmetry === "quad" || value.shader.symmetry === "radial" ? value.shader.symmetry : "none",
      stripeAngle: numberRange(value.shader.stripeAngle, 0, 180, DEFAULT_APP_STATE.shader.stripeAngle),
      stripeFrequency: numberRange(value.shader.stripeFrequency, 1, 32, DEFAULT_APP_STATE.shader.stripeFrequency),
      stripeWidth: numberRange(value.shader.stripeWidth, 0.3, 3.0, DEFAULT_APP_STATE.shader.stripeWidth),
      waveAmplitude: numberRange(value.shader.waveAmplitude, 0, 0.5, DEFAULT_APP_STATE.shader.waveAmplitude),
      waveFrequency: numberRange(value.shader.waveFrequency, 0.1, 12, DEFAULT_APP_STATE.shader.waveFrequency),
      glow: numberRange(value.shader.glow, 0, 2, DEFAULT_APP_STATE.shader.glow),
      voronoiSiteCount: numberRange(value.shader.voronoiSiteCount, 10, 120, DEFAULT_APP_STATE.shader.voronoiSiteCount),
      voronoiEdgeWidth: numberRange(value.shader.voronoiEdgeWidth, 0.001, 0.05, DEFAULT_APP_STATE.shader.voronoiEdgeWidth),
      voronoiEdgeSoftness: numberRange(value.shader.voronoiEdgeSoftness, 0, 0.03, DEFAULT_APP_STATE.shader.voronoiEdgeSoftness),
      voronoiGlowRadius: numberRange(value.shader.voronoiGlowRadius, 0.005, 0.12, DEFAULT_APP_STATE.shader.voronoiGlowRadius),
      voronoiGlowIntensity: numberRange(value.shader.voronoiGlowIntensity, 0, 2, DEFAULT_APP_STATE.shader.voronoiGlowIntensity),
      voronoiWarpStrength: numberRange(value.shader.voronoiWarpStrength, 0, 0.12, DEFAULT_APP_STATE.shader.voronoiWarpStrength),
      voronoiWarpScale: numberRange(value.shader.voronoiWarpScale, 0.5, 16, DEFAULT_APP_STATE.shader.voronoiWarpScale),
      voronoiThicknessVariation: numberRange(value.shader.voronoiThicknessVariation, 0, 1, DEFAULT_APP_STATE.shader.voronoiThicknessVariation),
      voronoiJunctionBoost: numberRange(value.shader.voronoiJunctionBoost, 0, 2, DEFAULT_APP_STATE.shader.voronoiJunctionBoost),
      voronoiContrast: numberRange(value.shader.voronoiContrast, 0.2, 3, DEFAULT_APP_STATE.shader.voronoiContrast),
    };
  }

  if (isRecord(value.text)) {
    preset.text = {
      ...DEFAULT_APP_STATE.text,
      value: typeof value.text.value === "string" ? value.text.value.slice(0, 30) : DEFAULT_APP_STATE.text.value,
      fontFamily: "system-ui",
      fontSize: numberRange(value.text.fontSize, 20, 300, DEFAULT_APP_STATE.text.fontSize),
      showOutline: typeof value.text.showOutline === "boolean" ? value.text.showOutline : DEFAULT_APP_STATE.text.showOutline,
    };
  }

  if (isRecord(value.svg)) {
    preset.svg = {
      ...DEFAULT_APP_STATE.svg,
      fit: value.svg.fit === "cover" ? "cover" : "contain",
      sampleMode: value.svg.sampleMode === "fill" ? "fill" : "outline",
      samplePoints: numberRange(value.svg.samplePoints, 100, 5000, DEFAULT_APP_STATE.svg.samplePoints),
      source: typeof value.svg.source === "string" && value.svg.source.length <= 100_000 ? value.svg.source : undefined,
    };
  }

  if (isRecord(value.flow)) {
    preset.flow = {
      particleCount: numberRange(value.flow.particleCount, 100, 12000, DEFAULT_APP_STATE.flow.particleCount),
      cellSize: numberRange(value.flow.cellSize, 8, 64, DEFAULT_APP_STATE.flow.cellSize),
      noiseScale: numberRange(value.flow.noiseScale, 0.001, 0.05, DEFAULT_APP_STATE.flow.noiseScale),
      turbulence: numberRange(value.flow.turbulence, 0.1, 5, DEFAULT_APP_STATE.flow.turbulence),
      trailLength: numberRange(value.flow.trailLength, 0.01, 0.99, DEFAULT_APP_STATE.flow.trailLength),
      speed: numberRange(value.flow.speed, 0.5, 10, DEFAULT_APP_STATE.flow.speed),
      renderer: value.flow.renderer === "capsule" || value.flow.renderer === "blob" ? value.flow.renderer : "line",
      capsuleLength: numberRange(value.flow.capsuleLength, 2, 40, DEFAULT_APP_STATE.flow.capsuleLength),
      capsuleWidth: numberRange(value.flow.capsuleWidth, 1, 16, DEFAULT_APP_STATE.flow.capsuleWidth),
      blobRadius: numberRange(value.flow.blobRadius, 1, 24, DEFAULT_APP_STATE.flow.blobRadius),
      blobComplexity: numberRange(value.flow.blobComplexity, 1, 8, DEFAULT_APP_STATE.flow.blobComplexity),
      colorMode:
        value.flow.colorMode === "palette-by-angle" || value.flow.colorMode === "palette-by-position"
          ? value.flow.colorMode
          : DEFAULT_APP_STATE.flow.colorMode,
      alpha: numberRange(value.flow.alpha, 0.05, 1, DEFAULT_APP_STATE.flow.alpha),
      centerAttractor: typeof value.flow.centerAttractor === "boolean" ? value.flow.centerAttractor : DEFAULT_APP_STATE.flow.centerAttractor,
    };
  }

  if (isRecord(value.growth)) {
    preset.growth = {
      style: value.growth.style === "botanical" || value.growth.style === "vein" ? value.growth.style : DEFAULT_APP_STATE.growth.style,
      layout: value.growth.layout === "ornament-frame" || value.growth.layout === "target" ? value.growth.layout : DEFAULT_APP_STATE.growth.layout,
      stepSize: numberRange(value.growth.stepSize, 1, 20, DEFAULT_APP_STATE.growth.stepSize),
      branchAngle: numberRange(value.growth.branchAngle, 5, 90, DEFAULT_APP_STATE.growth.branchAngle),
      maxBranches: numberRange(value.growth.maxBranches, 100, 10000, DEFAULT_APP_STATE.growth.maxBranches),
      attractorCount: numberRange(value.growth.attractorCount, 100, 5000, DEFAULT_APP_STATE.growth.attractorCount),
      leafDensity: numberRange(value.growth.leafDensity, 0, 1, DEFAULT_APP_STATE.growth.leafDensity),
      flowerDensity: numberRange(value.growth.flowerDensity, 0, 1, DEFAULT_APP_STATE.growth.flowerDensity),
      lineWidth: numberRange(value.growth.lineWidth, 0.5, 4, DEFAULT_APP_STATE.growth.lineWidth),
    };
  }

  if (isRecord(value.mosaic)) {
    preset.mosaic = {
      cellSize: numberRange(value.mosaic.cellSize, 4, 64, DEFAULT_APP_STATE.mosaic.cellSize),
      concentricLevels: numberRange(value.mosaic.concentricLevels, 1, 9, DEFAULT_APP_STATE.mosaic.concentricLevels),
      gapRatio: numberRange(value.mosaic.gapRatio, 0.02, 0.35, DEFAULT_APP_STATE.mosaic.gapRatio),
      borderWidth: numberRange(value.mosaic.borderWidth, 0, 4, DEFAULT_APP_STATE.mosaic.borderWidth),
    };
  }

  if (isRecord(value.voxel)) {
    preset.voxel = {
      gridCols: numberRange(value.voxel.gridCols, 12, 70, DEFAULT_APP_STATE.voxel.gridCols),
      gridRows: numberRange(value.voxel.gridRows, 12, 90, DEFAULT_APP_STATE.voxel.gridRows),
      cubeSize: numberRange(value.voxel.cubeSize, 8, 42, DEFAULT_APP_STATE.voxel.cubeSize),
      maxHeight: numberRange(value.voxel.maxHeight, 1, 16, DEFAULT_APP_STATE.voxel.maxHeight),
      noiseScale: numberRange(value.voxel.noiseScale, 0.01, 0.2, DEFAULT_APP_STATE.voxel.noiseScale),
    };
  }

  return preset;
}

function numberRange(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function numberIn(value: unknown, options: number[], fallback: number): number {
  return typeof value === "number" && options.includes(value) ? value : fallback;
}

function isHex(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

function isMode(value: unknown): value is Mode {
  return value === "custom" || value === "shader" || value === "dots" || value === "flow" || value === "growth" || value === "mosaic" || value === "voxel";
}

function isInputType(value: unknown): value is InputType {
  return value === "text" || value === "svg" || value === "none";
}

function isShaderPreset(value: unknown): value is ShaderPreset {
  return (
    value === "liquid" ||
    value === "grain" ||
    value === "terrain" ||
    value === "fluid-advection" ||
    value === "tiger-wave" ||
    value === "voronoi" ||
    value === "waterfall" ||
    value === "ocean-shore" ||
    value === "botanical-wash" ||
    value === "teal-gold-wash"
  );
}
