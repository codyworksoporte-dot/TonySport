// Optional AI backend for the Tony assistant. Off by default: the site never calls a third party on its own.
//
// HOW TO TURN IT ON
// Build the site with NEXT_PUBLIC_TONY_ASSISTANT_URL=https://your-server/assistant. The value is inlined into
// the static bundle at build time, so it must be a public URL and never a secret: the API key of the model
// stays on that server. The server must answer CORS preflight requests from the site's origin
// (Content-Type: application/json is sent).
//
// REQUEST (POST, JSON)
//   {"messages": [{"role": "user" | "assistant", "content": "..."}], "page": "/tiendas"}
//   The last 12 messages of the conversation, oldest first; the last one is the user's new question.
//
// RESPONSE (JSON)
//   {"reply": "Texto corto para el usuario.", "actions": [{"label": "Ver tiendas", "href": "/tiendas"}]}
//   `actions` is optional (at most 4 are shown). An href may be a site path ("/tiendas", "/producto/futbol"),
//   an https link, a tel: or a mailto: link; anything else is dropped. wa.me links show as the WhatsApp button.
//
// If the request fails, takes longer than REMOTE_TIMEOUT_MS or returns something else, the local engine
// (engine.ts) answers instead, so the assistant keeps working offline and on GitHub Pages.
import type {AssistantAction, AssistantMessage, AssistantReply} from './types';

export const ASSISTANT_ENDPOINT = process.env.NEXT_PUBLIC_TONY_ASSISTANT_URL ?? '';
export const REMOTE_TIMEOUT_MS = 8000;
export type RemoteMessage = {role: 'user' | 'assistant'; content: string};

export const toRemoteMessages = (messages: readonly AssistantMessage[]): RemoteMessage[] =>
  messages.slice(-12).map(message => ({role: message.role, content: message.text.slice(0, 1000)}));

/** Turns an href from the backend into a safe action, or null when it is not allowed. */
export function remoteAction(label: unknown, href: unknown): AssistantAction | null {
  if (typeof label !== 'string' || typeof href !== 'string' || !label.trim()) return null;
  const text = label.trim().slice(0, 48), target = href.trim();
  if (target.startsWith('/') && !target.startsWith('//')) return {label: text, kind: 'link', href: target, icon: 'arrow'};
  if (/^tel:\+?[\d\s-]{7,}$/.test(target)) return {label: text, kind: 'tel', href: target, icon: 'phone'};
  if (/^mailto:[^\s@]+@[^\s@]+$/.test(target)) return {label: text, kind: 'mail', href: target, icon: 'chat'};
  let url: URL;
  try { url = new URL(target); } catch { return null; }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.hostname === 'wa.me' || url.hostname.endsWith('whatsapp.com')) return {label: text, kind: 'whatsapp', href: url.href, icon: 'whatsapp-solid'};
  return {label: text, kind: 'external', href: url.href, icon: 'diagonal'};
}

/** Validates the backend's JSON. Returns null when there is no usable reply. */
export function parseRemoteReply(data: unknown): AssistantReply | null {
  if (!data || typeof data !== 'object') return null;
  const {reply, actions} = data as {reply?: unknown; actions?: unknown};
  if (typeof reply !== 'string' || !reply.trim()) return null;
  const parsed = Array.isArray(actions)
    ? actions.map(item => item && typeof item === 'object' ? remoteAction((item as {label?: unknown}).label, (item as {href?: unknown}).href) : null)
      .filter((item): item is AssistantAction => !!item).slice(0, 4)
    : [];
  return {intent: 'remoto', text: reply.trim().slice(0, 1200), actions: parsed, cards: [], chips: []};
}

/** Asks the configured backend. Never throws: null means "answer locally". */
export async function askRemote(messages: readonly AssistantMessage[], page: string, endpoint = ASSISTANT_ENDPOINT): Promise<AssistantReply | null> {
  if (!endpoint) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REMOTE_TIMEOUT_MS);
  try {
    const response = await fetch(endpoint, {
      method: 'POST', headers: {'Content-Type': 'application/json'}, credentials: 'omit', signal: controller.signal,
      body: JSON.stringify({messages: toRemoteMessages(messages), page}),
    });
    if (!response.ok) return null;
    return parseRemoteReply(await response.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
