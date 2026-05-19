# UI Specification

This document details the exact controls, slider boundaries, step values, and default states for each user configuration panel in the **Generative Shape Lab** UI. All widgets and feature forms must implement these values strictly.

---

## 1. Global Canvas Settings

These controls live in the bottom or global section of the workspace controls.

| Control Label | Key | Type | Range / Options | Step | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Canvas Size** | `canvas.width` / `height` | Select | `400` (Small), `800` (Medium), `1080` (High) | — | `800` | Grid dimensions of both canvases. Renders square viewport. |
| **Pixel Ratio** | `canvas.pixelRatio` | Read-only | `1` or `2` (HiDPI) | — | `window.devicePixelRatio` | Canvas high-density scaling factor. |

---

## 2. Boids Settings (Custom / Dots Modes)

Used to configure flocking behavior.

| Slider Label | State Path | Range | Step | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Count** | `boids.count` | `10` – `5000` | `10` | `500` | Number of active boids simulation instances. |
| **Speed** | `boids.speed` | `0.5` – `10.0` | `0.1` | `2.5` | Maximum speed limit of individual boids. |
| **View Distance** | `boids.viewDistance` | `20` – `200` | `1` | `50` | Proximity radius for alignment/cohesion neighbors. |
| **Separation** | `boids.separation` | `0.0` – `5.0` | `0.1` | `1.5` | Force weight to steer away from close neighbors. |
| **Alignment** | `boids.alignment` | `0.0` – `5.0` | `0.1` | `1.0` | Force weight to match speed/heading of neighbors. |
| **Cohesion** | `boids.cohesion` | `0.0` – `5.0` | `0.1` | `1.0` | Force weight to move toward neighbor center of mass. |
| **Target Force** | `boids.targetForce` | `0.0` – `5.0` | `0.1` | `2.0` | Attraction strength pull toward the sampled points. |
| **Trail Fade** | `boids.trail` | `0.0` – `1.0` | `0.01` | `0.1` | Canvas 2D background alpha fade per frame. `0` = long trails, `1` = no trails. |
| **Wrap Boundaries** | `boids.wrap` | Toggle | — | `true` | `true` = wrap around edges, `false` = bounce off edges. |

---

## 3. Shader Settings (Shader Mode)

Configures WebGL custom background fragment shaders.

| Control Label | State Path | Type | Range / Options | Step | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Shader Preset** | `shader.preset` | Select | `"liquid"`, `"grain"`, `"terrain"`, `"fluid-advection"`, `"tiger-wave"`, `"voronoi"` | — | `"liquid"` | Active fragment shader source string. |
| **Symmetry** | `shader.symmetry` | Select | `"none"`, `"mirror"`, `"quad"`, `"radial"` | — | `"none"` | Symmetrical reflection transform mode. |
| **Flow Speed** | `shader.speed` | Slider | `0.0` – `3.0` | `0.05` | `1.0` | Temporal evolution speed (`u_time` scale). |
| **Distortion** | `shader.distortion` | Slider | `0.0` – `2.0` | `0.05` | `0.5` | Coordinate grid displacement scale (standard presets). |
| **Swirl Rate** | `shader.swirl` | Slider | `0.0` – `2.0` | `0.05` | `1.0` | Rotational matrix scale (standard presets). |
| **Noise Grain** | `shader.grain` | Slider | `0.0` – `1.0` | `0.01` | `0.15` | Film grain dithering opacity overlay. |
| **Stripe Angle** | `shader.stripeAngle` | Slider | `0` – `180` | `1` | `45` | Stripe orientation angle (Tiger Wave). |
| **Stripe Frequency** | `shader.stripeFrequency` | Slider | `1.0` – `32.0` | `0.5` | `8.0` | Density of generated stripes (Tiger Wave). |
| **Ridge Sharpness** | `shader.stripeWidth` | Slider | `0.3` – `3.0` | `0.1` | `1.5` | Exponent determining 3D peak sharp profiles (Tiger Wave). |
| **Wave Amplitude** | `shader.waveAmplitude` | Slider | `0.00` – `0.50` | `0.01` | `0.15` | Wave modulation curl amount (Tiger Wave). |
| **Wave Frequency** | `shader.waveFrequency` | Slider | `0.1` – `12.0` | `0.1` | `3.0` | Wave modulation curl speed/density (Tiger Wave). |
| **Glow Intensity** | `shader.glow` | Slider | `0.00` – `2.00` | `0.05` | `0.60` | Specular peak glow strength (Tiger Wave). |
| **Site Count** | `shader.voronoiSiteCount` | Slider | `10` – `120` | `1` | `80` | Number of Voronoi seed points (Voronoi). |
| **Edge Width** | `shader.voronoiEdgeWidth` | Slider | `0.001` – `0.050` | `0.001` | `0.008` | Width of Voronoi cell boundaries (Voronoi). |
| **Glow Radius** | `shader.voronoiGlowRadius` | Slider | `0.005` – `0.120` | `0.005` | `0.030` | Boundary glow falloff distance (Voronoi). |
| **Glow Intensity** | `shader.voronoiGlowIntensity` | Slider | `0.00` – `2.00` | `0.05` | `0.80` | Voronoi border glow multiplication factor (Voronoi). |

