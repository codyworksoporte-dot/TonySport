// Builds the three prompts. The assembly mirrors backend/pedido-api/prompts.php;
// only the structured MANDATORY MODEL lines (from `spec`) are exclusive to this service.
import {TEXT as T} from './prompt-text.js';

const fill = (text, values) => text.replace(/\{([A-Z_]+)\}/g, (match, key) => (key in values ? values[key] : match));

function variables(side, product) {
  const shirt = product === 'shirt';
  return {
    VIEW: side === 'back' ? 'BACK VIEW' : 'FRONT VIEW',
    GARMENT: shirt ? T.garment_shirt : T.garment_uniform,
    LAYOUT: shirt ? T.layout_shirt : T.layout_uniform,
    COUNT: shirt ? T.count_shirt : T.count_uniform,
    COUNT_ES: shirt ? T.count_es_shirt : T.count_es_uniform,
    PARTS: shirt ? T.parts_shirt : T.parts_uniform,
  };
}

const MOLDS = {
  'Estándar': 'Estándar (standard cut): set-in sleeves with the shoulder seam on top of the shoulder, regular athletic fit.',
  Raglan: 'Raglan: raglan sleeves with diagonal seams running from the neckline to the underarm, no shoulder seam.',
  'Primera División': 'Primera División (pro cut): slim athletic professional-club fit with shaped side panels and modern performance construction.',
};
const COLLARS = {
  V: 'V (V-neck collar).',
  Redondo: 'Redondo (round crew-neck collar).',
  Chino: 'Chino (mandarin stand-up band collar, without fold-down flaps).',
  Polo: 'Polo (fold-down polo collar with a short button placket).',
};
const SLEEVES = {
  Corta: 'Corta (short sleeves ending above the elbow).',
  Larga: 'Larga (long sleeves down to the wrist, with cuffs).',
};
const FABRICS = {
  'Slim Fit': 'Slim Fit (light, smooth, body-adapting sports knit).',
  'Slim Pro': 'Slim Pro (semi-light smooth knit with intense colours and good air flow).',
  'Modern Carving': 'Modern Carving (stretch knit with tiny micro-perforations).',
  Dryfit: 'Dryfit (breathable, semi-light, moisture-wicking sports polyester).',
  Premier: 'Premier (high-performance microfibre with a subtle hexagonal texture and intense colours).',
  Drycool: 'Drycool (ultralight, ultra-breathable, quick-dry performance knit).',
};
const GENDERS = {
  Hombre: "Hombre (men's cut: straight athletic fit).",
  Mujer: "Mujer (women's cut: fitted silhouette with a slightly tapered waist).",
};
const SPORTS = [[/f[uú]tbol|soccer/i, 'soccer'], [/v[oó]le|volley/i, 'volleyball'], [/balonc|basket/i, 'basketball'], [/empresa|corporat/i, 'corporate team wear']];

