/**
 * Smart fit for logos uploaded as layers, with no libraries: removes a uniform
 * background (flood fill from the edges with tolerance and soft edges), trims
 * the margins and straightens a tilt of 2°–30° (minimum-area rectangle of the
 * mask). The analysis works on plain RGBA arrays, so it is deterministic and
 * runs outside the browser; only decoding and encoding use canvas.
 */

export interface RGBAImage {width: number; height: number; data: Uint8ClampedArray}
export interface AutofitOptions {
  /** Also clear enclosed background holes (letter counters). Only for wide wordmarks. */
  fillHoles?: boolean;
}
export interface AutofitReport {
  changed: boolean;
  removedBackground: boolean;
  trimmed: boolean;
  /** Degrees rotated to straighten (positive = clockwise); 0 when untouched. */
  angle: number;
  background: string | null;
  width: number;
  height: number;
}
export interface AutofitResult extends AutofitReport {
  /** Fitted image as a data URL; empty when nothing changed. */
  data: string;
  ratio: number;
}

const MIN_ANGLE = 2;
const MAX_ANGLE = 30;
const MASK_ALPHA = 96;

const clampByte = (value: number) => (value < 0 ? 0 : value > 255 ? 255 : Math.round(value));
const smoothstep = (low: number, high: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - low) / (high - low)));
  return t * t * (3 - 2 * t);
};
const hex = (rgb: number[]) => `#${rgb.map(value => clampByte(value).toString(16).padStart(2, '0')).join('')}`;

function distance2(data: Uint8ClampedArray, index: number, rgb: number[]) {
  const dr = data[index] - rgb[0], dg = data[index + 1] - rgb[1], db = data[index + 2] - rgb[2];
  return dr * dr + dg * dg + db * db;
}

/** Border frame pixels (pixel indices, not byte offsets). */
function frame(width: number, height: number, thickness: number): number[] {
  const list: number[] = [];
  for (let y = 0; y < height; y++) {
    const edgeRow = y < thickness || y >= height - thickness;
    for (let x = 0; x < width; x++) if (edgeRow || x < thickness || x >= width - thickness) list.push(y * width + x);
  }
  return list;
}

interface Background {rgb: number[]; tolerance: number}

