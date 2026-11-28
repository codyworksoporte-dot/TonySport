// The Tony assistant's local engine: pure TypeScript, no network, no React.
// replyTo(question) scores every intent with accent-insensitive keywords, adds a bonus for the things it
// recognizes (a store, a discipline, an implementos family) and answers with the site's own facts. When it
// is unsure it falls back to the site directory, and it always offers the WhatsApp handoff.
// Facts come only from the repo: prices from data/pedido/guides.json, stores from data/tony-stores.json,
// lines from lib/disciplines.ts, implementos from lib/implements.ts, promotions from lib/promotions.ts.
import {DISCIPLINES, DISCIPLINES_TITLE, disciplineHref, type Discipline} from '@/lib/disciplines';
import {IMPLEMENT_FAMILIES, IMPLEMENTS_PAGE, implementsOf, type ImplementFamily} from '@/lib/implements';
import {CURRENT_PROMOTIONS, PROMOTIONS, PROMOTIONS_PAGE, PROMO_QUESTION} from '@/lib/promotions';
import {APP_TONY, ORDER_LOOKUP_URL, TONY_EMAIL, TONY_WHATSAPP_NUMBER, whatsappLink} from '@/lib/site-links';
import type {DirectoryEntry} from '@/lib/site-directory';
import {
  FAMILY_NOUN, FAMILY_QUESTION, STORES, findDisciplines, findImplementFamily, findStores, findZone, searchDirectory,
  storesInZone, telHref, type Store,
} from './knowledge';
import {QUICK_REPLIES} from './greeting';
import {keyword, normalize, scorer, type Weighted} from './text';
import type {AssistantAction, AssistantCard, AssistantContext, AssistantReply, IntentId} from './types';

export {QUICK_REPLIES, greeting} from './greeting';
export const PRICE_TEXT = 'Uniformes desde $12.99 c/u y camisas desde $7.99 c/u.';

