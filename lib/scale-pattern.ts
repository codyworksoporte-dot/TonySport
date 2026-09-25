/**
 * Deterministic reptile-scale geometry that tiles seamlessly.
 *
 * The same pattern produces two assets: the dark base texture and a layer that
 * only contains the joints between scales. Both are generated from the same
 * cells by `scripts/generate-scales.mjs`, so the orange joint glow always sits
 * exactly on the seams of the texture underneath.
 *
 * Run `node scripts/generate-scales.mjs` after changing SCALE_TILE, and keep
 * `--scale-tile` in app/globals.css equal to `size`.
 */

export type ScaleTileOptions = {
  /** Side of the square tile in CSS pixels; must match `--scale-tile`. */
  size: number;
  /** Average distance between scale centres. */
  spacing: number;
  /** 0–1: how much scale size drifts across the tile. */
  variation: number;
  /** Horizontal elongation, like lizard skin. */
  stretch: number;
  /** Width of the dark seam between scales. */
  gap: number;
  /** Maximum corner rounding of each scale. */
  corner: number;
  seed: number;
};

export const SCALE_TILE: ScaleTileOptions = { size: 640, spacing: 27, variation: .34, stretch: 1.16, gap: 3, corner: 7, seed: 20260923 };

type Point = { x: number; y: number };
type Labeled = Point & { label: number };
/** A seam shared by two neighbouring scales: x1, y1, x2, y2 in tile pixels. */
export type ScaleEdge = [number, number, number, number];
export type ScaleCell = { site: Point; polygon: Point[]; tone: number };
export type ScalePattern = { size: number; cells: ScaleCell[]; edges: ScaleEdge[] };

const TAU = Math.PI * 2;

function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Keeps the side of the half-plane where `nx * x + ny * y <= c`; new seams take `label`. */
function clip(polygon: Labeled[], nx: number, ny: number, c: number, label: number) {
  const result: Labeled[] = [];
  for (let index = 0; index < polygon.length; index++) {
    const a = polygon[index], b = polygon[(index + 1) % polygon.length];
    const da = nx * a.x + ny * a.y - c, db = nx * b.x + ny * b.y - c;
    if (da <= 0) {
      result.push(a);
      if (db > 0) { const t = da / (da - db); result.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, label }); }
    } else if (db <= 0) {
      const t = da / (da - db);
      result.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, label: a.label });
    }
  }
  return result;
}

function centroid(polygon: Point[]) {
  let area = 0, x = 0, y = 0;
  for (let index = 0; index < polygon.length; index++) {
    const a = polygon[index], b = polygon[(index + 1) % polygon.length];
    const cross = a.x * b.y - b.x * a.y;
    area += cross; x += (a.x + b.x) * cross; y += (a.y + b.y) * cross;
  }
  return area ? { x: x / (3 * area), y: y / (3 * area) } : polygon[0];
}

/** Periodic Voronoi cells on a torus of width × height; labels encode neighbour index and wrap offset. */
function voronoi(sites: Point[], width: number, height: number, reach: number) {
  const count = sites.length;
  return sites.map((site, index) => {
    const neighbours: { x: number; y: number; distance: number; label: number }[] = [];
    for (let other = 0; other < count; other++) {
      if (other === index) continue;
      let dx = sites[other].x - site.x, dy = sites[other].y - site.y;
      const wrapX = Math.round(dx / width), wrapY = Math.round(dy / height);
      dx -= wrapX * width; dy -= wrapY * height;
      const distance = dx * dx + dy * dy;
      if (distance < reach * reach) neighbours.push({ x: site.x + dx, y: site.y + dy, distance, label: other * 9 + (1 - wrapX) * 3 + (1 - wrapY) });
    }
    neighbours.sort((a, b) => a.distance - b.distance);
    let polygon: Labeled[] = [
      { x: site.x - reach, y: site.y - reach, label: -1 }, { x: site.x + reach, y: site.y - reach, label: -1 },
      { x: site.x + reach, y: site.y + reach, label: -1 }, { x: site.x - reach, y: site.y + reach, label: -1 },
    ];
    for (const neighbour of neighbours) {
      const nx = neighbour.x - site.x, ny = neighbour.y - site.y;
      polygon = clip(polygon, nx, ny, nx * (site.x + neighbour.x) / 2 + ny * (site.y + neighbour.y) / 2, neighbour.label);
    }
    return polygon;
  });
}