/** The dominant border colour, if the border is uniform enough to be a background. */
function estimateBackground(image: RGBAImage): Background | 'transparent' | null {
  const {width, height, data} = image;
  const border = frame(width, height, Math.max(1, Math.min(3, Math.round(Math.min(width, height) * 0.01))));
  const opaque = border.filter(pixel => data[pixel * 4 + 3] >= 200);
  if (border.length - opaque.length > border.length * 0.5) return 'transparent';
  if (opaque.length < 8) return null;
  const bins = new Uint32Array(4096);
  for (const pixel of opaque) {
    const i = pixel * 4;
    bins[((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4)]++;
  }
  let mode = 0;
  for (let bin = 1; bin < bins.length; bin++) if (bins[bin] > bins[mode]) mode = bin;
  const [mr, mg, mb] = [mode >> 8, (mode >> 4) & 15, mode & 15];
  const sum = [0, 0, 0];
  let count = 0;
  for (const pixel of opaque) {
    const i = pixel * 4;
    if (Math.abs((data[i] >> 4) - mr) <= 1 && Math.abs((data[i + 1] >> 4) - mg) <= 1 && Math.abs((data[i + 2] >> 4) - mb) <= 1) {
      sum[0] += data[i]; sum[1] += data[i + 1]; sum[2] += data[i + 2]; count++;
    }
  }
  const rgb = sum.map(value => value / count);
  let spread = 0, near = 0;
  for (const pixel of opaque) {
    const d2 = distance2(data, pixel * 4, rgb);
    if (d2 <= 40 * 40) { near++; spread += d2; }
  }
  if (near < opaque.length * 0.55) return null;
  const rms = Math.sqrt(spread / Math.max(1, near));
  return {rgb, tolerance: Math.min(72, Math.max(26, 24 + 2.5 * rms))};
}

/** Edge-connected background; soft gradients (paper, vignetting) are followed step by step. */
function floodBackground(image: RGBAImage, bg: Background): Uint8Array {
  const {width, height, data} = image;
  const total = width * height;
  const mask = new Uint8Array(total);
  const queue = new Int32Array(total);
  const t2 = bg.tolerance * bg.tolerance, loose2 = (bg.tolerance * 1.6) ** 2;
  let head = 0, tail = 0;
  const accepts = (pixel: number, from: number) => {
    const i = pixel * 4;
    if (data[i + 3] < 16) return true;
    const d2 = distance2(data, i, bg.rgb);
    if (d2 <= t2) return true;
    if (from < 0 || d2 > loose2) return false;
    const j = from * 4, dr = data[i] - data[j], dg = data[i + 1] - data[j + 1], db = data[i + 2] - data[j + 2];
    return dr * dr + dg * dg + db * db <= 100;
  };
  const visit = (next: number, from: number) => { if (!mask[next] && accepts(next, from)) { mask[next] = 1; queue[tail++] = next; } };
  for (const pixel of frame(width, height, 1)) visit(pixel, -1);
  while (head < tail) {
    const pixel = queue[head++], x = pixel % width;
    if (x > 0) visit(pixel - 1, pixel);
    if (x < width - 1) visit(pixel + 1, pixel);
    if (pixel >= width) visit(pixel - width, pixel);
    if (pixel < total - width) visit(pixel + width, pixel);
  }
  return mask;
}

type LocalBackground = (pixel: number) => number[];

/**
 * Smooth background colour at every pixel, from the pixels already known to be
 * background (cell averages, filled outwards, bilinear). Follows paper shading
 * and vignetting, so edges and letter counters are judged against the real
 * local colour instead of one global value.
 */
function backgroundMap(image: RGBAImage, mask: Uint8Array): LocalBackground {
  const {width, height, data} = image;
  const cell = Math.max(8, Math.round(Math.max(width, height) / 48));
  const gw = Math.ceil(width / cell), gh = Math.ceil(height / cell);
  const sums = new Float64Array(gw * gh * 3), counts = new Uint32Array(gw * gh);
  for (let pixel = 0; pixel < width * height; pixel++) {
    if (!mask[pixel] || data[pixel * 4 + 3] < 16) continue;
    const x = pixel % width, c = Math.floor((pixel - x) / width / cell) * gw + Math.floor(x / cell);
    sums[c * 3] += data[pixel * 4]; sums[c * 3 + 1] += data[pixel * 4 + 1]; sums[c * 3 + 2] += data[pixel * 4 + 2]; counts[c]++;
  }
  const colors = new Float32Array(gw * gh * 3), known = new Uint8Array(gw * gh);
  for (let c = 0; c < gw * gh; c++) if (counts[c]) { for (let k = 0; k < 3; k++) colors[c * 3 + k] = sums[c * 3 + k] / counts[c]; known[c] = 1; }
  for (let round = 0; round < gw + gh; round++) {
    const next = known.slice();
    let missing = 0;
    for (let c = 0; c < gw * gh; c++) {
      if (known[c]) continue;
      const cx = c % gw, cy = (c - cx) / gw, total = [0, 0, 0];
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx, ny = cy + dy, neighbour = ny * gw + nx;
        if (nx < 0 || ny < 0 || nx >= gw || ny >= gh || !known[neighbour]) continue;
        for (let k = 0; k < 3; k++) total[k] += colors[neighbour * 3 + k];
        n++;
      }
      if (n) { for (let k = 0; k < 3; k++) colors[c * 3 + k] = total[k] / n; next[c] = 1; } else missing++;
    }
    known.set(next);
    if (!missing) break;
  }
  return pixel => {
    const x = pixel % width, y = (pixel - x) / width;
    const fx = Math.min(gw - 1, Math.max(0, (x + 0.5) / cell - 0.5)), fy = Math.min(gh - 1, Math.max(0, (y + 0.5) / cell - 0.5));
    const x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(gw - 1, x0 + 1), y1 = Math.min(gh - 1, y0 + 1), tx = fx - x0, ty = fy - y0;
    const at = (cx: number, cy: number, k: number) => colors[(cy * gw + cx) * 3 + k];
    return [0, 1, 2].map(k => (at(x0, y0, k) * (1 - tx) + at(x1, y0, k) * tx) * (1 - ty) + (at(x0, y1, k) * (1 - tx) + at(x1, y1, k) * tx) * ty);
  };
}

