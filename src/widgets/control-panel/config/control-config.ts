import type { AppStore } from "@/entities/preset/model/store";
import type {
  BoidSettings,
  DotsSettings,
  FlowSettings,
  GrowthSettings,
  InputType,
  Mode,
  MosaicSettings,
  ShaderPreset,
  ShaderSettings,
  SymmetryMode,
  VoxelSettings,
} from "@/shared/types/app";

export type Option<T extends string | number> = {
  label: string;
  value: T;
};

export type ModeOption = Option<Mode> & {
  disabled?: boolean;
};

export type RangeConfig = {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
};

export const MODE_OPTIONS: ModeOption[] = [
  { label: "Custom", value: "custom" },
  { label: "Shader", value: "shader" },
  { label: "Dots", value: "dots" },
  { label: "Flow", value: "flow" },
  { label: "Growth", value: "growth" },
  { label: "Mosaic", value: "mosaic" },
  { label: "Voxel", value: "voxel" },
];

export const SOURCE_OPTIONS: Option<InputType>[] = [
  { label: "Text", value: "text" },
  { label: "SVG", value: "svg" },
];

export const SHADER_PRESET_OPTIONS: Option<ShaderPreset>[] = [
  { label: "Liquid", value: "liquid" },
  { label: "Grain", value: "grain" },
  { label: "Terrain", value: "terrain" },
  { label: "Fluid Advection", value: "fluid-advection" },
  { label: "Tiger Wave", value: "tiger-wave" },
  { label: "Voronoi", value: "voronoi" },
  { label: "Waterfall", value: "waterfall" },
  { label: "Ocean Shore", value: "ocean-shore" },
  { label: "Botanical Wash", value: "botanical-wash" },
  { label: "Teal Gold Wash", value: "teal-gold-wash" },
];

export const SYMMETRY_OPTIONS: Option<SymmetryMode>[] = [
  { label: "None", value: "none" },
  { label: "Mirror", value: "mirror" },
  { label: "Quad", value: "quad" },
  { label: "Radial", value: "radial" },
];

export const GROWTH_STYLE_OPTIONS: Option<GrowthSettings["style"]>[] = [
  { label: "Vein", value: "vein" },
  { label: "Botanical", value: "botanical" },
];

export const GROWTH_LAYOUT_OPTIONS: Option<GrowthSettings["layout"]>[] = [
  { label: "Target", value: "target" },
  { label: "Ornament Frame", value: "ornament-frame" },
];

export const SVG_SAMPLE_OPTIONS: Option<"outline" | "fill">[] = [
  { label: "Outline", value: "outline" },
  { label: "Fill", value: "fill" },
];

export const SVG_FIT_OPTIONS: Option<"contain" | "cover">[] = [
  { label: "Contain", value: "contain" },
  { label: "Cover", value: "cover" },
];

export const CANVAS_SIZE_OPTIONS: Option<number>[] = [
  { label: "400 Small", value: 400 },
  { label: "800 Medium", value: 800 },
  { label: "1080 High", value: 1080 },
];