---

## 4. Input Source Settings

These panels toggle conditionally based on whether **Text** or **SVG** is selected.

### Text Settings (`inputType === "text"`)

| Control Label | State Path | Type | Range / Options | Step | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Text Value** | `text.value` | Input | Max 30 characters | — | `"SHAPE"` | The text characters sampled to point arrays. |
| **Font Family** | `text.fontFamily` | Select | `"system-ui"`, `"Custom Uploaded"` | — | `"system-ui"` | The selected font vector boundary. |
| **Font Size** | `text.fontSize` | Slider | `20` – `300` | `1` | `100` | Text bounding size rendered to vector path. |

### SVG Settings (`inputType === "svg"`)

| Control Label | State Path | Type | Range / Options | Step | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Fitting Mode** | `svg.fit` | Select | `"contain"`, `"cover"` | — | `"contain"` | Aspect ratio matching rule inside square canvas. |
| **Sample Density** | `svg.samplePoints` | Slider | `100` – `5000` | `50` | `1000` | Target length-sampled coordinates array size. |

---

## 5. Flow Field Settings (Flow Mode)

Configures Curl noise flow trail simulations.

| Slider Label | State Path | Range | Step | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Particle Count** | `flow.particleCount` | `100` – `5000` | `50` | `1500` | Quantity of floating flow-field trace lines. |
| **Noise Scale** | `flow.noiseScale` | `0.001` – `0.05` | `0.001` | `0.01` | Coordinates zooming factor for 2D noise. |
| **Turbulence** | `flow.turbulence` | `0.1` – `5.0` | `0.1` | `1.5` | Flow field vector directional weight multiplier. |
| **Trail Length** | `flow.trailLength` | `0.01` – `0.99` | `0.01` | `0.92` | Trail fade persistence overlay alpha multiplier. |
| **Flow Speed** | `flow.speed` | `0.5` – `10.0` | `0.1` | `3.0` | Tracer line speed modifier per frame. |

---

## 6. Growth Settings (Growth Mode)

Configures root vein structure extension simulations.

| Slider Label | State Path | Range | Step | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Step Size** | `growth.stepSize` | `1` – `20` | `1` | `5` | Length stride in pixels of new branch segment. |
| **Branch Angle** | `growth.branchAngle` | `5` – `90` | `1` | `25` | Directional mutation sweep angle of a split node. |
| **Max Branches** | `growth.maxBranches` | `100` – `10000` | `100` | `2000` | Safety limit of nodes before engine suspends. |
| **Attractors Count** | `growth.attractorCount` | `100` – `5000` | `50` | `800` | Number of seed nodes extracted from targetPoints. |

---

## 7. Palette Settings

Configures the generative colors system.

| Control Label | Key | Type | Description |
| :--- | :--- | :--- | :--- |
| **Swatches** | `palette.colors` | Array `[string, string, string, string, string]` | Five exact HEX color swatches mapped to WebGL color arrays and particle renderers. |
| **Background Color** | `palette.background` | HEX Input | Base flat background canvas color. Used for clear rect ticks. |
| **Foreground Color** | `palette.foreground` | HEX Input | Accent color for outline grids and vector typography indicators. |

### Built-in Standard Palettes
The Randomizer action selects randomly from these five balanced hex palettes:

1. **Nordic Aurora**
   - Swatches: `["#2E3440", "#3B4252", "#8FBCBB", "#88C0D0", "#E5E9F0"]`
   - Background: `"#1A1C23"` | Foreground: `"#ECEFF4"`
2. **Neon Sunset**
   - Swatches: `["#FF1493", "#FF4500", "#FFD700", "#4B0082", "#00FFFF"]`
   - Background: `"#0B0314"` | Foreground: `"#FFFFFF"`
3. **Cyberpunk Core**
   - Swatches: `["#FF007F", "#7F00FF", "#00FF7F", "#00FFFF", "#FFFF00"]`
   - Background: `"#030206"` | Foreground: `"#FDFDFD"`
4. **Earth & Moss**
   - Swatches: `["#2C3539", "#4A5240", "#828F76", "#BCE5AE", "#E8F0E2"]`
   - Background: `"#1E2219"` | Foreground: `"#E8F0E2"`
5. **Vintage Gold**
   - Swatches: `["#1C1C1C", "#8C7853", "#C5A880", "#EAD8C0", "#EAEAE8"]`
   - Background: `"#121212"` | Foreground: `"#F0EDE5"`
