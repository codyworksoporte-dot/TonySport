// Text helpers for the assistant: accent-insensitive normalization and keyword matching.

/** Lowercase, no accents, no punctuation, single spaces: "¿Dónde QUEDA Lourdes?" -> "donde queda lourdes". */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export type Matcher = (normalized: string) => boolean;

/**
 * Builds a matcher for one keyword or phrase, applied to normalized text.
 * Words match whole, with an optional plural: "balon" matches "balon" and "balones", never "balonazo".
 * A trailing * matches any ending: "promo*" matches "promo", "promocion" and "promociones".
 * Phrases match their words in order: "donde queda*" matches "donde quedan".
 */
export function keyword(pattern: string): Matcher {
  const body = normalize(pattern);
  if (!body) return () => false;
  const tail = pattern.trim().endsWith('*') ? '[a-z0-9]*' : '(?:es|s)?';
  const regex = new RegExp(`(?:^| )${body}${tail}(?= |$)`);
  return text => regex.test(text);
}

/** Weighted keywords: the score is the sum of the weights of every keyword found. */
export type Weighted = readonly (readonly [string, number])[];
export function scorer(keys: Weighted): (normalized: string) => number {
  const compiled = keys.map(([pattern, weight]) => [keyword(pattern), weight] as const);
  return text => compiled.reduce((sum, [match, weight]) => sum + (match(text) ? weight : 0), 0);
}

/** A lookup table from keywords to values. Longer phrases are tried first ("santa rosa de lima" before "santa rosa"). */
export function table<T>(rows: readonly (readonly [string, T])[]): (normalized: string) => T[] {
  const compiled = rows
    .map(([pattern, value]) => ({match: keyword(pattern), value, size: normalize(pattern).length}))
    .sort((a, b) => b.size - a.size);
  return text => {
    const found: T[] = [];
    for (const row of compiled) if (row.match(text) && !found.includes(row.value)) found.push(row.value);
    return found;
  };
}
