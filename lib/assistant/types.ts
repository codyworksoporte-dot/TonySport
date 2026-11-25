// Shapes shared by the Tony assistant engine (lib/assistant) and its UI (components/assistant).
// Everything here is plain data so a conversation can be stored in sessionStorage and sent to a backend.
import type {IconName} from '@/components/Icon';

export type AssistantAsset = `/assets/${string}`;

/**
 * link: a route of this site (rendered with next/link). external / whatsapp: opens in a new tab.
 * tel / mail: phone call or e-mail. search: opens the site search ("¿Qué buscas en específico?").
 */
export type AssistantActionKind = 'link' | 'external' | 'whatsapp' | 'tel' | 'mail' | 'search';
export type AssistantAction = {label: string; kind: AssistantActionKind; href?: string; icon?: IconName};

/** A small picture card. `ask` turns it into a follow-up question instead of a link. */
export type AssistantCard = {title: string; image: AssistantAsset; href?: string; external?: boolean; note?: string; ask?: string};

/** A store answer: name, address and phone shown as a compact location card. */
export type AssistantPlace = {name: string; address: string; phone: string; mapUrl: string};

export type IntentId =
  | 'saludo' | 'crear' | 'precios' | 'promociones' | 'tiendas' | 'consulta' | 'app' | 'implementos'
  | 'disciplinas' | 'calidad' | 'entregas' | 'pagos' | 'horario' | 'contacto' | 'reclamos' | 'carrito'
  | 'gracias' | 'buscar' | 'desconocido' | 'remoto';

export type AssistantReply = {
  intent: IntentId;
  text: string;            // 1 to 3 short sentences
  actions: AssistantAction[];
  cards: AssistantCard[];  // at most 3
  chips: string[];         // suggested follow-up questions
  place?: AssistantPlace;
};

export type AssistantMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  actions?: AssistantAction[];
  cards?: AssistantCard[];
  chips?: string[];
  place?: AssistantPlace;
  source?: 'local' | 'remote';
  /** The opening greeting: drawn as a picture tile instead of a bubble. */
  welcome?: boolean;
};

/** history: the user's earlier questions in this conversation, oldest first. page: current pathname. */
export type AssistantContext = {history?: readonly string[]; page?: string};
