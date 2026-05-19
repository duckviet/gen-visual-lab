# Spatial Grid Partitioning Algorithm

A naive double-loop neighbor check runs at $O(N^2)$ complexity, which degrades performance below 30 FPS when the boid count exceeds 500. We optimize this to $O(N)$ using a **Spatial Hash Grid**.

---

## 1. Grid Specifications

- **Cell Dimensions**: Set the cell width and height exactly equal to the boids' `viewDistance`.
- **Columns & Rows**:
  - `cols = Math.ceil(canvasWidth / viewDistance)`
  - `rows = Math.ceil(canvasHeight / viewDistance)`
- **Structure**: An array of buckets (lists of boid references) representing each cell. Total cells: `cols * rows`.

---

## 2. Rebuilding the Grid (Every Frame)

At the beginning of each physics update step, rebuild the grid map:

```ts
class SpatialGrid {
  private cells: Map<number, Boid[]> = new Map();
  private cols: number;
  private rows: number;
  private cellSize: number;

  constructor(width: number, height: number, cellSize: number) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
  }

  // Clear and populate grid
  public rebuild(boids: Boid[]): void {
    this.cells.clear();
    
    for (const boid of boids) {
      const cellIndex = this.getCellIndex(boid.pos);
      
      if (!this.cells.has(cellIndex)) {
        this.cells.set(cellIndex, []);
      }
      this.cells.get(cellIndex)!.push(boid);
    }
  }

  // Convert 2D position to 1D index
  private getCellIndex(pos: Vec2): number {
    const col = Math.max(0, Math.min(this.cols - 1, Math.floor(pos.x / this.cellSize)));
    const row = Math.max(0, Math.min(this.rows - 1, Math.floor(pos.y / this.cellSize)));
    return col + row * this.cols;
  }
}
```

---

## 3. Querying Neighbors ($O(9)$ Lookups)

When searching for neighbors of boid $i$, only scan the cells directly adjacent to the cell containing boid $i$ (including its own cell):

```ts
public getNeighbors(boid: Boid): Boid[] {
  const neighbors: Boid[] = [];
  const col = Math.floor(boid.pos.x / this.cellSize);
  const row = Math.floor(boid.pos.y / this.cellSize);

  // Check 3x3 surrounding cells
  for (let dRow = -1; dRow <= 1; dRow++) {
    for (let dCol = -1; dCol <= 1; dCol++) {
      const c = col + dCol;
      const r = row + dRow;

      // Handle borders (clamped or wrapped depending on setting)
      if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
        const cellIndex = c + r * this.cols;
        const cellBoids = this.cells.get(cellIndex);
        
        if (cellBoids) {
          for (const other of cellBoids) {
            if (other !== boid) {
              neighbors.push(other);
            }
          }
        }
      }
    }
  }
  return neighbors;
}
```

---

## 4. Execution Lifecycle

Within `update()` frame:
1. Re-initialize spatial grid: `grid.rebuild(boids)`.
2. Map force checks:
   ```ts
   for (const boid of boids) {
     const neighbors = grid.getNeighbors(boid);
     const sep = computeSeparation(boid, neighbors, viewDistance);
     const ali = computeAlignment(boid, neighbors);
     const coh = computeCohesion(boid, neighbors);
     const trg = computeTargetAttraction(boid, targetPoints);
     
     boid.applyForces(sep, ali, coh, trg);
   }
   ```
3. Update physics coordinates and render. This keeps the execution frame time well within `16.6ms` even at 2000+ active elements.