// Intents in tie-break order: when two score the same, the earlier one answers.
const INTENTS: readonly (readonly [IntentId, Weighted])[] = [
  ['consulta', [['consulta tu pedido', 6], ['consultar mi pedido', 6], ['consultar el pedido', 6], ['consultar pedido', 6], ['consulta de pedido', 6],
    ['estado de mi pedido', 6], ['estado del pedido', 6], ['estado de pedido', 6], ['donde esta mi pedido', 6], ['mi pedido', 3], ['mi orden', 4],
    ['numero de orden', 5], ['rastrear', 4], ['rastreo', 4], ['seguimiento', 4], ['ya esta listo', 3], ['consult*', 2]]],
  ['tiendas', [['tienda', 3], ['sucursal', 4], ['local', 2], ['ubicacion', 3], ['ubicad*', 2], ['direccion', 3], ['mapa', 2], ['cerca', 2],
    ['cercana', 2], ['cercano', 2], ['como llego', 3], ['como llegar', 3], ['donde estan', 2], ['donde queda*', 2], ['donde compro', 3],
    ['donde comprar', 3], ['donde puedo comprar', 4], ['comprar', 1], ['punto de venta', 3], ['presencial', 2], ['visitar*', 1]]],
  ['implementos', [['implemento', 5], ['articulos deportivos', 4], ['equipo deportivo', 3], ['equipamiento', 3]]],
  ['precios', [['precio', 4], ['cuanto cuesta*', 4], ['cuanto vale*', 4], ['cuanto sale*', 4], ['cuanto cobra*', 4], ['cuanto es', 3], ['costo', 4],
    ['cuesta*', 3], ['valen', 3], ['cotiz*', 3], ['tarifa', 3], ['barato', 2], ['economico', 2], ['dolar*', 2]]],
  ['promociones', [['promo*', 4], ['oferta', 4], ['descuento', 4], ['rebaja', 4], ['black', 3], ['cupon*', 4], ['2x1', 4], ['liquidacion', 3]]],
  ['app', [['app', 4], ['aplicacion', 4], ['app tony', 5], ['descarg*', 3], ['android', 4], ['iphone', 4], ['ios', 4], ['play store', 4],
    ['google play', 4], ['app store', 5], ['puntos', 3], ['premio', 3], ['canje*', 3], ['recompensa', 3], ['fidelidad', 3]]],
  ['pagos', [['pago', 4], ['pagar', 4], ['tarjeta', 4], ['transferencia', 4], ['efectivo', 4], ['anticipo', 4], ['deposito', 3], ['formas de pago', 5],
    ['forma de pago', 5], ['metodo de pago', 5], ['metodos de pago', 5], ['wompi', 4], ['credito', 3], ['cuotas', 3], ['contra entrega', 3]]],
  ['entregas', [['entrega', 4], ['envio', 4], ['enviar', 3], ['envian', 3], ['domicilio', 4], ['delivery', 4], ['cuanto tarda*', 4], ['cuanto tiempo', 4],
    ['tiempo de entrega', 5], ['tiempos de entrega', 5], ['tiempos', 3], ['cuando llega*', 3], ['demora*', 3], ['retir*', 2], ['recoger', 2]]],
  ['horario', [['horario', 5], ['a que hora', 5], ['hora', 3], ['abre', 4], ['abren', 4], ['cierra', 4], ['cierran', 4], ['abierto', 3],
    ['atienden', 3], ['domingo', 2], ['sabado', 2], ['feriado', 2]]],
  ['calidad', [['talla', 4], ['medida', 3], ['tela', 4], ['material', 3], ['calidad', 4], ['sublima*', 4], ['bordado', 4], ['estampado', 4],
    ['confeccion', 3], ['acabado', 3], ['lavar', 3], ['lavado', 3], ['cuidado', 2], ['durab*', 3], ['transpirable', 3], ['dry fit', 3]]],
  ['reclamos', [['cambio', 3], ['devolucion', 4], ['devolver', 4], ['garantia', 4], ['reclamo', 4], ['reembolso', 4], ['cancelar', 3], ['queja', 3],
    ['defecto', 3], ['problema', 2]]],
  ['carrito', [['carrito', 4], ['mi carrito', 5], ['guardado', 2], ['disenos guardados', 4]]],
  ['crear', [['crear pedido', 4], ['crear mi pedido', 4], ['crea tu pedido', 4], ['crear un pedido', 4], ['hacer pedido', 4], ['hacer un pedido', 4],
    ['hacer mi pedido', 4], ['quiero pedir', 3], ['como pido', 3], ['crear', 2], ['crea', 2], ['pedir', 2], ['comprar', 2], ['ordenar', 2], ['encargar', 2],
    ['mandar a hacer', 3], ['personaliz*', 3], ['configurador', 4], ['disenar', 3], ['diseno', 2], ['como funciona', 2], ['pasos', 2],
    ['camiseta', 2], ['medias', 3], ['pedido', 1], ['uniforme', 1], ['equipo', 1]]],
  ['disciplinas', [['disciplina', 4], ['deporte', 2], ['linea', 2], ['producto', 3], ['que venden', 3], ['que tienen', 2], ['que hacen', 2],
    ['catalogo', 3], ['uniforme', 1]]],
  ['contacto', [['humano', 5], ['una persona', 5], ['persona', 4], ['asesor*', 4], ['agente', 3], ['alguien', 3], ['hablar', 2], ['whatsapp', 4],
    ['whats', 4], ['wasap', 4], ['guasap', 4], ['wsp', 4], ['telefono', 3], ['llamar', 3], ['contacto', 4], ['contactar*', 4], ['comunicar*', 3],
    ['correo', 4], ['email', 4], ['mail', 3], ['numero', 2], ['atencion al cliente', 4], ['ayuda', 3], ['soporte', 3]]],
  ['gracias', [['gracias', 3], ['adios', 3], ['chao', 3], ['bye', 3], ['hasta luego', 3], ['nos vemos', 3], ['perfecto', 2], ['excelente', 2],
    ['genial', 2], ['muy amable', 3]]],
  ['saludo', [['hola', 1], ['ola', 1], ['buenas', 1], ['buenos dias', 1], ['buenas tardes', 1], ['buenas noches', 1], ['hey', 1], ['que tal', 1],
    ['saludos', 1], ['hello', 1], ['hi', 1]]],
];
const SCORERS = INTENTS.map(([id, keys]) => [id, scorer(keys)] as const);
const WEAK = 3;          // below this, a clear match in the site directory wins
const ENTITY = {store: 3, zone: 3, family: 5, discipline: 3};