/** Enclosed background-coloured islands smaller than 1.5% of the image (counters of O, A, R…). */
function clearHoles(image: RGBAImage, mask: Uint8Array, bg: Background, local: LocalBackground) {
  const {width, height, data} = image;
  const total = width * height, limit = total * 0.015, t2 = (bg.tolerance * 0.8) ** 2;
  const seen = new Uint8Array(total), queue = new Int32Array(total);
  const like = (pixel: number) => distance2(data, pixel * 4, local(pixel)) <= t2;
  let tail = 0;
  const visit = (next: number) => { if (!mask[next] && !seen[next] && like(next)) { seen[next] = 1; queue[tail++] = next; } };
  for (let start = 0; start < total; start++) {
    if (mask[start] || seen[start] || !like(start)) continue;
    let head = 0;
    tail = 0;
    queue[tail++] = start; seen[start] = 1;
    while (head < tail) {
      const pixel = queue[head++], x = pixel % width;
      if (x > 0) visit(pixel - 1);
      if (x < width - 1) visit(pixel + 1);
      if (pixel >= width) visit(pixel - width);
      if (pixel < total - width) visit(pixel + width);
    }
    if (tail <= limit) for (let k = 0; k < tail; k++) mask[queue[k]] = 1;
  }
}

/**
 * Transparent background and soft anti-aliased edges. Each edge pixel is placed
 * on the segment between the local background and the nearby solid artwork
 * colour, so JPEG ringing (pixels lighter than the paper) does not leave a halo.
 */
function applyMask(image: RGBAImage, mask: Uint8Array, bg: Background, local: LocalBackground): RGBAImage {
  const {width, height, data} = image;
  const total = width * height, out = new Uint8ClampedArray(data), edge = new Uint8Array(total);
  for (let pixel = 0; pixel < total; pixel++) {
    const x = pixel % width, y = (pixel - x) / width;
    for (let dy = -1; dy <= 1 && !edge[pixel]; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < width && ny < height && mask[ny * width + nx] !== mask[pixel]) { edge[pixel] = 1; break; }
    }
    if (!edge[pixel] && mask[pixel]) out[pixel * 4 + 3] = 0;
  }
  const low = bg.tolerance * 0.5, high = bg.tolerance * 1.8, separation = (bg.tolerance * 0.8) ** 2;
  for (let pixel = 0; pixel < total; pixel++) {
    if (!edge[pixel]) continue;
    const x = pixel % width, y = (pixel - x) / width, i = pixel * 4, back = local(pixel);
    // Nearby solid artwork colour (inside the shape, away from the edge).
    const solid = [0, 0, 0];
    let n = 0;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const nx = x + dx, ny = y + dy, q = ny * width + nx;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height || mask[q] || edge[q]) continue;
      solid[0] += data[q * 4]; solid[1] += data[q * 4 + 1]; solid[2] += data[q * 4 + 2]; n++;
    }
    let coverage: number;
    const d = n ? [solid[0] / n - back[0], solid[1] / n - back[1], solid[2] / n - back[2]] : null;
    const length2 = d ? d[0] * d[0] + d[1] * d[1] + d[2] * d[2] : 0;
    if (d && length2 >= separation) coverage = Math.min(1, Math.max(0, ((data[i] - back[0]) * d[0] + (data[i + 1] - back[1]) * d[1] + (data[i + 2] - back[2]) * d[2]) / length2));
    else coverage = smoothstep(low, high, Math.sqrt(distance2(data, i, back)));
    if (mask[pixel] && coverage < 0.3) coverage = 0;
    out[i + 3] = clampByte(Math.min(data[i + 3], coverage * 255));
    if (coverage > 0.04) for (let c = 0; c < 3; c++) out[i + c] = clampByte(back[c] + (data[i + c] - back[c]) / coverage);
  }
  return {width, height, data: out};
}

