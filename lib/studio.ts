export type TemplateElements = {
  brand: boolean;
  teamName: boolean;
  playerName: boolean;
  playerNumber: boolean;
  trim: boolean;
  pattern: boolean;
};

export const DEFAULT_ELEMENTS: TemplateElements = {
  brand: true, teamName: true, playerName: true, playerNumber: true, trim: true, pattern: true,
};
export const ELEMENT_LABELS: Record<keyof TemplateElements, string> = {
  brand: 'Marcas Tony', teamName: 'Nombre del equipo', playerName: 'Nombre del jugador',
  playerNumber: 'Dorsal del jugador', trim: 'Adornos y franjas laterales', pattern: 'Patrón de la plantilla',
};
export const MAX_LAYERS = 16;
export const TECHNIQUES = [
  { value: 'full-sublimation', label: 'Full sublimado', description: 'Diseño a todo color en toda la prenda.' },
  { value: 'partial-sublimation', label: 'Sublimado parcial', description: 'Personalización en zonas específicas.' },
  { value: 'print', label: 'Estampado', description: 'Gráficos, escudos y textos sobre una base de color.' },
  { value: 'embroidery', label: 'Bordado', description: 'Escudos o detalles con acabado en hilo.' },
  { value: 'define', label: 'Asesorarme con Tony', description: 'Elegimos la técnica según tu diseño y tu tela.' },
] as const;
export type Technique = typeof TECHNIQUES[number]['value'];
export const techniqueLabel = (value: Technique) => TECHNIQUES.find(item => item.value === value)?.label ?? 'Asesorarme con Tony';

/** Positions and dimensions use percentages of the 480 × 560 garment canvas. */
export type StudioLayer = {
  id: string; name: string; kind: 'image' | 'text'; side: 'front' | 'back';
  x: number; y: number; width: number; height: number; rotation: number; opacity: number;
  visible: boolean; locked: boolean; assetKey?: string; text?: string; color: string; bold: boolean;
};

const number = (value: unknown, fallback: number, min: number, max: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
export const isAssetKey = (key: string) => /^(front|back|crest|layer-[a-zA-Z0-9_-]{1,100})$/.test(key);
export function readElements(raw: unknown): TemplateElements {
  const result = { ...DEFAULT_ELEMENTS };
  if (raw && typeof raw === 'object') {
    for (const key of Object.keys(result) as (keyof TemplateElements)[]) {
      const value = (raw as Record<string, unknown>)[key];
      if (typeof value === 'boolean') result[key] = value;
    }
  }
  return result;
}
export function readLayers(raw: unknown): StudioLayer[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw.slice(0, MAX_LAYERS).flatMap((item): StudioLayer[] => {
    if (!item || typeof item !== 'object') return [];
    const v = item as Record<string, unknown>;
    if ((v.kind !== 'image' && v.kind !== 'text') || typeof v.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(v.id) || seen.has(v.id)) return [];
    if (v.kind === 'image' && (typeof v.assetKey !== 'string' || !isAssetKey(v.assetKey))) return [];
    seen.add(v.id);
    return [{ id: v.id, name: typeof v.name === 'string' ? v.name.slice(0, 80) : 'Elemento propio',
      kind: v.kind, side: v.side === 'back' ? 'back' : 'front',
      x: number(v.x, 50, 0, 100), y: number(v.y, 45, 0, 100),
      width: number(v.width, 25, 2, 200), height: number(v.height, 20, 2, 200),
      rotation: number(v.rotation, 0, -180, 180), opacity: number(v.opacity, 1, 0, 1),
      visible: v.visible !== false, locked: v.locked === true,
      ...(v.kind === 'image' ? { assetKey: v.assetKey as string } : { text: typeof v.text === 'string' ? v.text.slice(0, 60) : '' }),
      color: typeof v.color === 'string' && /^#[\da-f]{6}$/i.test(v.color) ? v.color : '#17251B', bold: v.bold !== false,
    }];
  });
}