export type Understanding = {
  intent: IntentId; score: number; text: string;
  stores: Store[]; zone?: string; family?: ImplementFamily; disciplines: Discipline[];
};

/** Reads a question: the best intent, its score and the things it names. */
export function understand(question: string): Understanding {
  const text = normalize(question);
  const stores = findStores(question), zone = findZone(question), family = findImplementFamily(question), disciplines = findDisciplines(question);
  let best: {intent: IntentId; score: number} = {intent: 'desconocido', score: 0};
  for (const [id, score] of SCORERS) {
    let value = score(text);
    if (id === 'tiendas') value += (stores.length ? ENTITY.store : 0) + (zone ? ENTITY.zone : 0);
    if (id === 'implementos' && family) value += ENTITY.family;
    if (id === 'disciplinas' && disciplines.length) value += ENTITY.discipline;
    if (value > best.score) best = {intent: id, score: value};
  }
  return {...best, text, stores, zone, family, disciplines};
}

// ---------- building blocks ----------
const whatsapp = (message: string): AssistantAction => ({
  label: `WhatsApp ${TONY_WHATSAPP_NUMBER}`, kind: 'whatsapp', icon: 'whatsapp-solid', href: whatsappLink(message),
});
/** The WhatsApp handoff for the current question; `fallback` is what it says when the question came from a chip. */
type Ask = (fallback?: string) => AssistantAction;
const ACTIONS = {
  create: {label: 'Crear mi pedido', kind: 'link', href: '/configurador', icon: 'plus'},
  stores: {label: 'Ver todas las tiendas', kind: 'link', href: '/tiendas', icon: 'pin'},
  promotions: {label: 'Ver promociones', kind: 'link', href: PROMOTIONS_PAGE, icon: 'tag'},
  lookup: {label: 'Consultar mi pedido', kind: 'external', href: ORDER_LOOKUP_URL, icon: 'package'},
  implementos: {label: 'Ver implementos', kind: 'link', href: IMPLEMENTS_PAGE, icon: 'ball'},
  disciplines: {label: 'Ver todas las disciplinas', kind: 'link', href: '/producto', icon: 'grid'},
  quality: {label: 'Calidad y confección', kind: 'link', href: '/calidad', icon: 'shield'},
  android: {label: 'Android · Google Play', kind: 'external', href: APP_TONY.android, icon: 'play'},
  ios: {label: 'iPhone · App Store', kind: 'external', href: APP_TONY.ios, icon: 'apple'},
  app: {label: 'Conoce la App Tony', kind: 'link', href: '/app-tony', icon: 'phone'},
  search: {label: 'Buscar en el sitio', kind: 'search', icon: 'search'},
  cart: {label: 'Mi carrito', kind: 'link', href: '/carrito', icon: 'bag'},
  terms: {label: 'Términos y condiciones', kind: 'link', href: '/terminos', icon: 'news'},
  mail: {label: TONY_EMAIL, kind: 'mail', href: `mailto:${TONY_EMAIL}`, icon: 'chat'},
} satisfies Record<string, AssistantAction>;

const discipline = (id: string) => DISCIPLINES.find(item => item.id === id);
const disciplineCard = (item: Discipline): AssistantCard => ({title: item.name, image: item.image, href: disciplineHref(item.id)});
const familyCard = (family: ImplementFamily): AssistantCard => {
  const question = FAMILY_QUESTION[family.id] ?? family.name;
  return {title: question, image: family.cover, ask: question};
};
const productCards = (): AssistantCard[] => {
  const uniforms = discipline('futbol'), shirts = discipline('camisas-polos');
  return [
    ...(uniforms ? [{title: 'Uniformes', note: 'Desde $12.99', image: uniforms.image, href: '/configurador'}] : []),
    ...(shirts ? [{title: 'Camisas', note: 'Desde $7.99', image: shirts.image, href: '/configurador'}] : []),
  ];
};
/** A site directory entry as a button: internal routes use next/link, external ones open in a new tab. */
const directoryAction = (entry: DirectoryEntry): AssistantAction => {
  if (!entry.external && !/^https?:/.test(entry.href)) return {label: entry.label, kind: 'link', href: entry.href, icon: 'arrow'};
  const chat = /^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(entry.href);
  return {label: entry.label, kind: chat ? 'whatsapp' : 'external', href: entry.href, icon: chat ? 'whatsapp-solid' : 'diagonal'};
};
const storeChips = (stores: readonly Store[]) => stores.map(item => item.name);
const listNames = (names: string[]) => names.length > 1 ? `${names.slice(0, -1).join(', ')} y ${names.at(-1)}` : names[0] ?? '';
const reply = (intent: IntentId, text: string, parts: Partial<Omit<AssistantReply, 'intent' | 'text'>> = {}): AssistantReply => ({
  intent, text, actions: parts.actions ?? [], cards: (parts.cards ?? []).slice(0, 3), chips: parts.chips ?? [], ...(parts.place ? {place: parts.place} : {}),
});