interface Box {x0: number; y0: number; x1: number; y1: number}

/** Bounding box of visible pixels, ignoring tiny specks far from the artwork. */
function contentBox(image: RGBAImage): Box | null {
  const {width, height, data} = image;
  const cell = Math.max(1, Math.ceil(Math.max(width, height) / 512));
  const gw = Math.ceil(width / cell), gh = Math.ceil(height / cell);
  const grid = new Uint8Array(gw * gh);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (data[(y * width + x) * 4 + 3] >= MASK_ALPHA) grid[Math.floor(y / cell) * gw + Math.floor(x / cell)] = 1;
  const labels = new Int32Array(gw * gh), queue = new Int32Array(gw * gh);
  const parts: {area: number; box: Box}[] = [];
  for (let start = 0; start < grid.length; start++) {
    if (!grid[start] || labels[start]) continue;
    const box = {x0: gw, y0: gh, x1: -1, y1: -1};
    let head = 0, tail = 0;
    queue[tail++] = start; labels[start] = parts.length + 1;
    while (head < tail) {
      const cellIndex = queue[head++], cx = cellIndex % gw, cy = (cellIndex - cx) / gw;
      box.x0 = Math.min(box.x0, cx); box.x1 = Math.max(box.x1, cx); box.y0 = Math.min(box.y0, cy); box.y1 = Math.max(box.y1, cy);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx, ny = cy + dy, next = ny * gw + nx;
        if (nx >= 0 && ny >= 0 && nx < gw && ny < gh && grid[next] && !labels[next]) { labels[next] = parts.length + 1; queue[tail++] = next; }
      }
    }
    parts.push({area: tail, box});
  }
  if (!parts.length) return null;
  const totalArea = parts.reduce((sum, part) => sum + part.area, 0);
  const main = parts.filter(part => part.area >= Math.max(3, totalArea * 0.0005));
  const core = new Set(main.length ? main : parts);
  const union = {x0: gw, y0: gh, x1: -1, y1: -1};
  for (const part of core) { union.x0 = Math.min(union.x0, part.box.x0); union.y0 = Math.min(union.y0, part.box.y0); union.x1 = Math.max(union.x1, part.box.x1); union.y1 = Math.max(union.y1, part.box.y1); }
  // Small parts near the artwork (accents, dots) are kept; distant specks are not.
  const reach = Math.max(2, Math.round(Math.max(union.x1 - union.x0, union.y1 - union.y0) * 0.12));
  for (const part of parts) {
    if (core.has(part)) continue;
    const near = part.box.x1 >= union.x0 - reach && part.box.x0 <= union.x1 + reach && part.box.y1 >= union.y0 - reach && part.box.y0 <= union.y1 + reach;
    if (near) { union.x0 = Math.min(union.x0, part.box.x0); union.y0 = Math.min(union.y0, part.box.y0); union.x1 = Math.max(union.x1, part.box.x1); union.y1 = Math.max(union.y1, part.box.y1); }
  }
  return {x0: union.x0 * cell, y0: union.y0 * cell, x1: Math.min(width, (union.x1 + 1) * cell), y1: Math.min(height, (union.y1 + 1) * cell)};
}

function crop(image: RGBAImage, box: Box, pad: number): RGBAImage {
  const x0 = Math.max(0, box.x0 - pad), y0 = Math.max(0, box.y0 - pad);
  const x1 = Math.min(image.width, box.x1 + pad), y1 = Math.min(image.height, box.y1 + pad);
  const width = x1 - x0, height = y1 - y0, data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) data.set(image.data.subarray(((y0 + y) * image.width + x0) * 4, ((y0 + y) * image.width + x1) * 4), y * width * 4);
  return {width, height, data};
}

