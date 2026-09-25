// Regenerates the scale texture and its joint layer from one geometry: node scripts/generate-scales.mjs
import { writeFileSync } from 'node:fs';
import { SCALE_TILE, buildScalePattern, renderScaleBaseSvg, renderScaleJointsSvg } from '../lib/scale-pattern.ts';

const pattern = buildScalePattern(SCALE_TILE);
const base = renderScaleBaseSvg(pattern, SCALE_TILE);
const joints = renderScaleJointsSvg(pattern);
writeFileSync(new URL('../public/assets/escamas-tony-base.svg', import.meta.url), base);
writeFileSync(new URL('../public/assets/escamas-tony-uniones.svg', import.meta.url), joints);
console.log(`${pattern.cells.length} escamas, ${pattern.edges.length} uniones · base ${(base.length / 1024).toFixed(1)} KB · uniones ${(joints.length / 1024).toFixed(1)} KB`);