export function buildScalePattern(options: ScaleTileOptions = SCALE_TILE): ScalePattern {
  const { size, spacing, variation, stretch, seed } = options;
  const next = random(seed);
  // Work in a horizontally compressed space so the cells come out elongated.
  const width = size / stretch, height = size;
  const phase = [next() * TAU, next() * TAU, next() * TAU];
  const field = (x: number, y: number) => (
    .5 * Math.sin(TAU * (x / width + 2 * y / height) + phase[0])
    + .3 * Math.sin(TAU * (3 * x / width - y / height) + phase[1])
    + .2 * Math.sin(TAU * (2 * x / width + 3 * y / height) + phase[2])
  );
  const radius = (x: number, y: number) => spacing * .84 * (1 + variation * field(x, y)) / Math.sqrt(stretch);
  const maxRadius = spacing * .84 * (1 + variation) / Math.sqrt(stretch);

  // Dart throwing on the torus gives irregular, non-honeycomb spacing.
  const cell = maxRadius, columns = Math.ceil(width / cell), rows = Math.ceil(height / cell);
  const grid: number[][] = Array.from({ length: columns * rows }, () => []);
  let sites: Point[] = [];
  for (let attempt = 0; attempt < 60000; attempt++) {
    const x = next() * width, y = next() * height, r = radius(x, y);
    const gx = Math.floor(x / cell), gy = Math.floor(y / cell);
    let free = true;
    for (let ox = -1; ox <= 1 && free; ox++) for (let oy = -1; oy <= 1 && free; oy++) {
      for (const other of grid[((gy + oy + rows) % rows) * columns + ((gx + ox + columns) % columns)]) {
        let dx = sites[other].x - x, dy = sites[other].y - y;
        dx -= Math.round(dx / width) * width; dy -= Math.round(dy / height) * height;
        const limit = (r + radius(sites[other].x, sites[other].y)) / 2;
        if (dx * dx + dy * dy < limit * limit) { free = false; break; }
      }
    }
    if (!free) continue;
    grid[gy * columns + gx].push(sites.length);
    sites.push({ x, y });
  }

  // One relaxation step evens out slivers without turning the skin into a honeycomb.
  const reach = maxRadius * 3.2;
  const relaxed = voronoi(sites, width, height, reach);
  sites = relaxed.map((polygon, index) => {
    const centre = centroid(polygon);
    const x = sites[index].x + (centre.x - sites[index].x) * .7, y = sites[index].y + (centre.y - sites[index].y) * .7;
    return { x: ((x % width) + width) % width, y: ((y % height) + height) % height };
  });

  const polygons = voronoi(sites, width, height, reach);
  const edges: ScaleEdge[] = [];
  const cells = polygons.map((polygon, index) => {
    for (let vertex = 0; vertex < polygon.length; vertex++) {
      const a = polygon[vertex], b = polygon[(vertex + 1) % polygon.length];
      // Each seam belongs to two cells: keep it once, from the lower index.
      if (a.label >= 0 && Math.floor(a.label / 9) > index) edges.push([a.x * stretch, a.y, b.x * stretch, b.y]);
    }
    return { site: { x: sites[index].x * stretch, y: sites[index].y }, polygon: polygon.map(point => ({ x: point.x * stretch, y: point.y })), tone: next() };
  });
  return { size, cells, edges };
}

const round = (value: number) => Math.round(value * 10) / 10;