/** Outer corners of the visible rows, enough for the convex hull. */
function hullPoints(image: RGBAImage): number[][] {
  const {width, height, data} = image;
  const step = Math.max(1, Math.ceil(Math.max(width, height) / 600));
  const points: number[][] = [];
  for (let y = 0; y < height; y += step) {
    let left = -1, right = -1;
    for (let x = 0; x < width; x++) if (data[(y * width + x) * 4 + 3] >= MASK_ALPHA) { if (left < 0) left = x; right = x; }
    if (left >= 0) points.push([left, y], [right + 1, y], [left, y + step], [right + 1, y + step]);
  }
  return points;
}

function convexHull(points: number[][]): number[][] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (sorted.length < 3) return sorted;
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: number[][] = [], upper: number[][] = [];
  for (const point of sorted) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop(); lower.push(point); }
  for (let k = sorted.length - 1; k >= 0; k--) { const point = sorted[k]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop(); upper.push(point); }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

function boxArea(hull: number[][], degrees: number) {
  const r = degrees * Math.PI / 180, cos = Math.cos(r), sin = Math.sin(r);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of hull) {
    const u = x * cos - y * sin, v = x * sin + y * cos;
    if (u < minX) minX = u; if (u > maxX) maxX = u; if (v < minY) minY = v; if (v > maxY) maxY = v;
  }
  return (maxX - minX) * (maxY - minY);
}

/**
 * Dominant edge orientation (Sobel gradients, modulo 90°) as a correction angle,
 * and how concentrated it is. Text and geometric artwork give a sharp peak even
 * when the silhouette is irregular; round or noisy shapes give a flat histogram.
 */
function edgeAngle(image: RGBAImage): {angle: number; strength: number} {
  const {width, height, data} = image;
  const f = Math.max(1, Math.ceil(Math.max(width, height) / 360));
  const w = Math.floor(width / f), h = Math.floor(height / f);
  if (w < 8 || h < 8) return {angle: 0, strength: 0};
  // Luminance over mid grey, so transparent edges count as edges too.
  const gray = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let dy = 0; dy < f; dy++) for (let dx = 0; dx < f; dx++) {
      const i = ((y * f + dy) * width + x * f + dx) * 4, a = data[i + 3] / 255;
      sum += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) * a + 128 * (1 - a);
    }
    gray[y * w + x] = sum / (f * f);
  }
  const magnitude = new Float32Array(w * h), direction = new Float32Array(w * h);
  let strongest = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const p = y * w + x, g = (dx: number, dy: number) => gray[p + dy * w + dx];
    const gx = g(1, -1) + 2 * g(1, 0) + g(1, 1) - g(-1, -1) - 2 * g(-1, 0) - g(-1, 1);
    const gy = g(-1, 1) + 2 * g(0, 1) + g(1, 1) - g(-1, -1) - 2 * g(0, -1) - g(1, -1);
    magnitude[p] = Math.hypot(gx, gy);
    direction[p] = Math.atan2(gy, gx) * 180 / Math.PI;
    if (magnitude[p] > strongest) strongest = magnitude[p];
  }
  if (!strongest) return {angle: 0, strength: 0};
  const bins = new Float64Array(90);
  let total = 0;
  for (let p = 0; p < magnitude.length; p++) {
    if (magnitude[p] < strongest * 0.2) continue;
    // Bin b holds orientations in [b - 45°, b - 44°); horizontal and vertical edges both fall in bin 45.
    bins[Math.floor((((direction[p] + 45) % 90) + 90) % 90) % 90] += magnitude[p];
    total += magnitude[p];
  }
  const at = (bin: number) => bins[((bin % 90) + 90) % 90];
  let peak = 0, peakValue = -1;
  for (let b = 0; b < 90; b++) {
    const value = at(b - 2) + 2 * at(b - 1) + 3 * at(b) + 2 * at(b + 1) + at(b + 2);
    if (value > peakValue) { peakValue = value; peak = b; }
  }
  let near = 0;
  for (let offset = -2; offset <= 2; offset++) near += at(peak + offset);
  // Fine angle: the rotation that makes edge projections sharpest (aligned rows and columns).
  const points: number[] = [];
  for (let p = 0; p < magnitude.length; p++) if (magnitude[p] >= strongest * 0.2) points.push(p % w, Math.floor(p / w), magnitude[p]);
  const size = Math.ceil(Math.hypot(w, h)) + 2, rows = new Float64Array(size * 2), cols = new Float64Array(size * 2);
  let tilt = peak + 0.5 - 45, bestScore = -1;
  for (let candidate = peak - 45 - 2; candidate <= peak - 45 + 3; candidate += 0.1) {
    const r = candidate * Math.PI / 180, cos = Math.cos(r), sin = Math.sin(r);
    rows.fill(0); cols.fill(0);
    for (let k = 0; k < points.length; k += 3) {
      const x = points[k] - w / 2, y = points[k + 1] - h / 2, m = points[k + 2];
      rows[Math.round(-x * sin + y * cos) + size] += m;
      cols[Math.round(x * cos + y * sin) + size] += m;
    }
    let score = 0;
    for (let k = 0; k < rows.length; k++) score += rows[k] * rows[k] + cols[k] * cols[k];
    if (score > bestScore) { bestScore = score; tilt = candidate; }
  }
  return {angle: -tilt, strength: near / Math.max(1e-9, total)};
}

