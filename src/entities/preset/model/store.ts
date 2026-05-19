import { create } from "zustand";
import { DEFAULT_APP_STATE, STANDARD_PALETTES } from "@/entities/preset/config/default-presets";
import type {
  AppState,
  BoidSettings,
  CanvasSettings,
  DotsSettings,
  FlowSettings,
  GrowthSettings,
  InputType,
  Mode,
  MosaicSettings,
  Palette,
  ShaderSettings,
  SvgSettings,
  TextSettings,
  Vec2Like,
  VoxelSettings,
} from "@/shared/types/app";

type AppActions = {
  setMode: (mode: Mode) => void;
  setInputType: (inputType: InputType) => void;
  setCanvasSize: (size: number) => void;
  setPalette: (palette: Palette) => void;
  setPaletteColor: (index: number, color: string) => void;
  setPaletteField: (field: "background" | "foreground", color: string) => void;
  randomizePalette: () => void;
  setBoids: (settings: Partial<BoidSettings>) => void;
  setShader: (settings: Partial<ShaderSettings>) => void;
  setText: (settings: Partial<TextSettings>) => void;
  setSvg: (settings: Partial<SvgSettings>) => void;
  setFlow: (settings: Partial<FlowSettings>) => void;
  setGrowth: (settings: Partial<GrowthSettings>) => void;
  setDots: (settings: Partial<DotsSettings>) => void;
  setMosaic: (settings: Partial<MosaicSettings>) => void;
  setVoxel: (settings: Partial<VoxelSettings>) => void;
  setTargetPoints: (targetPoints: Vec2Like[]) => void;
  loadPreset: (preset: Partial<AppState>) => void;
  togglePlaying: () => void;
  reset: () => void;
};

export type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>((set) => ({
  ...DEFAULT_APP_STATE,
  setMode: (mode) =>
    set(() => ({
      mode,
      inputType: mode === "shader" || mode === "mosaic" || mode === "voxel" ? "none" : "text",
    })),
  setInputType: (inputType) => set(() => ({ inputType })),
  setCanvasSize: (size) =>
    set((state) => ({
      canvas: {
        ...state.canvas,
        width: size,
        height: size,
      } satisfies CanvasSettings,
      resetToken: state.resetToken + 1,
    })),
  setPalette: (palette) => set(() => ({ palette })),
  setPaletteColor: (index, color) =>
    set((state) => {
      const colors = [...state.palette.colors] as Palette["colors"];
      colors[index] = color;
      return {
        palette: {
          ...state.palette,
          colors,
        },
      };
    }),
  setPaletteField: (field, color) =>
    set((state) => ({
      palette: {
        ...state.palette,
        [field]: color,
      },
    })),
  randomizePalette: () =>
    set(() => ({
      palette: STANDARD_PALETTES[Math.floor(Math.random() * STANDARD_PALETTES.length)],
    })),
  setBoids: (settings) =>
    set((state) => ({
      boids: {
        ...state.boids,
        ...settings,
      },
    })),
  setShader: (settings) =>
    set((state) => ({
      shader: {
        ...state.shader,
        ...settings,
      },
    })),
  setText: (settings) =>
    set((state) => ({
      text: {
        ...state.text,
        ...settings,
      },
    })),
  setSvg: (settings) =>
    set((state) => ({
      svg: {
        ...state.svg,
        ...settings,
      },
    })),
  setFlow: (settings) =>
    set((state) => ({
      flow: {
        ...state.flow,
        ...settings,
      },
    })),
  setGrowth: (settings) =>
    set((state) => ({
      growth: {
        ...state.growth,
        ...settings,
      },
    })),
  setDots: (settings) =>
    set((state) => ({
      dots: {
        ...state.dots,
        ...settings,
      },
    })),
  setMosaic: (settings) =>
    set((state) => ({
      mosaic: {
        ...state.mosaic,
        ...settings,
      },
    })),
  setVoxel: (settings) =>
    set((state) => ({
      voxel: {
        ...state.voxel,
        ...settings,
      },
    })),
  setTargetPoints: (targetPoints) => set(() => ({ targetPoints })),
  loadPreset: (preset) =>
    set((state) => ({
      ...state,
      ...preset,
      canvas: { ...state.canvas, ...preset.canvas },
      palette: preset.palette ?? state.palette,
      boids: { ...state.boids, ...preset.boids },
      shader: { ...state.shader, ...preset.shader },
      text: { ...state.text, ...preset.text, fontBuffer: state.text.fontBuffer },
      svg: { ...state.svg, ...preset.svg },
      flow: { ...state.flow, ...preset.flow },
      growth: { ...state.growth, ...preset.growth },
      dots: { ...state.dots, ...preset.dots },
      mosaic: { ...state.mosaic, ...preset.mosaic },
      voxel: { ...state.voxel, ...preset.voxel },
      targetPoints: [],
      resetToken: state.resetToken + 1,
    })),
  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
  reset: () => set((state) => ({ resetToken: state.resetToken + 1 })),
}));
