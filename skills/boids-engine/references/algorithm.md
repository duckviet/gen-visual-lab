# Flocking Force Algorithms & Equations

All vector mathematics for the boids simulation engine are based on standard Euclidean coordinate spaces. The following models must be implemented exactly.

---

## 1. Boid Representation

A boid is represented by three 2D vector parameters:
- **`pos`** (`Vec2`): Active coordinates inside canvas space `[0, width] x [0, height]`.
- **`vel`** (`Vec2`): Active velocity vector.
- **`acc`** (`Vec2`): Frame acceleration accumulator.

---

## 2. Flocking Behaviors

Each behavior calculates a **steer** vector: `steering = target_vector - velocity`, which is then clamped to a maximum force limit.

### A. Separation Force (Steer Away)
Prevents boids from colliding with their immediate neighbors.

```ts
function computeSeparation(boid: Boid, neighbors: Boid[], viewDistance: number): Vec2 {
  let steer = new Vec2(0, 0);
  let count = 0;
  const personalSpace = viewDistance * 0.4; // Separation threshold

  for (const other of neighbors) {
    const d = boid.pos.dist(other.pos);
    if (d > 0 && d < personalSpace) {
      // Calculate vector pointing away from neighbor, weighted inversely by distance
      const diff = boid.pos.sub(other.pos).normalize().scale(1 / d);
      steer = steer.add(diff);
      count++;
    }
  }

  if (count > 0) {
    steer = steer.scale(1 / count);
  }

  if (steer.mag() > 0) {
    steer = steer.normalize().scale(maxSpeed).sub(boid.vel).limit(maxForce);
  }
  return steer;
}
```

### B. Alignment Force (Match Heading)
Aligns a boid's heading with the average direction of its neighbors.

```ts
function computeAlignment(boid: Boid, neighbors: Boid[]): Vec2 {
  let sum = new Vec2(0, 0);
  let count = 0;

  for (const other of neighbors) {
    sum = sum.add(other.vel);
    count++;
  }

  if (count > 0) {
    sum = sum.scale(1 / count);
    return sum.normalize().scale(maxSpeed).sub(boid.vel).limit(maxForce);
  }
  return new Vec2(0, 0);
}
```

### C. Cohesion Force (Fly Together)
Attracts a boid toward the center of mass (average position) of its flock.

```ts
function computeCohesion(boid: Boid, neighbors: Boid[]): Vec2 {
  let sum = new Vec2(0, 0);
  let count = 0;

  for (const other of neighbors) {
    sum = sum.add(other.pos);
    count++;
  }

  if (count > 0) {
    sum = sum.scale(1 / count);
    // Seek target position
    const desired = sum.sub(boid.pos).normalize().scale(maxSpeed);
    return desired.sub(boid.vel).limit(maxForce);
  }
  return new Vec2(0, 0);
}
```

### D. Target Attraction Force (Shape Pull)
Attracts the boid to its nearest coordinate within the target shape point cloud `targetPoints`.

```ts
function computeTargetAttraction(boid: Boid, targetPoints: Vec2[]): Vec2 {
  if (targetPoints.length === 0) return new Vec2(0, 0);

  let closestPoint = targetPoints[0];
  let minDistance = boid.pos.dist(closestPoint);

  // Scan for closest point in target cloud
  for (let i = 1; i < targetPoints.length; i++) {
    const d = boid.pos.dist(targetPoints[i]);
    if (d < minDistance) {
      minDistance = d;
      closestPoint = targetPoints[i];
    }
  }

  const desired = closestPoint.sub(boid.pos).normalize().scale(maxSpeed);
  return desired.sub(boid.vel).limit(maxForce);
}
```

---

## 3. Boundary Calculations

### Wrapping Mode (`settings.wrap === true`)
```ts
if (pos.x < 0) pos.x = width;
if (pos.y < 0) pos.y = height;
if (pos.x > width) pos.x = 0;
if (pos.y > height) pos.y = 0;
```

### Bouncing Mode (`settings.wrap === false`)
```ts
if (pos.x < 0) { pos.x = 0; vel.x *= -1; }
if (pos.y < 0) { pos.y = 0; vel.y *= -1; }
if (pos.x > width) { pos.x = width; vel.x *= -1; }
if (pos.y > height) { pos.y = height; vel.y *= -1; }
```