export function getShaderControls(shader: ShaderSettings, setShader: AppStore["setShader"]): RangeConfig[] {
  const baseControls: RangeConfig[] = [
    { label: "Flow Speed", max: 3, min: 0, onChange: (value) => setShader({ speed: value }), step: 0.05, value: shader.speed },
  ];

  if (shader.preset === "tiger-wave") {
    return [
      ...baseControls,
      { label: "Stripe Angle", max: 180, min: 0, onChange: (value) => setShader({ stripeAngle: value }), step: 1, value: shader.stripeAngle },
      { label: "Stripe Frequency", max: 32, min: 1, onChange: (value) => setShader({ stripeFrequency: value }), step: 0.5, value: shader.stripeFrequency },
      { label: "Ridge Sharpness", max: 3.0, min: 0.3, onChange: (value) => setShader({ stripeWidth: value }), step: 0.1, value: shader.stripeWidth },
      { label: "Wave Amplitude", max: 0.5, min: 0, onChange: (value) => setShader({ waveAmplitude: value }), step: 0.01, value: shader.waveAmplitude },
      { label: "Wave Frequency", max: 12.0, min: 0.1, onChange: (value) => setShader({ waveFrequency: value }), step: 0.1, value: shader.waveFrequency },
      { label: "Glow Intensity", max: 2.0, min: 0, onChange: (value) => setShader({ glow: value }), step: 0.05, value: shader.glow },
      { label: "Noise Grain", max: 1, min: 0, onChange: (value) => setShader({ grain: value }), step: 0.01, value: shader.grain },
    ];
  }

  if (shader.preset === "voronoi") {
    return [
      ...baseControls,
      { label: "Site Count", max: 120, min: 10, onChange: (value) => setShader({ voronoiSiteCount: value }), step: 1, value: shader.voronoiSiteCount },
      { label: "Edge Width", max: 0.05, min: 0.001, onChange: (value) => setShader({ voronoiEdgeWidth: value }), step: 0.001, value: shader.voronoiEdgeWidth },
      { label: "Edge Softness", max: 0.03, min: 0, onChange: (value) => setShader({ voronoiEdgeSoftness: value }), step: 0.001, value: shader.voronoiEdgeSoftness },
      { label: "Glow Radius", max: 0.12, min: 0.005, onChange: (value) => setShader({ voronoiGlowRadius: value }), step: 0.005, value: shader.voronoiGlowRadius },
      { label: "Glow Intensity", max: 2.0, min: 0, onChange: (value) => setShader({ voronoiGlowIntensity: value }), step: 0.05, value: shader.voronoiGlowIntensity },
      { label: "Warp Strength", max: 0.12, min: 0, onChange: (value) => setShader({ voronoiWarpStrength: value }), step: 0.005, value: shader.voronoiWarpStrength },
      { label: "Warp Scale", max: 16, min: 0.5, onChange: (value) => setShader({ voronoiWarpScale: value }), step: 0.5, value: shader.voronoiWarpScale },
      { label: "Thickness Var", max: 1, min: 0, onChange: (value) => setShader({ voronoiThicknessVariation: value }), step: 0.05, value: shader.voronoiThicknessVariation },
      { label: "Junction Boost", max: 2, min: 0, onChange: (value) => setShader({ voronoiJunctionBoost: value }), step: 0.05, value: shader.voronoiJunctionBoost },
      { label: "Contrast", max: 3, min: 0.2, onChange: (value) => setShader({ voronoiContrast: value }), step: 0.05, value: shader.voronoiContrast },
      { label: "Grain", max: 0.2, min: 0, onChange: (value) => setShader({ grain: value }), step: 0.005, value: shader.grain },
    ];
  }

  if (shader.preset === "botanical-wash" || shader.preset === "teal-gold-wash") {
    return [
      ...baseControls,
      { label: "Distortion", max: 2, min: 0, onChange: (value) => setShader({ distortion: value }), step: 0.05, value: shader.distortion },
      { label: "Sharpness", max: 1.5, min: 0, onChange: (value) => setShader({ glow: value }), step: 0.05, value: shader.glow },
      { label: "Swirl Rate", max: 2, min: 0, onChange: (value) => setShader({ swirl: value }), step: 0.05, value: shader.swirl },
      { label: "Noise Grain", max: 1, min: 0, onChange: (value) => setShader({ grain: value }), step: 0.01, value: shader.grain },
    ];
  }

  return [
    ...baseControls,
    { label: "Distortion", max: 2, min: 0, onChange: (value) => setShader({ distortion: value }), step: 0.05, value: shader.distortion },
    { label: "Swirl Rate", max: 2, min: 0, onChange: (value) => setShader({ swirl: value }), step: 0.05, value: shader.swirl },
    { label: "Noise Grain", max: 1, min: 0, onChange: (value) => setShader({ grain: value }), step: 0.01, value: shader.grain },
  ];
}

export function getBoidControls(boids: BoidSettings, setBoids: AppStore["setBoids"]): RangeConfig[] {
  return [
    { label: "Count", max: 5000, min: 10, onChange: (value) => setBoids({ count: value }), step: 10, value: boids.count },
    { label: "Speed", max: 10, min: 0.5, onChange: (value) => setBoids({ speed: value }), step: 0.1, value: boids.speed },
    { label: "View Distance", max: 200, min: 20, onChange: (value) => setBoids({ viewDistance: value }), step: 1, value: boids.viewDistance },
    { label: "Separation", max: 5, min: 0, onChange: (value) => setBoids({ separation: value }), step: 0.1, value: boids.separation },
    { label: "Alignment", max: 5, min: 0, onChange: (value) => setBoids({ alignment: value }), step: 0.1, value: boids.alignment },
    { label: "Cohesion", max: 5, min: 0, onChange: (value) => setBoids({ cohesion: value }), step: 0.1, value: boids.cohesion },
    { label: "Target Force", max: 5, min: 0, onChange: (value) => setBoids({ targetForce: value }), step: 0.1, value: boids.targetForce },
    { label: "Trail Fade", max: 1, min: 0, onChange: (value) => setBoids({ trail: value }), step: 0.01, value: boids.trail },
  ];
}

