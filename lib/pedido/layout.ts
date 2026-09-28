import type {PedidoDesign, PedidoDraft, PedidoLayer} from './types';

/**
 * Where each piece goes on a jersey, in percent of the 800 × 1000 editor canvas.
 * The customer never types positions: a crest lands on the chest, the name and a
 * big number on the back, sponsors big across the chest. Catalogue sheets use the
 * same three-quarter mannequin, so their spots are measured on it; own designs
 * are assumed to be a centred garment.
 */
export type Role = 'Escudo' | 'Marca' | 'Sponsor' | 'Nombre' | 'Número' | 'Equipo' | 'Texto';
type Zone = {side: 'front' | 'back'; x: number; y: number; width: number; height: number; fontSize?: number};

const CATALOG: Record<string, Zone[]> = {
  Escudo: [{side: 'front', x: 58, y: 25, width: 10, height: 9}],
  Marca: [{side: 'front', x: 37, y: 26, width: 9, height: 6}],
  Sponsor: [{side: 'front', x: 47, y: 37, width: 30, height: 10}, {side: 'back', x: 40, y: 47, width: 26, height: 6}, {side: 'front', x: 47, y: 48, width: 22, height: 6}],
  Nombre: [{side: 'back', x: 40, y: 14.5, width: 26, height: 7, fontSize: 62}],
  Número: [{side: 'back', x: 40, y: 31, width: 24, height: 24, fontSize: 240}],
  Equipo: [{side: 'back', x: 40, y: 55, width: 26, height: 6, fontSize: 44}],
  Texto: [{side: 'front', x: 47, y: 50, width: 30, height: 7, fontSize: 48}],
};
const CENTRED: Record<string, Zone[]> = {
  Escudo: [{side: 'front', x: 62, y: 28, width: 11, height: 10}],
  Marca: [{side: 'front', x: 38, y: 28, width: 10, height: 7}],
  Sponsor: [{side: 'front', x: 50, y: 42, width: 34, height: 11}, {side: 'back', x: 50, y: 56, width: 30, height: 7}, {side: 'front', x: 50, y: 55, width: 24, height: 7}],
  Nombre: [{side: 'back', x: 50, y: 18, width: 32, height: 7, fontSize: 66}],
  Número: [{side: 'back', x: 50, y: 36, width: 28, height: 26, fontSize: 250}],
  Equipo: [{side: 'back', x: 50, y: 64, width: 30, height: 6, fontSize: 46}],
  Texto: [{side: 'front', x: 50, y: 56, width: 32, height: 7, fontSize: 50}],
};

/** Text layers are recognised by their name; images by their type. */
export function roleOf(layer: PedidoLayer): Role {
  if (layer.type !== 'Texto') return layer.type;
  return (['Nombre', 'Número', 'Equipo'] as const).find(role => layer.name === role) ?? 'Texto';
}

/** The spot for the n-th piece of a role (sponsors fill the chest, then the back). */
export function zoneFor(design: PedidoDesign, role: Role, index = 0): Zone {
  const zones = (design.source === 'catalog' ? CATALOG : CENTRED)[role];
  return zones[Math.min(index, zones.length - 1)];
}

/** Keeps an image's proportions inside its spot. */
export function fitImage(zone: Zone, ratio: number) {
  const byWidth = {width: zone.width, height: zone.width * 800 / 1000 / ratio};
  return byWidth.height <= zone.height ? byWidth : {width: zone.height * 1000 / 800 * ratio, height: zone.height};
}

export const newId = () => globalThis.crypto?.randomUUID?.() || `capa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export function textLayer(design: PedidoDesign, role: 'Nombre' | 'Número' | 'Equipo' | 'Texto', text: string, color: string, index = 0): PedidoLayer {
  const zone = zoneFor(design, role, index);
  return {id: newId(), side: zone.side, type: 'Texto', name: role, text, x: zone.x, y: zone.y, width: zone.width, height: zone.height, rotation: 0, color, fontSize: zone.fontSize ?? 48, visible: true};
}

/** The example shown on the back: each shirt will carry its own player's name and number. */
export function samplePlayer(draft: PedidoDraft) {
  const player = draft.players.find(item => item.name.trim() || item.number) ?? draft.players[0];
  return {name: (player?.name.trim() || 'NOMBRE').toUpperCase().slice(0, 18), number: player?.number || '10'};
}

/** Back to its spot, at its original size. */
export function resetToZone(design: PedidoDesign, layer: PedidoLayer, ratio = 1): Partial<PedidoLayer> {
  const role = roleOf(layer);
  const index = role === 'Sponsor' ? design.layers.filter(item => item.type === 'Sponsor').findIndex(item => item.id === layer.id) : 0;
  const zone = zoneFor(design, role, Math.max(0, index));
  if (layer.type === 'Texto') return {side: zone.side, x: zone.x, y: zone.y, width: zone.width, height: zone.height, fontSize: zone.fontSize ?? 48, rotation: 0};
  return {side: zone.side, x: zone.x, y: zone.y, rotation: 0, ...fitImage(zone, ratio)};
}

/** Grow or shrink around the centre; text grows with its box. */
export function scaleLayer(layer: PedidoLayer, factor: number): Partial<PedidoLayer> {
  const width = Math.min(100, Math.max(3, layer.width * factor)), applied = width / layer.width;
  const height = Math.min(100, Math.max(2, layer.height * applied));
  return {width, height, ...(layer.type === 'Texto' ? {fontSize: Math.min(300, Math.max(10, Math.round(layer.fontSize * applied)))} : {})};
}
