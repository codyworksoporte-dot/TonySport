// The assistant's opening message, apart from the engine: the panel can greet at once while
// engine.ts (keywords, stores, site directory) loads only when a question needs an answer.
import type {AssistantReply} from './types';

export const QUICK_REPLIES = [
  'Crear mi pedido', 'Precios', 'Promociones', 'Tiendas cerca', 'Consulta tu pedido', 'App Tony', 'Implementos', 'Hablar con una persona',
];

/** The first message of every conversation. */
export function greeting(): AssistantReply {
  return {intent: 'saludo', text: '¡Hola! Soy el asistente de Tony. ¿En qué te ayudo?', actions: [], cards: [], chips: QUICK_REPLIES};
}