/** Shrinks a convex cell by `inset` and rounds its corners into an organic scale outline. */
function scalePath(cell: ScaleCell, inset: number, corner: number, offsetX: number, offsetY: number) {
  const centre = centroid(cell.polygon);
  const size = 4 * inset + 400;
  let shape: Labeled[] = [
    { x: centre.x - size, y: centre.y - size, label: 0 }, { x: centre.x + size, y: centre.y - size, label: 0 },
    { x: centre.x + size, y: centre.y + size, label: 0 }, { x: centre.x - size, y: centre.y + size, label: 0 },
  ];
  for (let index = 0; index < cell.polygon.length; index++) {
    const a = cell.polygon[index], b = cell.polygon[(index + 1) % cell.polygon.length];
    let nx = b.y - a.y, ny = a.x - b.x;
    const length = Math.hypot(nx, ny);
    if (length < .01) continue;
    nx /= length; ny /= length;
    if (nx * (centre.x - a.x) + ny * (centre.y - a.y) > 0) { nx = -nx; ny = -ny; }
    shape = clip(shape, nx, ny, nx * a.x + ny * a.y - inset, 0);
  }
  if (shape.length < 3) return '';
  const points = shape.map(point => ({ x: point.x + offsetX, y: point.y + offsetY }));
  const cut = points.map((point, index) => {
    const previous = points[(index + points.length - 1) % points.length], following = points[(index + 1) % points.length];
    const before = Math.hypot(previous.x - point.x, previous.y - point.y), after = Math.hypot(following.x - point.x, following.y - point.y);
    const amount = Math.min(corner, before * .45, after * .45);
    return {
      start: { x: point.x + (previous.x - point.x) * amount / (before || 1), y: point.y + (previous.y - point.y) * amount / (before || 1) },
      end: { x: point.x + (following.x - point.x) * amount / (after || 1), y: point.y + (following.y - point.y) * amount / (after || 1) },
      point,
    };
  });
  // Relative commands keep the tile light; rounding happens on absolute positions so errors never accumulate.
  let path = `M${round(cut[0].end.x)} ${round(cut[0].end.y)}`, x = round(cut[0].end.x), y = round(cut[0].end.y);
  const step = (target: Point) => { const px = round(target.x), py = round(target.y), result = `${round(px - x)} ${round(py - y)}`; return { px, py, result }; };
  for (let index = 1; index <= cut.length; index++) {
    const { start, point, end } = cut[index % cut.length];
    const a = step(start); x = a.px; y = a.py;
    const control = { x: round(point.x) - x, y: round(point.y) - y }, b = step(end);
    path += `l${a.result}q${round(control.x)} ${round(control.y)} ${b.result}`;
    x = b.px; y = b.py;
  }
  return `${path}Z`;
}

function copies(minX: number, minY: number, maxX: number, maxY: number, size: number, margin: number) {
  const offsets: [number, number][] = [];
  for (const x of [-size, 0, size]) for (const y of [-size, 0, size]) {
    if (maxX + x >= -margin && minX + x <= size + margin && maxY + y >= -margin && minY + y <= size + margin) offsets.push([x, y]);
  }
  return offsets;
}

/** Graphite scales with dark seams; light falls from the upper left like the rest of the page. */
export function renderScaleBaseSvg(pattern: ScalePattern, options: ScaleTileOptions = SCALE_TILE) {
  const { size } = pattern;
  const tones = [['#242a26', '#1b201d', '#131614'], ['#212623', '#181c1a', '#111412'], ['#272d29', '#1d2220', '#141815'], ['#1f2421', '#171b18', '#101311']];
  const groups: string[][] = tones.map(() => []);
  for (const cell of pattern.cells) {
    const xs = cell.polygon.map(point => point.x), ys = cell.polygon.map(point => point.y);
    for (const [x, y] of copies(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), size, 1)) {
      const path = scalePath(cell, options.gap / 2, options.corner, x, y);
      if (path) groups[Math.min(tones.length - 1, Math.floor(cell.tone * tones.length))].push(path);
    }
  }
  const gradients = tones.map(([light, middle, dark], index) => `<radialGradient id="s${index}" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="${light}"/><stop offset=".62" stop-color="${middle}"/><stop offset="1" stop-color="${dark}"/></radialGradient>`).join('');
  const paths = groups.map((group, index) => group.map(path => `<path fill="url(#s${index})" d="${path}"/>`).join('')).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><!-- scale-tile ${size} ${pattern.cells.length} ${pattern.edges.length} --><defs>${gradients}</defs><rect width="${size}" height="${size}" fill="#050706"/>${paths}</svg>\n`;
}

/** Only the seams: the page reveals this layer near the cursor through a radial mask. */
export function renderScaleJointsSvg(pattern: ScalePattern, stroke = { color: '#ff6a00', core: '#ffb27a' }) {
  const { size } = pattern;
  let d = '';
  for (const [x1, y1, x2, y2] of pattern.edges) {
    for (const [x, y] of copies(Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2), size, 4)) {
      d += `M${round(x1 + x)} ${round(y1 + y)}l${round(round(x2 + x) - round(x1 + x))} ${round(round(y2 + y) - round(y1 + y))}`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><!-- scale-tile ${size} ${pattern.cells.length} ${pattern.edges.length} --><defs><path id="j" d="${d}"/></defs><g fill="none" stroke-linecap="round"><use href="#j" stroke="${stroke.color}" stroke-width="3.6" stroke-opacity=".24"/><use href="#j" stroke="${stroke.color}" stroke-width="1.2"/><use href="#j" stroke="${stroke.core}" stroke-width=".5" stroke-opacity=".85"/></g></svg>\n`;
}
