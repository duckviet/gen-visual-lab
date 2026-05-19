# Arc Length Discretization & Bounding Box Normalization

Once curves are converted to a sequence of linear polyline segments, we must discretize and normalize the coordinates.

---

## 1. Discretizing by Arc Length

To ensure that the target points are spaced exactly equidistant from one another along the entire length of the vector graphic:

1. **Calculate Segments Lengths**: For each polyline segment in the path, compute its Euclidean distance. Keep a running sum of length coordinates in a cumulative length array: `lengths[i] = cumulativeLength`.
2. **Determine Sample Spacing**: Total length of the compound path is $L_{total}$. To sample $N$ points, the target interval step is: $s = L_{total} / (N - 1)$.
3. **Interpolate Points**: For each target point $k \in [0, N-1]$:
   - Target cumulative distance: $d_{target} = k \cdot s$.
   - Search the cumulative length array to locate the exact segment index $i$ where: `lengths[i] <= d_target < lengths[i + 1]`.
   - Compute interpolation weight: $t = (d_{target} - lengths[i]) / (lengths[i+1] - lengths[i])$.
   - Calculate coordinates:
     $$P_{sampled} = P_i + t \cdot (P_{i+1} - P_i)$$

```ts
export function sampleEquidistantPoints(polylines: Vec2[][], targetCount: number): Vec2[] {
  // Step 1: Flatten polylines and construct cumulative distance arrays
  const points: Vec2[] = [];
  const distances: number[] = [0];
  let totalLength = 0;

  const flatPoints = polylines.flat();
  if (flatPoints.length < 2) return flatPoints;

  for (let i = 0; i < flatPoints.length - 1; i++) {
    const dist = flatPoints[i].dist(flatPoints[i + 1]);
    totalLength += dist;
    distances.push(totalLength);
  }

  // Step 2: Extract equidistant point samples
  const sampled: Vec2[] = [];
  const step = totalLength / (targetCount - 1);

  for (let k = 0; k < targetCount; k++) {
    const targetDist = k * step;
    
    // Find containing segment index via binary search
    let low = 0;
    let high = distances.length - 1;
    let idx = 0;
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (distances[mid] <= targetDist) {
        idx = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    if (idx >= flatPoints.length - 1) {
      sampled.push(flatPoints[flatPoints.length - 1]);
    } else {
      const segStart = flatPoints[idx];
      const segEnd = flatPoints[idx + 1];
      const segLen = distances[idx + 1] - distances[idx];
      
      const t = segLen > 0 ? (targetDist - distances[idx]) / segLen : 0;
      sampled.push(segStart.lerp(segEnd, t));
    }
  }

  return sampled;
}
```

---

## 2. Aspect-Ratio Preserving Normalization

Never stretch text glyphs or vector shapes to fit the square $[0, 1]^2$ space. Scale both dimensions uniformly relative to the larger axis.

### Normalization Logic

```ts
export function normalizePoints(points: Vec2[]): Vec2[] {
  if (points.length === 0) return [];

  // Step 1: Locate overall Bounding Box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  const width = maxX - minX;
  const height = maxY - minY;
  
  // Prevent divide-by-zero on empty bounds
  if (width === 0 && height === 0) return points.map(() => ({ x: 0.5, y: 0.5 }));

  // Step 2: Determine uniform scale multiplier using the larger dimension
  const maxDim = Math.max(width, height);
  const scale = 1.0 / maxDim;

  // Step 3: Shift points to center of origin, scale uniformly, then shift to [0,1]^2
  return points.map((p) => {
    // Translate coordinate relative to bounding box center
    const xCentered = (p.x - (minX + width * 0.5)) * scale;
    const yCentered = (p.y - (minY + height * 0.5)) * scale;

    // Map centered coordinate from [-0.5, 0.5] range to [0.0, 1.0] range
    return {
      x: xCentered + 0.5,
      y: yCentered + 0.5,
    };
  });
}
```

---

## 3. Active Canvas Scaling (Runtime Rendering)

The normalized coordinates inside the Zustand store (`appState.targetPoints`) sitting inside relative $[0, 1]^2$ coordinates are translated back to actual pixels dynamically inside the canvas renderer loop using the active viewport dimensions:

```ts
const scaleX = canvas.width * 0.8;  // Margin buffer pad (80% of canvas area)
const scaleY = canvas.height * 0.8;
const offsetX = canvas.width * 0.1; // Centered margin padding offset
const offsetY = canvas.height * 0.1;

const screenCoordinates = targetPoints.map(p => ({
  x: p.x * scaleX + offsetX,
  y: p.y * scaleY + offsetY
}));
```