/**
 * Rotation (degrees, canvas convention) that makes the artwork level. Combines
 * the dominant edge orientation with the minimum-area rectangle around the
 * convex hull: the edge angle wins when it is clear and keeps the box compact,
 * the rectangle confirms it or decides for clean silhouettes. 0 when there is no
 * clear orientation or the tilt is outside 2°–30°.
 */
export function straighteningAngle(image: RGBAImage): number {
  const hull = convexHull(hullPoints(image));
  if (hull.length < 3) return 0;
  let best = 0, bestArea = boxArea(hull, 0);
  for (let degrees = -45; degrees <= 45; degrees += 0.5) { const area = boxArea(hull, degrees); if (area < bestArea - 1e-6) { bestArea = area; best = degrees; } }
  for (let degrees = best - 0.5; degrees <= best + 0.5; degrees += 0.05) { const area = boxArea(hull, degrees); if (area < bestArea - 1e-6) { bestArea = area; best = degrees; } }
  let hullArea = 0;
  for (let k = 0; k < hull.length; k++) { const [x1, y1] = hull[k], [x2, y2] = hull[(k + 1) % hull.length]; hullArea += x1 * y2 - x2 * y1; }
  hullArea = Math.abs(hullArea) / 2;
  const fill = hullArea / bestArea, gain = boxArea(hull, 0) / bestArea;
  const edges = edgeAngle(image);
  let angle = 0;
  if (edges.strength >= 0.18 && boxArea(hull, edges.angle) <= bestArea * 1.08) angle = Math.abs(edges.angle - best) <= 2.5 ? best : edges.angle;
  else if (fill >= 0.62 && gain >= 1.03) angle = best;
  if (Math.abs(angle) < MIN_ANGLE || Math.abs(angle) > MAX_ANGLE) return 0;
  return Math.round(angle * 10) / 10;
}

