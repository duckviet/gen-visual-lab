import type { AppState, Palette } from "@/shared/types/app";

export const PALETTE_STUDIO_DARK: Palette = {
  colors: ["#1a6b8a", "#c44d2a", "#e8b87a", "#6b3d7a", "#3d2a5c"],
  background: "#0a0a0f",
  foreground: "#e8b87a",
};

export const PALETTE_MOSAIC_WARM: Palette = {
  colors: ["#8b7355", "#c17f3a", "#6b5a3e", "#4a5568", "#2d3748"],
  background: "#1a1a2e",
  foreground: "#c17f3a",
};

export const PALETTE_TIGER_WAVE: Palette = {
  colors: ["#080400", "#c87820", "#e8a030", "#7a3d08", "#fff0b8"],
  background: "#080400",
  foreground: "#e8a030",
};

export const PALETTE_VOXEL: Palette = {
  colors: ["#5f8a8b", "#7aa6a8", "#d4907a", "#b86f5c", "#f5f0e8"],
  background: "#f5f0e8",
  foreground: "#1a1a1a",
};

export const PALETTE_WATERFALL: Palette = {
  colors: ["#1a4d33", "#0d3b28", "#2d7a4f", "#0a2218", "#5fad8a"],
  background: "#050f09",
  foreground: "#2d7a4f",
};

export const STANDARD_PALETTES: Palette[] = [
  PALETTE_STUDIO_DARK,
  {
    colors: ["#2E3440", "#3B4252", "#8FBCBB", "#88C0D0", "#E5E9F0"],
    background: "#1A1C23",
    foreground: "#ECEFF4",
  },
  {
    colors: ["#FF1493", "#FF4500", "#FFD700", "#4B0082", "#00FFFF"],
    background: "#0B0314",
    foreground: "#FFFFFF",
  },
  {
    colors: ["#FF007F", "#7F00FF", "#00FF7F", "#00FFFF", "#FFFF00"],
    background: "#030206",
    foreground: "#FDFDFD",
  },
  {
    colors: ["#2C3539", "#4A5240", "#828F76", "#BCE5AE", "#E8F0E2"],
    background: "#1E2219",
    foreground: "#E8F0E2",
  },
  {
    colors: ["#1C1C1C", "#8C7853", "#C5A880", "#EAD8C0", "#EAEAE8"],
    background: "#121212",
    foreground: "#F0EDE5",
  },
];

export const DEFAULT_APP_STATE: AppState = {
  mode: "custom",
  inputType: "text",
  isPlaying: true,
  resetToken: 0,
  targetPoints: [],
  canvas: {
    width: 800,
    height: 800,
    pixelRatio: typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2),
  },
  palette: PALETTE_STUDIO_DARK,
  boids: {
    count: 500,
    speed: 2.5,
    viewDistance: 50,
    separation: 1.5,
    alignment: 1,
    cohesion: 1,
    targetForce: 2,
    trail: 0.1,
    wrap: true,
  },
  shader: {
    preset: "liquid",
    speed: 1,
    distortion: 0.5,
    swirl: 1,
    grain: 0.15,
    seed: 42,
    symmetry: "none",
    stripeAngle: 45,
    stripeFrequency: 8,
    stripeWidth: 1.5,
    waveAmplitude: 0.15,
    waveFrequency: 3,
    glow: 0.6,
    voronoiSiteCount: 80,
    voronoiEdgeWidth: 0.008,
    voronoiGlowRadius: 0.03,
    voronoiGlowIntensity: 0.8,
  },
  text: {
    value: "SHAPE",
    fontFamily: "system-ui",
    fontSize: 100,
    showOutline: false,
  },
  svg: {
    fit: "contain",
    sampleMode: "outline",
    samplePoints: 1000,
  },
  flow: {
    particleCount: 1500,
    cellSize: 20,
    noiseScale: 0.01,
    turbulence: 1.5,
    trailLength: 0.92,
    speed: 3,
    renderer: "line",
    capsuleLength: 12,
    capsuleWidth: 3,
    blobRadius: 6,
    blobComplexity: 3,
    colorMode: "foreground",
    alpha: 0.75,
    centerAttractor: false,
  },
  growth: {
    stepSize: 5,
    branchAngle: 25,
    maxBranches: 2000,
    attractorCount: 800,
  },
  dots: {
    spacing: 18,
    influenceRadius: 90,
    strength: 1.4,
  },
  mosaic: {
    cellSize: 24,
    concentricLevels: 5,
    gapRatio: 0.15,
    borderWidth: 1,
  },
  voxel: {
    gridCols: 40,
    gridRows: 60,
    cubeSize: 24,
    maxHeight: 8,
    noiseScale: 0.08,
  },
};

export type BuiltInPreset = {
  name: string;
  state: AppState;
};

