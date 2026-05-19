---
name: boids-engine
description: Use this skill when the user asks to build, modify, optimize, debug, or configure 2D flocking particle simulations, social behavior algorithms (separation, alignment, cohesion, target attraction), or spatial partitioning optimizations like spatial grids or hash maps for rendering fast particles.
---

# Boids Simulation Engine Skill

This skill guides the implementation, optimization, and debugging of high-density 2D boid flocking and target attraction simulations inside the **Generative Shape Lab** project.

## Reference Map

- **Social Force Equations & Vectors**: Read [`references/algorithm.md`](file:///home/duckviet/gen-visual-lab/skills/boids-engine/references/algorithm.md) to inspect the mathematics of flocking behaviors.
- **Spatial Grid Optimization**: Read [`references/spatial-grid.md`](file:///home/duckviet/gen-visual-lab/skills/boids-engine/references/spatial-grid.md) for step-by-step spatial partitioning steps when active count exceeds 500.

---

## Core Simulation Workflow

Each frame inside the `update()` loop of `boids-engine.ts`, the simulation executes the following steps:

### Step 1: Query Current State
Pull active settings from Zustand using `getState()` and cache values locally (e.g. `count`, `speed`, `viewDistance`).

### Step 2: Spatial Partitioning (Optimized Scan)
- If `boids.count <= 500`: scan the neighborhood directly using an $O(N^2)$ nested loop.
- If `boids.count > 500`: build the Spatial Grid hash map ($O(N)$ insertion), and look up neighbor cells ($O(1)$ lookup per boid).

### Step 3: Compute Flocking Forces
For each boid, gather neighbors within `viewDistance` and accumulate behavior vectors:
1. **Separation**: Steer away from too-close neighbors.
2. **Alignment**: Match average heading velocity of neighbors.
3. **Cohesion**: Steer toward average center position of neighbors.
4. **Target Force**: Attract towards the closest point in `targetPoints` (if `targetPoints` exists).

### Step 4: Accumulate & Clamp Forces
Sum forces multiplied by their active weights:
`acceleration = (separation * wSeparation) + (alignment * wAlignment) + (cohesion * wCohesion) + (targetForce * wTargetForce)`.
- **Clamp Acceleration**: Avoid sudden visual jumps or system instabilities by clamping acceleration magnitude.

### Step 5: Integrate Position
1. `velocity = clamp(velocity + acceleration, settings.speed)`.
2. `position = position + velocity`.

### Step 6: Edge Boundaries
Wrap coordinates or bounce off edges based on `settings.wrap`.

---

## Critical Rules
- **No Direct State Mutation**: Boid algorithms must never alter Zustand properties directly. They are pure mathematical render models reading from state.
- **Safety Clamps**: Clamping magnitude must be applied to *both* acceleration and velocity vectors to prevent `NaN` coordinates when particles overlap.
- **Spatial Grid Enforcement**: Under no circumstances should $N > 500$ run on a direct $O(N^2)$ scan. This blocks the main browser thread and causes framerates to drop below 30 FPS.
