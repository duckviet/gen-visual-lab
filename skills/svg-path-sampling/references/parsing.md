# Curve Flattening & Geometry

To sample points along curved vector command profiles (Cubic and Quadratic Beziers), we must first convert the curved paths into linear polylines.

---

## 1. Curve Formulations

Let $P_0, P_1, P_2, P_3$ represent 2D vector coordinate control points.

### A. Quadratic Bezier Curves (Command `Q`)
Defined by three control points: starting point $P_0$, control point $P_1$, and end point $P_2$:

$$B(t) = (1 - t)^2 P_0 + 2(1 - t)t P_1 + t^2 P_2, \quad t \in [0, 1]$$

### B. Cubic Bezier Curves (Command `C`)
Defined by four control points: starting point $P_0$, control points $P_1$ and $P_2$, and end point $P_3$:

$$B(t) = (1 - t)^3 P_0 + 3(1 - t)^2 t P_1 + 3(1 - t) t^2 P_2 + t^3 P_3, \quad t \in [0, 1]$$

---

## 2. De Casteljau's Subdivision Method

Instead of using a uniform increment loop for $t \in [0, 1]$ (which causes points to clump at sharp bends and look sparse on flat spans), we use recursive **adaptive subdivision** to split the curve only where the curvature exceeds our flatness threshold.

### Curvature Flatness Criterion
A curve segment $[P_0, P_1, P_2, P_3]$ is considered flat enough to be represented as a straight line if the maximum distance $d$ of control points $P_1$ and $P_2$ from the line segment joining $P_0$ and $P_3$ is less than a tolerance value $\epsilon$ (set tolerance $\epsilon \le 1.0$ pixel):

```ts
function isFlat(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, tolerance: number): boolean {
  // Line parameters from p0 to p3
  const ux = 3.0 * p1.x - 2.0 * p0.x - p3.x;
  const uy = 3.0 * p1.y - 2.0 * p0.y - p3.y;
  const vx = 3.0 * p2.x - p0.x - 2.0 * p3.x;
  const vy = 3.0 * p2.y - p0.y - 2.0 * p3.y;

  const d1 = ux * ux + uy * uy;
  const d2 = vx * vx + vy * vy;

  return Math.max(d1, d2) <= 16.0 * tolerance * tolerance;
}
```

### Recursive Split Algorithm (Cubic Bezier)
If a curve fails the flatness test, split it in half at $t = 0.5$ using de Casteljau's method and recurse:

```ts
function subdivideCubic(
  p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2,
  tolerance: number,
  points: Vec2[]
): void {
  if (isFlat(p0, p1, p2, p3, tolerance)) {
    points.push(p3); // Curve segment is straight, add end coordinate
    return;
  }

  // Midpoints calculation
  const p01   = p0.add(p1).scale(0.5);
  const p12   = p1.add(p2).scale(0.5);
  const p23   = p2.add(p3).scale(0.5);
  const p012  = p01.add(p12).scale(0.5);
  const p123  = p12.add(p23).scale(0.5);
  const p0123 = p012.add(p123).scale(0.5);

  // Subdivide left side
  subdivideCubic(p0, p01, p012, p0123, tolerance, points);
  // Subdivide right side
  subdivideCubic(p0123, p123, p23, p3, tolerance, points);
}
```

---

## 3. Assembling the Polylines

After running subdivision on all curve elements, compile the linear polylines. Keep track of separate sub-paths (split by `MoveTo M` commands) to prevent drawing connecting vector lines between separate SVG elements or separate characters. Each path command is stored as a list of independent `Vec2[]` polyline groups.