const DISCIPLINE_CHIPS = ['Ciclismo', 'Running', 'Racing', 'Empresarial', 'Camisas y polos', 'Réplicas'];
const CITY_CHIPS = ['San Salvador', 'Santa Ana', 'San Miguel', 'Lourdes', 'Santa Tecla', 'Sonsonate'];
/** Every suggestion the engine offers; tapping one is not a question worth forwarding word for word. */
const CHIPS = new Set([
  ...QUICK_REPLIES, ...DISCIPLINE_CHIPS, ...Object.values(FAMILY_QUESTION), ...STORES.flatMap(item => [item.name, `Horario de ${item.name}`]),
  'Otra tienda', 'Formas de pago', 'Tiempos de entrega', 'Escoge tu disciplina',
]);
const CHATTER: IntentId[] = ['contacto', 'saludo', 'gracias'];
const typed = (text: string) => normalize(text).split(' ').length >= 3 && !CHIPS.has(text.trim());
/** A question worth handing to a person: typed by the user (not a chip), and not a greeting or "talk to someone". */
const substantive = (text: string) => typed(text) && !CHATTER.includes(understand(text).intent);

/**
 * What the WhatsApp handoff says. For "talk to a person" it carries the user's latest real question from this
 * conversation; for any other answer, the question just asked (or `fallback` when it came from a chip).
 */