/** Bilinear rotation on premultiplied alpha, so edges get no dark fringe. */
function rotate(image: RGBAImage, degrees: number): RGBAImage {
  const r = degrees * Math.PI / 180, cos = Math.cos(r), sin = Math.sin(r);
  const {width: w, height: h, data} = image;
  const width = Math.ceil(Math.abs(w * cos) + Math.abs(h * sin)), height = Math.ceil(Math.abs(w * sin) + Math.abs(h * cos));
  const out = new Uint8ClampedArray(width * height * 4);
  const cx = w / 2, cy = h / 2, ox = width / 2, oy = height / 2;
  const acc = [0, 0, 0, 0];
  const add = (x: number, y: number, weight: number) => {
    if (weight <= 0 || x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (y * w + x) * 4, a = data[i + 3] * weight;
    acc[0] += data[i] * a; acc[1] += data[i + 1] * a; acc[2] += data[i + 2] * a; acc[3] += a;
  };
  for (let v = 0; v < height; v++) for (let u = 0; u < width; u++) {
    const dx = u + 0.5 - ox, dy = v + 0.5 - oy;
    const sx = dx * cos + dy * sin + cx - 0.5, sy = -dx * sin + dy * cos + cy - 0.5;
    const x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0;
    if (x0 < -1 || y0 < -1 || x0 >= w || y0 >= h) continue;
    acc[0] = acc[1] = acc[2] = acc[3] = 0;
    add(x0, y0, (1 - fx) * (1 - fy)); add(x0 + 1, y0, fx * (1 - fy)); add(x0, y0 + 1, (1 - fx) * fy); add(x0 + 1, y0 + 1, fx * fy);
    if (acc[3] <= 0.5) continue;
    const o = (v * width + u) * 4;
    out[o] = clampByte(acc[0] / acc[3]); out[o + 1] = clampByte(acc[1] / acc[3]); out[o + 2] = clampByte(acc[2] / acc[3]); out[o + 3] = clampByte(acc[3]);
  }
  return {width, height, data: out};
}

/** The whole pipeline on raw pixels. Returns the original image when nothing helps. */
export function autofitPixels(source: RGBAImage, options: AutofitOptions = {}): {image: RGBAImage; report: AutofitReport} {
  const unchanged = {image: source, report: {changed: false, removedBackground: false, trimmed: false, angle: 0, background: null, width: source.width, height: source.height}};
  if (source.width < 8 || source.height < 8) return unchanged;
  let image = source, removedBackground = false, background: string | null = null;
  const bg = estimateBackground(source);
  if (bg && bg !== 'transparent') {
    const mask = floodBackground(source, bg);
    let removed = 0;
    for (let k = 0; k < mask.length; k++) removed += mask[k];
    const wide = () => {
      const masked = new Uint8ClampedArray(source.data);
      for (let k = 0; k < mask.length; k++) if (mask[k]) masked[k * 4 + 3] = 0;
      const box = contentBox({...source, data: masked});
      return box ? (box.x1 - box.x0) / Math.max(1, box.y1 - box.y0) >= 1.8 : false;
    };
    const foreground = mask.length - removed;
    // A solid or almost empty result means there was no background to remove.
    if (removed >= mask.length * 0.01 && foreground >= mask.length * 0.004) {
      const local = backgroundMap(source, mask);
      if (options.fillHoles && wide()) clearHoles(source, mask, bg, local);
      image = applyMask(source, mask, bg, local);
      removedBackground = true;
      background = hex(bg.rgb);
    }
  }
  let hasAlpha = removedBackground;
  if (!hasAlpha) for (let k = 3; k < image.data.length; k += 4) if (image.data[k] < MASK_ALPHA) { hasAlpha = true; break; }
  if (!hasAlpha) return unchanged;
  const box = contentBox(image);
  if (!box) return unchanged;
  const pad = Math.round(Math.max(image.width, image.height) * 0.015) + 1;
  // Margins wider than the padding we keep; an already fitted image stays as it is.
  let trimmed = box.x1 - box.x0 + 2 * pad < image.width * 0.97 || box.y1 - box.y0 + 2 * pad < image.height * 0.97;
  if (trimmed) image = crop(image, box, pad);
  const angle = straighteningAngle(image);
  if (angle) {
    image = rotate(image, angle);
    const rotatedBox = contentBox(image);
    if (rotatedBox) image = crop(image, rotatedBox, pad);
    trimmed = true;
  }
  const changed = removedBackground || trimmed || angle !== 0;
  return changed ? {image, report: {changed, removedBackground, trimmed, angle, background, width: image.width, height: image.height}} : unchanged;
}

// ---- Browser helpers (canvas) ----

async function decode(source: Blob | string): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof source !== 'string' && typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(source); } catch { /* Fall back to an <img>. */ }
  }
  const url = typeof source === 'string' ? source : URL.createObjectURL(source);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } catch {
    throw new Error('No pudimos abrir la imagen. Vuelve a cargarla.');
  } finally {
    if (typeof source !== 'string') URL.revokeObjectURL(url);
  }
}

