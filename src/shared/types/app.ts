export type Mode = "custom" | "shader" | "dots" | "flow" | "growth" | "mosaic" | "voxel";

export type InputType = "text" | "svg" | "none";

export type ShaderPreset = "liquid" | "grain" | "terrain" | "fluid-advection" | "tiger-wave" | "voronoi" | "waterfall";

export type SymmetryMode = "none" | "mirror" | "quad" | "radial";

export type Vec2Like = {
  x: number;
  y: number;
};

export type CanvasSettings = {
  width: number;
  height: number;
  pixelRatio: number;
};

export type Palette = {
  colors: [string, string, string, string, string];
  background: string;
  foreground: string;
};

export type BoidSettings = {
  count: number;
  speed: number;
  viewDistance: number;
  separation: number;
  alignment: number;
  cohesion: number;
  targetForce: number;
  trail: number;
  wrap: boolean;
};

export type ShaderSettings = {
  preset: ShaderPreset;
  speed: number;
  distortion: number;
  swirl: number;
  grain: number;
  seed: number;
  symmetry: SymmetryMode;
  stripeAngle: number;
  stripeFrequency: number;
  stripeWidth: number;
  waveAmplitude: number;
  waveFrequency: number;
  glow: number;
  voronoiSiteCount: number;
  voronoiEdgeWidth: number;
  voronoiGlowRadius: number;
  voronoiGlowIntensity: number;
};

export type TextSettings = {
  value: string;
  fontFamily: "system-ui" | "custom";
  fontSize: number;
  showOutline: boolean;
  fontName?: string;
  fontBuffer?: ArrayBuffer;
};

export type SvgSettings = {
  fit: "contain" | "cover";
  sampleMode: "outline" | "fill";
  samplePoints: number;
  source?: string;
};

export type FlowSettings = {
  particleCount: number;
  cellSize: number;
  noiseScale: number;
  turbulence: number;
  trailLength: number;
  speed: number;
  renderer: "line" | "capsule" | "blob";
  capsuleLength: number;
  capsuleWidth: number;
  blobRadius: number;
  blobComplexity: number;
  colorMode: "palette-by-angle" | "palette-by-position" | "foreground";
  alpha: number;
  centerAttractor: boolean;
};

export type GrowthSettings = {
  stepSize: number;
  branchAngle: number;
  maxBranches: number;
  attractorCount: number;
};

export type DotsSettings = {
  spacing: number;
  influenceRadius: number;
  strength: number;
};

export type MosaicSettings = {
  cellSize: number;
  concentricLevels: number;
  gapRatio: number;
  borderWidth: number;
};

export type VoxelSettings = {
  gridCols: number;
  gridRows: number;
  cubeSize: number;
  maxHeight: number;
  noiseScale: number;
};

export type AppState = {
  mode: Mode;
  inputType: InputType;
  isPlaying: boolean;
  resetToken: number;
  targetPoints: Vec2Like[];
  canvas: CanvasSettings;
  palette: Palette;
  boids: BoidSettings;
  shader: ShaderSettings;
  text: TextSettings;
  svg: SvgSettings;
  flow: FlowSettings;
  growth: GrowthSettings;
  dots: DotsSettings;
  mosaic: MosaicSettings;
  voxel: VoxelSettings;
};

export type SerializableAppState = Omit<AppState, "targetPoints"> & {
  targetPoints?: Vec2Like[];
};

export interface GenerativeEngine {
  init(canvas: HTMLCanvasElement, getState: () => AppState): void;
  update(): void;
  destroy(): void;
}