export function handoffMessage(question: string, intent: IntentId, history: readonly string[], fallback = 'Necesito ayuda.'): string {
  // A question the assistant could not answer always goes to the person word for word, however short.
  const forward = typed(question) || (intent === 'desconocido' && !CHIPS.has(question.trim()) && normalize(question).length >= 3);
  const own = CHATTER.includes(intent) ? [...history].reverse().find(substantive) : forward ? question : undefined;
  // The message already says "Hola, Tony.", so the user's own greeting is dropped.
  const body = (own ?? '').trim().replace(/\s+/g, ' ').replace(/^(?:hola|buenas tardes|buenas noches|buenos d[ií]as|buenas|saludos)(?=[\s,.!]|$)[\s,.!]*/i, '');
  const text = (body || fallback).slice(0, 300)
    .replace(/^([¿¡"'\s]*)([a-zñáéíóúü])/, (_, lead: string, letter: string) => lead + letter.toUpperCase());
  return `Hola, Tony. ${text}`;
}

// ---------- answers ----------
function storeReply(item: Store, others: Store[], ask: Ask, hours = false): AssistantReply {
  const sharesWhatsApp = item.phone.replace(/\D/g, '') === TONY_WHATSAPP_NUMBER.replace(/\D/g, '');
  const map: AssistantAction = {label: 'Cómo llegar', kind: 'external', href: item.mapUrl, icon: 'pin'};
  const call: AssistantAction = {label: `Llamar ${item.phone}`, kind: 'tel', href: telHref(item.phone), icon: 'phone'};
  const place = {name: item.name, address: item.address, phone: item.phone, mapUrl: item.mapUrl};
  if (hours) {
    return reply('horario', `La tienda ${item.name} no tiene un horario publicado en el sitio. Llama al ${item.phone} antes de ir.`, {
      place, actions: [call, map], chips: ['Otra tienda', 'Hablar con una persona'],
    });
  }
  return reply('tiendas', `Así llegas a la tienda ${item.name}.`, {
    place,
    actions: [map, call, ...(sharesWhatsApp ? [ask(`Quiero información de la tienda ${item.name}.`)] : [])],
    chips: [...storeChips(others).slice(0, 2), `Horario de ${item.name}`, 'Otra tienda'],
  });
}

const ZONE_NAME: Record<string, string> = {Oriente: 'la zona oriental', Occidente: 'la zona occidental', Paracentral: 'la zona paracentral', Centro: 'la zona central'};
function storesReply(read: Understanding, ask: Ask): AssistantReply {
  if (read.stores.length) return storeReply(read.stores[0], read.stores.slice(1), ask);
  if (read.zone) {
    const inZone = storesInZone(read.zone);
    return reply('tiendas', `En ${ZONE_NAME[read.zone] ?? read.zone} tenemos ${inZone.length === 1 ? 'la tienda de' : 'tiendas en'} ${listNames(storeChips(inZone))}. Toca una para ver su dirección.`, {
      chips: storeChips(inZone), actions: [ACTIONS.stores],
    });
  }
  return reply('tiendas', `Tenemos ${STORES.length} tiendas en El Salvador. ¿En qué ciudad estás? Te doy la dirección.`, {
    cards: [{title: 'Todas las tiendas', note: `${STORES.length} en el país`, image: '/assets/secciones/tiendas/portada.webp', href: '/tiendas'}],
    chips: CITY_CHIPS,
    actions: [ACTIONS.stores],
  });
}

function implementsReply(read: Understanding, ask: Ask, priced = false): AssistantReply {
  const family = read.family;
  if (!family) {
    const featured = ['balones', 'guantes', 'baloncesto'];
    return reply('implementos', 'Tenemos balones, guantes de portero, espinilleras, mallas y más. ¿Qué buscas?', {
      cards: IMPLEMENT_FAMILIES.filter(item => featured.includes(item.id)).map(familyCard),
      chips: IMPLEMENT_FAMILIES.filter(item => !featured.includes(item.id)).map(item => FAMILY_QUESTION[item.id] ?? item.name),
      actions: [ACTIONS.implementos],
    });
  }
  const items = implementsOf(family.id), noun = FAMILY_NOUN[family.id] ?? family.name.toLowerCase();
  const text = priced
    ? `No tengo aquí el precio de ${noun}. Míralo en la página de cada modelo o pregúntale a Tony.`
    : `Mira algunos modelos de ${noun}. Pregúntale a Tony por la disponibilidad.`;
  return reply('implementos', text, {
    cards: items.slice(0, 3).map(item => ({title: item.name, image: item.image, href: item.href, external: true})),
    actions: [{...ACTIONS.implementos, label: `Ver ${noun}`, href: `${IMPLEMENTS_PAGE}#${family.id}`}, ask(`¿Qué ${noun} tienen disponibles?`)],
    chips: IMPLEMENT_FAMILIES.filter(item => item.id !== family.id).slice(0, 3).map(item => FAMILY_QUESTION[item.id] ?? item.name),
  });
}

function disciplinesReply(read: Understanding): AssistantReply {
  const found = read.disciplines;
  if (!found.length) {
    const featured = ['futbol', 'bkb', 'voleibol'];
    return reply('disciplinas', `${DISCIPLINES_TITLE}:`, {
      cards: DISCIPLINES.filter(item => featured.includes(item.id)).map(disciplineCard),
      chips: DISCIPLINE_CHIPS,
      actions: [ACTIONS.disciplines, ACTIONS.create],
    });
  }
  const [first] = found;
  return reply('disciplinas', found.length === 1 ? `Aquí tienes ${first.name}. Toca la imagen para ver más o crea tu pedido.` : 'Aquí las tienes. Toca una imagen para ver más o crea tu pedido.', {
    cards: found.map(disciplineCard),
    actions: [{label: `Ver ${first.name}`, kind: 'link', href: disciplineHref(first.id), icon: 'arrow'}, ACTIONS.create],
    chips: ['Precios', 'Escoge tu disciplina'],
  });
}

// Only uniforms and shirts have published starting prices; the rest is quoted by Tony.
const UNPRICED = new Set(['replicas', 'hoddies', 'moldes', 'logos-3d', 'implementos']);
function pricesReply(read: Understanding, ask: Ask): AssistantReply {
  if (read.family) return implementsReply(read, ask, true);
  const unpriced = read.disciplines.find(item => UNPRICED.has(item.id));
  if (unpriced) {
    return reply('precios', `El precio de ${unpriced.name.toLowerCase()} te lo confirma Tony por WhatsApp.`, {
      cards: [disciplineCard(unpriced)], actions: [ask(`¿Cuál es el precio de ${unpriced.name.toLowerCase()}?`), ACTIONS.create],
    });
  }
  return reply('precios', `${PRICE_TEXT} Tony te confirma el precio final al cotizar por WhatsApp.`, {
    cards: productCards(), actions: [ACTIONS.create, ask('Quiero cotizar un pedido.')], chips: ['Promociones', 'Formas de pago', 'Tiempos de entrega'],
  });
}

function promotionsReply(): AssistantReply {
  const ask = whatsapp(PROMO_QUESTION);
  if (CURRENT_PROMOTIONS.length) {
    return reply('promociones', `Promoción vigente: ${listNames(CURRENT_PROMOTIONS.map(promo => promo.title))}. Pregúntale los detalles a Tony.`, {
      cards: CURRENT_PROMOTIONS.map(promo => ({title: promo.title, note: promo.until ? `Hasta ${promo.until}` : undefined, image: promo.image, href: PROMOTIONS_PAGE})),
      actions: [ACTIONS.promotions, ask],
    });
  }
  return reply('promociones', 'Hoy no hay una promoción publicada aquí. Pregúntale a Tony cuáles tiene vigentes; abajo ves las últimas campañas.', {
    cards: PROMOTIONS.slice(0, 3).map(promo => ({title: promo.title, note: promo.when, image: promo.image, href: PROMOTIONS_PAGE})),
    actions: [ask, ACTIONS.promotions],
    chips: ['App Tony', 'Implementos', 'Tiendas cerca'],
  });
}

function unknownReply(question: string, ask: Ask): AssistantReply {
  // A single word found only in an entry's terms (a store address, say) is too weak to suggest.
  const found = searchDirectory(question, 2).filter(match => match.score >= 2);
  if (found.length) {
    return reply('desconocido', 'Perdona, no tengo esa respuesta exacta. Quizá te sirve esto, o pregúntale a una persona:', {
      actions: [...found.map(({entry}) => directoryAction(entry)), ask()],
      chips: ['Crear mi pedido', 'Precios', 'Tiendas cerca'],
    });
  }
  return reply('desconocido', 'Perdona, no tengo esa respuesta. Una persona del equipo Tony te ayuda por WhatsApp.', {
    actions: [ask(), ACTIONS.search], chips: ['Crear mi pedido', 'Precios', 'Tiendas cerca'],
  });
}

const FAREWELL = ['adios', 'chao', 'bye', 'hasta luego', 'nos vemos'].map(word => keyword(word));
const SIZES = keyword('talla');
const MAIL = ['correo', 'email', 'mail'].map(word => keyword(word));

/** Answers one question with the site's own facts. Pure: the same question and history give the same answer. */
export function replyTo(question: string, context: AssistantContext = {}): AssistantReply {
  const history = context.history ?? [];
  let read = understand(question);

  // A store follow-up ("¿y el horario?") uses the store named just before.
  if (read.intent === 'horario' && !read.stores.length && history.length) {
    const previous = findStores(history[history.length - 1]);
    if (previous.length) read = {...read, stores: previous};
  }

  // Unsure? A clear match in the site directory answers "where is X" questions.
  if (read.score < WEAK) {
    const found = searchDirectory(question, 2);
    if (found.length && found[0].score >= 2) {
      return reply('buscar', 'Esto es lo que encontré en el sitio:', {
        actions: found.map(({entry}) => directoryAction(entry)),
        chips: ['Hablar con una persona'],
      });
    }
  }

  const ask: Ask = fallback => whatsapp(handoffMessage(question, read.intent, history, fallback));
  switch (read.intent) {
    case 'saludo':
      return reply('saludo', '¡Hola! ¿Qué necesitas hoy? Toca una opción o escríbeme tu pregunta.', {chips: QUICK_REPLIES});
    case 'crear':
      return reply('crear', 'Eliges uniforme o camisa, defines la cantidad y agregas nombres, tallas y números de tus jugadores. Luego escoges el diseño y revisas el resumen; Tony confirma el diseño final antes de producir.', {
        actions: [ACTIONS.create, ask('Quiero crear un pedido.')], chips: ['Precios', 'Escoge tu disciplina', 'Hablar con una persona'],
      });
    case 'precios':
      return pricesReply(read, ask);
    case 'promociones':
      return promotionsReply();
    case 'tiendas':
      return storesReply(read, ask);
    case 'consulta':
      return reply('consulta', 'Consulta el estado de tu pedido en el sistema de Tony. Ten a mano tu número de orden.', {
        actions: [ACTIONS.lookup, ask('Quiero consultar el estado de mi pedido.')], chips: ['Tiempos de entrega', 'Hablar con una persona'],
      });
    case 'app':
      return reply('app', 'Con la App Tony sumas puntos en tus compras y los canjeas por premios. También puedes crear tu pedido desde la app.', {
        cards: [{title: 'App Tony', note: 'Puntos y premios', image: '/assets/secciones/app-tony/portada.webp', href: '/app-tony'}],
        actions: [ACTIONS.android, ACTIONS.ios, ACTIONS.app], chips: ['Promociones', 'Crear mi pedido'],
      });
    case 'implementos':
      return implementsReply(read, ask);
    case 'disciplinas':
      return disciplinesReply(read);
    case 'calidad':
      return SIZES(read.text)
        ? reply('calidad', 'Cada jugador lleva su talla en la lista del pedido. Antes de confirmarla, pide a Tony la guía de tallas de esa prenda.', {
          actions: [ask('¿Me compartes la guía de tallas?'), ACTIONS.quality], chips: ['Crear mi pedido', 'Precios'],
        })
        : reply('calidad', 'En Calidad y confección ves telas, técnicas y acabados. Tony te ayuda a elegir la mejor opción para tu diseño.', {
          cards: [{title: 'Calidad y confección', note: 'Telas y acabados', image: '/assets/secciones/calidad/portada.webp', href: '/calidad'}],
          actions: [ACTIONS.quality, ask('Tengo una consulta sobre telas y acabados.')],
        });
    case 'entregas':
      return reply('entregas', 'Puedes retirar en una tienda Tony o pedir envío; lo eliges al crear tu pedido. Tony te confirma los tiempos al cotizar.', {
        actions: [ask('Quiero saber los tiempos de entrega.'), ACTIONS.stores], chips: ['Tiendas cerca', 'Consulta tu pedido'],
      });
    case 'pagos':
      return reply('pagos', 'Las formas de pago te las confirma Tony al cotizar tu pedido. Escríbele si tienes una duda.', {
        actions: [ask('¿Cuáles son las formas de pago?'), ACTIONS.create], chips: ['Precios', 'Tiempos de entrega'],
      });
    case 'horario':
      if (read.stores.length) return storeReply(read.stores[0], read.stores.slice(1), ask, true);
      return reply('horario', 'El sitio no tiene horarios publicados. Llama a la tienda que quieres visitar antes de ir.', {
        chips: CITY_CHIPS.slice(0, 4), actions: [ACTIONS.stores],
      });
    case 'contacto': {
      const wantsMail = MAIL.some(match => match(read.text));
      return reply('contacto', `Una persona del equipo Tony te atiende por WhatsApp al ${TONY_WHATSAPP_NUMBER}.${wantsMail ? ` También puedes escribir a ${TONY_EMAIL}.` : ''}`, {
        actions: [ask(), ...(wantsMail ? [ACTIONS.mail] : [])], chips: ['Tiendas cerca', 'Consulta tu pedido'],
      });
    }
    case 'reclamos':
      return reply('reclamos', 'Para cambios, garantías o reclamos, escríbele a Tony por WhatsApp con tu número de orden.', {
        actions: [ask('Necesito ayuda con un cambio o reclamo.'), ACTIONS.terms],
      });
    case 'carrito':
      return reply('carrito', 'Tus diseños guardados están en tu carrito. Desde ahí retomas cada pedido.', {actions: [ACTIONS.cart, ACTIONS.create]});
    case 'gracias':
      return FAREWELL.some(match => match(read.text))
        ? reply('gracias', '¡Hasta pronto! Gracias por visitar Tony Sportswear.')
        : reply('gracias', '¡Con gusto! Aquí estoy si necesitas algo más.', {chips: QUICK_REPLIES.slice(0, 4)});
    default:
      return unknownReply(question, ask);
  }
}

