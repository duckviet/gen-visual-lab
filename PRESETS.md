# Built-in Presets

This document specifies the exact JSON schemas and configuration properties for the three factory presets pre-loaded into [`default-presets.ts`](file:///home/duckviet/gen-visual-lab/src/entities/preset/config/default-presets.ts). 

All presets conform to the [`AppState`](file:///home/duckviet/gen-visual-lab/src/shared/types/app.ts) type interface, excluding large raw SVG uploaded source files.

---

## 1. Preset 1: "Classic Aurora Flocking"

- **Aesthetic**: Minimalist white vector particles swimming smoothly inside a dark, atmospheric Nordic deep-blue universe.
- **Engine / Mode**: `custom` (Boids engine with Canvas2D rendering).
- **Source**: Text input `"FLOCK"` using default system font.

```json
{
  "mode": "custom",
  "inputType": "text",
  "canvas": {
    "width": 800,
    "height": 800,
    "background": "#1A1C23"
  },
  "palette": {
    "colors": ["#2E3440", "#3B4252", "#8FBCBB", "#88C0D0", "#E5E9F0"],
    "background": "#1A1C23",
    "foreground": "#ECEFF4"
  },
  "boids": {
    "count": 800,
    "speed": 2.5,
    "viewDistance": 60,
    "separation": 2.0,
    "alignment": 1.2,
    "cohesion": 0.8,
    "targetForce": 1.5,
    "trail": 0.08,
    "wrap": true
  },
  "shader": {
    "preset": "liquid",
    "speed": 0.5,
    "distortion": 0.2,
    "swirl": 0.5,
    "grain": 0.05,
    "seed": 42
  },
  "text": {
    "value": "FLOCK",
    "fontFamily": "system-ui",
    "fontSize": 120
  },
  "svg": {
    "fit": "contain",
    "samplePoints": 1000
  },
  "flow": {
    "particleCount": 1500,
    "noiseScale": 0.01,
    "turbulence": 1.5,
    "trailLength": 0.92,
    "speed": 3.0
  },
  "growth": {
    "stepSize": 5,
    "branchAngle": 25,
    "maxBranches": 2000,
    "attractorCount": 800
  }
}
```

---

## 2. Preset 2: "Cosmic Liquid Fluid"

- **Aesthetic**: Psychedelic animated background blending magenta, orange, and purple hues with fine analog film grain.
- **Engine / Mode**: `shader` (WebGL fullscreen quad fragment shader background).
- **Source**: `none`.

```json
{
  "mode": "shader",
  "inputType": "none",
  "canvas": {
    "width": 800,
    "height": 800,
    "background": "#0B0314"
  },
  "palette": {
    "colors": ["#FF1493", "#FF4500", "#FFD700", "#4B0082", "#00FFFF"],
    "background": "#0B0314",
    "foreground": "#FFFFFF"
  },
  "boids": {
    "count": 500,
    "speed": 2.0,
    "viewDistance": 50,
    "separation": 1.5,
    "alignment": 1.0,
    "cohesion": 1.0,
    "targetForce": 2.0,
    "trail": 0.1,
    "wrap": true
  },
  "shader": {
    "preset": "liquid",
    "speed": 1.4,
    "distortion": 0.95,
    "swirl": 1.3,
    "grain": 0.22,
    "seed": 1337
  },
  "text": {
    "value": "SHADER",
    "fontFamily": "system-ui",
    "fontSize": 100
  },
  "svg": {
    "fit": "contain",
    "samplePoints": 1000
  },
  "flow": {
    "particleCount": 1500,
    "noiseScale": 0.01,
    "turbulence": 1.5,
    "trailLength": 0.92,
    "speed": 3.0
  },
  "growth": {
    "stepSize": 5,
    "branchAngle": 25,
    "maxBranches": 2000,
    "attractorCount": 800
  }
}
```

---

## 3. Preset 3: "Cyberpunk Attractor Trails"

- **Aesthetic**: Thousands of toxic green and cyan particles flowing along high-frequency Curl noise fields, tracing outlines of loaded vector boundaries.
- **Engine / Mode**: `flow` (Flow Field with high-frequency particle vector paths).
- **Source**: SVG uploaded source coordinates or default text `"CYBER"`.

```json
{
  "mode": "flow",
  "inputType": "text",
  "canvas": {
    "width": 800,
    "height": 800,
    "background": "#030206"
  },
  "palette": {
    "colors": ["#FF007F", "#7F00FF", "#00FF7F", "#00FFFF", "#FFFF00"],
    "background": "#030206",
    "foreground": "#FDFDFD"
  },
  "boids": {
    "count": 1000,
    "speed": 3.0,
    "viewDistance": 40,
    "separation": 1.0,
    "alignment": 1.5,
    "cohesion": 1.2,
    "targetForce": 2.5,
    "trail": 0.05,
    "wrap": true
  },
  "shader": {
    "preset": "grain",
    "speed": 0.8,
    "distortion": 0.4,
    "swirl": 0.8,
    "grain": 0.12,
    "seed": 888
  },
  "text": {
    "value": "CYBER",
    "fontFamily": "system-ui",
    "fontSize": 140
  },
  "svg": {
    "fit": "contain",
    "samplePoints": 1500
  },
  "flow": {
    "particleCount": 3500,
    "noiseScale": 0.018,
    "turbulence": 3.2,
    "trailLength": 0.95,
    "speed": 4.5
  },
  "growth": {
    "stepSize": 5,
    "branchAngle": 25,
    "maxBranches": 2000,
    "attractorCount": 800
  }
}
```
