// What the assistant knows, read from the site's own data: stores, disciplines, implementos and the
// site directory. Only lookups live here; the wording of the answers is in engine.ts.
import storeData from '@/data/tony-stores.json';
import {DISCIPLINES, type Discipline} from '@/lib/disciplines';
import {IMPLEMENT_FAMILIES, type ImplementFamily} from '@/lib/implements';
import {SITE_DIRECTORY, type DirectoryEntry} from '@/lib/site-directory';
import {keyword, normalize, table} from './text';

export type Store = {name: string; address: string; phone: string; mapUrl: string; zone: string};
export const STORES: readonly Store[] = storeData;

const store = (name: string) => STORES.find(item => item.name === name);
const storeRows: [string, Store][] = STORES.map(item => [item.name, item]);
for (const [alias, name] of [
  ['tecla', 'Santa Tecla'], ['novocentro', 'Santa Tecla'], ['santa rosa', 'Santa Rosa de Lima'],
  ['gotera', 'San Francisco Gotera'], ['zacate', 'Zacatecoluca'], ['chalate', 'Chalatenango'],
  ['triunfo', 'El Triunfo'], ['plaza lourdes', 'Lourdes'],
] as const) {
  const found = store(name);
  if (found) storeRows.push([alias, found]);
}
const storeTable = table(storeRows);
/** Stores named in the text ("¿dónde queda la tienda de Lourdes?" -> [Lourdes]). */
export const findStores = (text: string): Store[] => storeTable(normalize(text));

const zoneTable = table([
  ['oriente', 'Oriente'], ['oriental', 'Oriente'], ['zona oriental', 'Oriente'],
  ['occidente', 'Occidente'], ['occidental', 'Occidente'], ['zona occidental', 'Occidente'],
  ['paracentral', 'Paracentral'], ['zona central', 'Centro'], ['zona centro', 'Centro'],
]);
export const findZone = (text: string): string | undefined => zoneTable(normalize(text))[0];
export const storesInZone = (zone: string) => STORES.filter(item => item.zone === zone);
export const telHref = (phone: string) => `tel:+503${phone.replace(/\D/g, '')}`;

// Disciplines: the words people use for each line. Implementos are answered by their own families below.
const disciplineTable = table<string>([
  ['futbol', 'futbol'], ['soccer', 'futbol'], ['futbolito', 'futbol'], ['futsal', 'futbol'], ['futbol sala', 'futbol'],
  ['baloncesto', 'bkb'], ['basquet', 'bkb'], ['basquetbol', 'bkb'], ['basket', 'bkb'], ['basketball', 'bkb'], ['bkb', 'bkb'],
  ['voleibol', 'voleibol'], ['volibol', 'voleibol'], ['voley', 'voleibol'], ['volley', 'voleibol'], ['volleyball', 'voleibol'],
  ['ciclismo', 'ciclismo'], ['ciclista', 'ciclismo'], ['bicicleta', 'ciclismo'], ['bici', 'ciclismo'], ['mtb', 'ciclismo'],
  ['running', 'runners'], ['runner', 'runners'], ['correr', 'runners'], ['corredor', 'runners'], ['maraton', 'runners'], ['atletismo', 'runners'],
  ['racing', 'racing'], ['motocross', 'racing'], ['moto', 'racing'], ['motociclismo', 'racing'], ['piloto', 'racing'],
  ['empresa', 'empresarial'], ['empresarial', 'empresarial'], ['corporativo', 'empresarial'], ['oficina', 'empresarial'], ['negocio', 'empresarial'],
  ['camisa', 'camisas-polos'], ['polo', 'camisas-polos'], ['casual', 'camisas-polos'],
  ['replica', 'replicas'],
  ['hoddie', 'hoddies'], ['hoodie', 'hoddies'], ['sudadera', 'hoddies'], ['sueter', 'hoddies'], ['buzo', 'hoddies'], ['chumpa', 'hoddies'],
  ['molde', 'moldes'], ['raglan', 'moldes'],
  ['logo 3d', 'logos-3d'], ['3d', 'logos-3d'], ['relieve', 'logos-3d'],
]);
/** Disciplines named in the text, at most three. */
export function findDisciplines(text: string): Discipline[] {
  return disciplineTable(normalize(text))
    .map(id => DISCIPLINES.find(item => item.id === id))
    .filter((item): item is Discipline => !!item)
    .slice(0, 3);
}