export const BUILT_IN_PRESETS: BuiltInPreset[] = [
  {
    name: "Classic Aurora",
    state: {
      ...DEFAULT_APP_STATE,
      mode: "custom",
      inputType: "text",
      palette: STANDARD_PALETTES[1],
      text: {
        ...DEFAULT_APP_STATE.text,
        value: "FLOCK",
        fontSize: 120,
      },
      boids: {
        ...DEFAULT_APP_STATE.boids,
        count: 800,
        viewDistance: 60,
        separation: 2,
        alignment: 1.2,
        cohesion: 0.8,
        targetForce: 1.5,
        trail: 0.08,
      },
    },
  },
  {
    name: "Cosmic Liquid",
    state: {
      ...DEFAULT_APP_STATE,
      mode: "shader",
      inputType: "none",
      palette: STANDARD_PALETTES[2],
      shader: {
        ...DEFAULT_APP_STATE.shader,
        preset: "liquid",
        speed: 1.4,
        distortion: 0.95,
        swirl: 1.3,
        grain: 0.22,
        seed: 1337,
      },
    },
  },
  {
    name: "Cyber Flow",
    state: {
      ...DEFAULT_APP_STATE,
      mode: "flow",
      inputType: "text",
      palette: STANDARD_PALETTES[3],
      text: {
        ...DEFAULT_APP_STATE.text,
        value: "CYBER",
        fontSize: 140,
      },
      flow: {
        ...DEFAULT_APP_STATE.flow,
        particleCount: 3500,
        noiseScale: 0.018,
        turbulence: 3.2,
        trailLength: 0.95,
        speed: 4.5,
      },
    },
  },
  {
    name: "Vortex Dashes",
    state: {
      ...DEFAULT_APP_STATE,
      mode: "flow",
      inputType: "none",
      palette: PALETTE_STUDIO_DARK,
      flow: {
        ...DEFAULT_APP_STATE.flow,
        particleCount: 8000,
        cellSize: 18,
        noiseScale: 0.012,
        turbulence: 2.5,
        trailLength: 1,
        speed: 1.8,
        renderer: "capsule",
        capsuleLength: 12,
        capsuleWidth: 3,
        colorMode: "palette-by-angle",
        alpha: 0.6,
        centerAttractor: true,
      },
    },
  },
  {
    name: "Dense Blob Vortex",
    state: {
      ...DEFAULT_APP_STATE,
      mode: "flow",
      inputType: "none",
      palette: PALETTE_STUDIO_DARK,
      flow: {
        ...DEFAULT_APP_STATE.flow,
        particleCount: 12000,
        cellSize: 18,
        noiseScale: 0.015,
        turbulence: 2,
        trailLength: 1,
        speed: 1.2,
        renderer: "blob",
        blobRadius: 6,
        blobComplexity: 3,
        colorMode: "palette-by-position",
        alpha: 0.5,
        centerAttractor: true,
      },
    },
  },
  {
    name: "Liquid Symmetry",
    state: {
      ...DEFAULT_APP_STATE,
      mode: "shader",
      inputType: "none",
      palette: PALETTE_STUDIO_DARK,
      shader: {
        ...DEFAULT_APP_STATE.shader,
        preset: "liquid",
        speed: 0.4,
        distortion: 3.5,
        swirl: 2,
        grain: 0,
        symmetry: "quad",
      },
      dots: {
        ...DEFAULT_APP_STATE.dots,
        spacing: 40,
      },
    },
  },
  {
    name: "Paint Swirl",
    state: {
      ...DEFAULT_APP_STATE,
      mode: "shader",
      inputType: "none",
      palette: PALETTE_STUDIO_DARK,
      shader: {
        ...DEFAULT_APP_STATE.shader,
        preset: "fluid-advection",
        speed: 0.6,
        distortion: 2,
        swirl: 3.5,
        grain: 0.02,
        symmetry: "none",
      },
    },
  },
  {
    name: "Tiger Wave",
    state: {
      ...DEFAULT_APP_STATE,
      mode: "shader",
      inputType: "none",
      palette: PALETTE_TIGER_WAVE,
      shader: {
        ...DEFAULT_APP_STATE.shader,
        preset: "tiger-wave",
        speed: 0.3,
        stripeAngle: 45,
        stripeFrequency: 8,
        stripeWidth: 1.5,
        waveAmplitude: 0.15,
        waveFrequency: 3,
        glow: 0.6,
        grain: 0.04,
      },
    },
  },
  {
    name: "Mosaic Squares",
    state: {
      ...DEFAULT_APP_STATE,
      mode: "mosaic",
      inputType: "none",
      palette: PALETTE_MOSAIC_WARM,
      mosaic: {
        cellSize: 24,
        concentricLevels: 5,
        gapRatio: 0.15,
        borderWidth: 1,
      },
    },
  },
  {
    name: "Voronoi Cells",
    state: {
      ...DEFAULT_APP_STATE,
      mode: "shader",
      inputType: "none",
      palette: {
        colors: ["#000000", "#1a1a1a", "#e8e8e8", "#ffffff", "#666666"],
        background: "#000000",
        foreground: "#e8e8e8",
      },
      shader: {
        ...DEFAULT_APP_STATE.shader,
        preset: "voronoi",
        speed: 0.2,
        grain: 0,
        voronoiSiteCount: 80,
        voronoiEdgeWidth: 0.008,
        voronoiGlowRadius: 0.03,
        voronoiGlowIntensity: 0.8,
      },
    },
  },
  {
    name: "Isometric Voxel",
    state: {
      ...DEFAULT_APP_STATE,
      mode: "voxel",
      inputType: "none",
      palette: PALETTE_VOXEL,
      voxel: {
        gridCols: 40,
        gridRows: 60,
        cubeSize: 24,
        maxHeight: 8,
        noiseScale: 0.08,
      },
    },
  },
  {
    name: "Waterfall",
    state: {
      ...DEFAULT_APP_STATE,
      mode: "shader",
      inputType: "none",
      palette: PALETTE_WATERFALL,
      shader: {
        ...DEFAULT_APP_STATE.shader,
        preset: "waterfall",
        speed: 1.0,
        grain: 0.05,
      },
    },
  },
];

export const FACTORY_PRESETS: AppState[] = BUILT_IN_PRESETS.map((preset) => preset.state);