export function getDotsControls(dots: DotsSettings, setDots: AppStore["setDots"]): RangeConfig[] {
  return [
    { label: "Spacing", max: 44, min: 8, onChange: (value) => setDots({ spacing: value }), step: 1, value: dots.spacing },
    { label: "Influence Radius", max: 180, min: 20, onChange: (value) => setDots({ influenceRadius: value }), step: 1, value: dots.influenceRadius },
    { label: "Strength", max: 4, min: 0.2, onChange: (value) => setDots({ strength: value }), step: 0.1, value: dots.strength },
  ];
}

export function getFlowControls(flow: FlowSettings, setFlow: AppStore["setFlow"]): RangeConfig[] {
  return [
    { label: "Particle Count", max: 12000, min: 100, onChange: (value) => setFlow({ particleCount: value }), step: 50, value: flow.particleCount },
    { label: "Cell Size", max: 64, min: 8, onChange: (value) => setFlow({ cellSize: value }), step: 1, value: flow.cellSize },
    { label: "Noise Scale", max: 0.05, min: 0.001, onChange: (value) => setFlow({ noiseScale: value }), step: 0.001, value: flow.noiseScale },
    { label: "Turbulence", max: 5, min: 0.1, onChange: (value) => setFlow({ turbulence: value }), step: 0.1, value: flow.turbulence },
    { label: "Trail Length", max: 0.99, min: 0.01, onChange: (value) => setFlow({ trailLength: value }), step: 0.01, value: flow.trailLength },
    { label: "Flow Speed", max: 10, min: 0.5, onChange: (value) => setFlow({ speed: value }), step: 0.1, value: flow.speed },
  ];
}

export function getGrowthControls(growth: GrowthSettings, setGrowth: AppStore["setGrowth"]): RangeConfig[] {
  const controls: RangeConfig[] = [
    { label: "Step Size", max: 20, min: 1, onChange: (value) => setGrowth({ stepSize: value }), step: 1, value: growth.stepSize },
    { label: "Branch Angle", max: 90, min: 5, onChange: (value) => setGrowth({ branchAngle: value }), step: 1, value: growth.branchAngle },
    { label: "Max Branches", max: 10000, min: 100, onChange: (value) => setGrowth({ maxBranches: value }), step: 100, value: growth.maxBranches },
    { label: "Attractors Count", max: 5000, min: 100, onChange: (value) => setGrowth({ attractorCount: value }), step: 50, value: growth.attractorCount },
  ];

  if (growth.style !== "botanical") {
    return controls;
  }

  return [
    ...controls,
    { label: "Leaf Density", max: 1, min: 0, onChange: (value) => setGrowth({ leafDensity: value }), step: 0.01, value: growth.leafDensity },
    { label: "Flower Density", max: 1, min: 0, onChange: (value) => setGrowth({ flowerDensity: value }), step: 0.01, value: growth.flowerDensity },
    { label: "Line Width", max: 4, min: 0.5, onChange: (value) => setGrowth({ lineWidth: value }), step: 0.1, value: growth.lineWidth },
  ];
}

export function getMosaicControls(mosaic: MosaicSettings, setMosaic: AppStore["setMosaic"]): RangeConfig[] {
  return [
    { label: "Cell Size", max: 64, min: 4, onChange: (value) => setMosaic({ cellSize: value }), step: 1, value: mosaic.cellSize },
    { label: "Levels", max: 9, min: 1, onChange: (value) => setMosaic({ concentricLevels: value }), step: 1, value: mosaic.concentricLevels },
    { label: "Gap Ratio", max: 0.35, min: 0.02, onChange: (value) => setMosaic({ gapRatio: value }), step: 0.01, value: mosaic.gapRatio },
    { label: "Border Width", max: 4, min: 0, onChange: (value) => setMosaic({ borderWidth: value }), step: 0.5, value: mosaic.borderWidth },
  ];
}

export function getVoxelControls(voxel: VoxelSettings, setVoxel: AppStore["setVoxel"]): RangeConfig[] {
  return [
    { label: "Grid Cols", max: 70, min: 12, onChange: (value) => setVoxel({ gridCols: value }), step: 1, value: voxel.gridCols },
    { label: "Grid Rows", max: 90, min: 12, onChange: (value) => setVoxel({ gridRows: value }), step: 1, value: voxel.gridRows },
    { label: "Cube Size", max: 42, min: 8, onChange: (value) => setVoxel({ cubeSize: value }), step: 1, value: voxel.cubeSize },
    { label: "Max Height", max: 16, min: 1, onChange: (value) => setVoxel({ maxHeight: value }), step: 1, value: voxel.maxHeight },
    { label: "Noise Scale", max: 0.2, min: 0.01, onChange: (value) => setVoxel({ noiseScale: value }), step: 0.01, value: voxel.noiseScale },
  ];
}