function naturalSize(image: ImageBitmap | HTMLImageElement | HTMLCanvasElement) {
  return 'naturalWidth' in image ? {width: image.naturalWidth, height: image.naturalHeight} : {width: image.width, height: image.height};
}

function canvasOf(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d', {willReadFrequently: true});
  if (!context) throw new Error('Tu navegador no pudo preparar la imagen.');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  return {canvas, context};
}

function encode(canvas: HTMLCanvasElement, quality: number) {
  const webp = canvas.toDataURL('image/webp', quality);
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png');
}

/**
 * Fits an uploaded logo: transparent background, trimmed and level. Accepts a
 * canvas (the decoded upload) or an image URL / data URL. Works at up to
 * `maxSide` pixels: a logo never shows larger and the AI receives 1024 px.
 */
export async function autofitImage(source: HTMLCanvasElement | string, options: AutofitOptions = {}, maxSide = 1000): Promise<AutofitResult> {
  const decoded = typeof source === 'string' ? await decode(source) : source;
  const size = naturalSize(decoded);
  const scale = Math.min(1, maxSide / Math.max(size.width, size.height));
  let canvas: HTMLCanvasElement;
  if (typeof source !== 'string' && scale === 1) canvas = source;
  else {
    const target = canvasOf(Math.max(1, Math.round(size.width * scale)), Math.max(1, Math.round(size.height * scale)));
    target.context.drawImage(decoded, 0, 0, target.canvas.width, target.canvas.height);
    if ('close' in decoded) decoded.close();
    canvas = target.canvas;
  }
  const context = canvas.getContext('2d', {willReadFrequently: true});
  if (!context) throw new Error('Tu navegador no pudo preparar la imagen.');
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  const {image, report} = autofitPixels({width: pixels.width, height: pixels.height, data: pixels.data}, options);
  if (!report.changed) return {...report, data: '', ratio: canvas.width / canvas.height};
  const out = canvasOf(image.width, image.height);
  out.context.putImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0);
  return {...report, data: encode(out.canvas, 0.92), ratio: image.width / image.height};
}

/**
 * Downscales and re-encodes an image for the AI service (its requests must stay
 * under 4 MB). WebP when the browser can encode it, otherwise PNG (keeps
 * transparency) or JPEG over the editor background.
 */
export async function shrinkImage(blob: Blob, options: {maxSide: number; quality: number; alpha: boolean; skipBelowBytes?: number}): Promise<Blob> {
  const decoded = await decode(blob);
  const size = naturalSize(decoded);
  const scale = Math.min(1, options.maxSide / Math.max(size.width, size.height));
  // Already small, in a compact format and within the size: send the same bytes.
  if (scale === 1 && blob.type !== 'image/png' && options.skipBelowBytes && blob.size <= options.skipBelowBytes) {
    if ('close' in decoded) decoded.close();
    return blob;
  }
  const {canvas, context} = canvasOf(Math.max(1, Math.round(size.width * scale)), Math.max(1, Math.round(size.height * scale)));
  if (!options.alpha) { context.fillStyle = '#101712'; context.fillRect(0, 0, canvas.width, canvas.height); }
  context.drawImage(decoded, 0, 0, canvas.width, canvas.height);
  if ('close' in decoded) decoded.close();
  const toBlob = (type: string, quality?: number) => new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));
  const webp = await toBlob('image/webp', options.quality);
  if (webp && webp.type === 'image/webp') return webp;
  const fallback = options.alpha ? await toBlob('image/png') : await toBlob('image/jpeg', options.quality);
  if (!fallback) throw new Error('Tu navegador no pudo preparar la imagen para la IA.');
  return fallback;
}