const pick = (table, value) => (typeof value === 'string' && Object.hasOwn(table, value) ? table[value] : '');
const safeLine = value => (typeof value === 'string' ? value.replace(/[^\p{L}\p{N} .,'()-]/gu, '').trim().slice(0, 40) : '');

/** English, whitelisted description of the client's selections; empty when there is no spec. */
export function specLines(spec, product) {
  if (!spec || typeof spec !== 'object') return [];
  const lines = [product === 'shirt'
    ? '- Product: ONE full-sublimation jersey only, no shorts.'
    : '- Product: full-sublimation team uniform = ONE jersey + ONE matching pair of shorts.'];
  const line = safeLine(spec.catalogLine);
  if (line) {
    const sport = SPORTS.find(([pattern]) => pattern.test(line));
    lines.push(`- Sport line: ${line}${sport ? ` (${sport[1]})` : ''}.`);
  }
  const rows = [['Cut', pick(GENDERS, spec.gender)], ['Mold', pick(MOLDS, spec.mold)], ['Collar', pick(COLLARS, spec.collar)], ['Sleeves', pick(SLEEVES, spec.sleeve)], ['Fabric', pick(FABRICS, spec.fabric)]];
  for (const [label, text] of rows) if (text) lines.push(`- ${label}: ${text}`);
  if (spec.brand === 'Tony') lines.push('- Sports brand: Tony Sportswear. Do not add any other sportswear brand.');
  if (spec.brand === 'Propia') lines.push("- Sports brand: the client's own brand, placed later as a separate element. Do not invent one.");
  if (typeof spec.brand3d === 'boolean') lines.push(`- Sports-brand finish: ${spec.brand3d ? '3D high relief' : 'flat sublimation'}.`);
  if (typeof spec.crest3d === 'boolean') lines.push(`- Crest finish: ${spec.crest3d ? '3D high relief' : 'flat sublimation'}.`);
  const code = typeof spec.catalogCode === 'string' && /^[A-Z0-9][A-Z0-9-]{1,23}$/.test(spec.catalogCode) ? spec.catalogCode : '';
  if (code) lines.push(`- Base design: Tony catalogue design ${code}${line ? ` (${line} line)` : ''}. Keep that design.`);
  else if (spec.source === 'own') lines.push("- Base design: the client's own upload. It may be crooked, in perspective, on a background or wrinkled: extract the design and present it straight on this model.");
  return lines;
}

function withRules(prompt, rules) {
  return rules ? `${prompt}\n\n${T.rules_header}\n${rules}` : prompt;
}

export function generatePrompt({side = 'front', product = 'uniform', rules = '', spec = null} = {}) {
  const shirt = product === 'shirt';
  const lines = specLines(spec, product);
  const parts = [
    T.generate_intro,
    T.generate_repair,
    [T.model_header, lines.length ? lines.join('\n') : T.model_from_rules, T.model_rules, shirt ? T.product_shirt : T.product_uniform].join('\n'),
    shirt ? '' : T.generate_shorts,
    side === 'back' ? T.generate_back : T.generate_front,
    T.generate_presentation,
    T.generate_check,
  ];
  return withRules(fill(parts.filter(Boolean).join('\n\n'), variables(side, product)), rules);
}

export function finalizePrompt({side = 'front', product = 'uniform', rules = '', spec = null} = {}) {
  const shirt = product === 'shirt';
  const lines = specLines(spec, product);
  const parts = [
    T.finalize_intro,
    T.finalize_inputs,
    T.finalize_repair,
    T.finish_default,
    T.finalize_keep,
    [T.model_header, lines.length ? lines.join('\n') : T.model_from_rules, T.finalize_model_rules, shirt ? T.product_shirt : T.product_uniform].join('\n'),
    T.finalize_geometry,
    T.finalize_check,
  ];
  return withRules(fill(parts.join('\n\n'), variables(side, product)), rules);
}

export function erasePrompt({side = 'front', region}) {
  const {x, y, w, h} = region;
  return fill(T.erase, {
    SIDE: side === 'back' ? 'back' : 'front',
    X: x.toFixed(4), Y: y.toFixed(4), W: w.toFixed(4), H: h.toFixed(4),
    XP: (x * 100).toFixed(1), YP: (y * 100).toFixed(1), WP: (w * 100).toFixed(1), HP: (h * 100).toFixed(1),
  });
}

const ELEMENT_NAMES = {Escudo: 'crest (escudo)', Marca: 'sports brand mark (marca)', Sponsor: 'sponsor (patrocinador)'};

/** Label placed before each original file in the finalize request. */
export function assetLabel(index, asset) {
  return `Original file ${index + 1}: ${ELEMENT_NAMES[asset.type] || asset.type} / ${asset.name}. Use it only as the artwork reference for that element.`;
}

export function buildPrompt(input) {
  if (input.operation === 'magic_eraser') return erasePrompt(input);
  if (input.operation === 'finalize') return finalizePrompt(input);
  return generatePrompt(input);
}