const has = (patterns: string[]) => {
  const matchers = patterns.map(keyword);
  return (text: string) => matchers.some(match => match(text));
};
const ball = has(['balon', 'pelota', 'bola']);
const baseball = has(['beisbol', 'bate', 'softbol']);
const basketball = has(['baloncesto', 'basquet', 'basquetbol', 'basket', 'basketball', 'bkb']);
const futsal = has(['futsal', 'futbol sala', 'futsala', 'sala']);
const volleyball = has(['voleibol', 'volibol', 'voley', 'volley', 'volleyball']); // no volleyball balls in the list
const gloves = has(['guante', 'portero', 'arquero', 'guardameta']);
const shinGuards = has(['espinillera', 'canillera', 'chimpinillera']);
const nets = has(['malla', 'red de porteria', 'red para porteria', 'porteria']);
const accessories = has(['cono', 'silbato', 'pito', 'bomba', 'inflador', 'aguja', 'sellador', 'accesorio']);

/** The implementos family a product word points to ("quiero un balón" -> Balones de fútbol). */
export function findImplementFamily(text: string): ImplementFamily | undefined {
  const words = normalize(text);
  const id = baseball(words) ? 'beisbol'
    : ball(words) && basketball(words) ? 'baloncesto'
    : ball(words) && futsal(words) ? 'futsal'
    : ball(words) && volleyball(words) ? undefined
    : ball(words) ? 'balones'
    : gloves(words) ? 'guantes'
    : shinGuards(words) ? 'espinilleras'
    : nets(words) ? 'mallas'
    : accessories(words) ? 'accesorios'
    : undefined;
  return id ? IMPLEMENT_FAMILIES.find(family => family.id === id) : undefined;
}

/** The question that shows one implementos family in the chat (used by chips and family cards). */
export const FAMILY_QUESTION: Record<string, string> = {
  balones: 'Balones de fútbol', futsal: 'Balones de fútbol sala', baloncesto: 'Balones de baloncesto',
  guantes: 'Guantes de portero', espinilleras: 'Espinilleras', beisbol: 'Béisbol', mallas: 'Mallas', accesorios: 'Accesorios',
};

/** How an answer names one family inside a sentence ("Mira algunos modelos de balones de baloncesto"). */
export const FAMILY_NOUN: Record<string, string> = {
  balones: 'balones de fútbol', futsal: 'balones de fútbol sala', baloncesto: 'balones de baloncesto', guantes: 'guantes de portero',
  espinilleras: 'espinilleras', beisbol: 'artículos de béisbol', mallas: 'mallas', accesorios: 'accesorios',
};

// Site directory fallback ("¿dónde encuentro los términos?"). Sections the redesign removed from navigation
// stay out of the answers even while their routes keep working.
const STOP = new Set(('de la el los las un una unos unas y o u e a al del que en para por con sin mi mis tu tus su sus '
  + 'donde esta estan queda quedan quiero quisiera como se es son me te lo le hay tienen tiene tony ver veo busco buscar '
  + 'encuentro encontrar puedo pueden necesito sobre info informacion hola favor porfa gracias cual cuales sitio pagina web '
  + 'seccion apartado ir yo usted ustedes algo alguna algun eso esto este ese esa').split(' '));
const HIDDEN_LABEL = /tonyplay|resena|reciente|guia|catalogo y disen|70 disenos/;
const HIDDEN_HREF = /^\/(resenas|recientes|catalogo)(\/|\?|$)/;
const visible = (entry: DirectoryEntry) => entry.href !== '/' && !entry.href.startsWith('#') && !entry.href.startsWith('/#')
  && !HIDDEN_HREF.test(entry.href) && !HIDDEN_LABEL.test(normalize(entry.label));

export type DirectoryMatch = {entry: DirectoryEntry; score: number};
/** Directory entries that match the words of the question, best first. A word in the label counts double. */
export function searchDirectory(text: string, limit = 2): DirectoryMatch[] {
  const words = normalize(text).split(' ').filter(word => word.length >= 3 && !STOP.has(word));
  if (!words.length) return [];
  // Light stemming for long words only: "terminos" also finds "termino", "patrocinios" finds "patrocinio".
  // (Short words stay whole, or "retro" would find "retracto".)
  const matchers = words.map(word => keyword(word.length >= 6 ? `${word.slice(0, -1)}*` : word));
  const seen = new Set<string>();
  return SITE_DIRECTORY.filter(visible)
    .map(entry => {
      const label = normalize(entry.label), rest = normalize(`${entry.terms} ${entry.group}`);
      const score = matchers.reduce((sum, match) => sum + (match(label) ? 2 : match(rest) ? 1 : 0), 0);
      return {entry, score};
    })
    .filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .filter(match => !seen.has(match.entry.href) && !!seen.add(match.entry.href))
    .slice(0, limit);
}
