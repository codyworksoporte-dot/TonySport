'use client';
// Asistente Tony: the floating helper for visitors who want a hand. It answers instantly with the site's own
// facts (lib/assistant/engine.ts, fully offline) and always offers a person on WhatsApp. A real AI backend can
// take over by building with NEXT_PUBLIC_TONY_ASSISTANT_URL (see lib/assistant/remote.ts); if it fails, the
// local engine answers.
//
// Other components can open it: window.dispatchEvent(new CustomEvent('tony:open-assistant', {detail: {question: '…'}}))
// (`detail` is optional; with a question, the assistant asks it right away).
import {usePathname} from 'next/navigation';
import {createPortal} from 'react-dom';
import {useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent} from 'react';
import Icon from '@/components/Icon';
import {greeting} from '@/lib/assistant/greeting';
import {ASSISTANT_ENDPOINT, askRemote} from '@/lib/assistant/remote';
import type {AssistantMessage, AssistantReply} from '@/lib/assistant/types';
import {HELP_WHATSAPP, TONY_WHATSAPP_NUMBER} from '@/lib/site-links';
import AssistantAvatar from './AssistantAvatar';
import AssistantMessageView from './AssistantMessageView';
import './assistant.css';

const CHAT_KEY = 'tony-assistant-chat-v1'; // sessionStorage: this tab's conversation, gone when the tab closes
const HINT_KEY = 'tony-assistant-hint-v1'; // localStorage: the first-visit bubble was already shown
const HINT_DELAY = 6000, HINT_TIME = 14000, TYPING_MS = 500, CLOSE_MS = 220, MAX_STORED = 40;
const SHEET = '(max-width: 699px)';

type Phase = 'closed' | 'open' | 'closing';
type IntroWindow = Window & {__tonyIntroBoot?: {pending?: boolean}};

let counter = 0;
const newId = () => `${Date.now().toString(36)}-${(counter += 1).toString(36)}`;
const toMessage = (reply: AssistantReply, source: 'local' | 'remote'): AssistantMessage => ({
  id: newId(), role: 'assistant', text: reply.text, source,
  ...(reply.actions.length ? {actions: reply.actions} : {}), ...(reply.cards.length ? {cards: reply.cards} : {}),
  ...(reply.chips.length ? {chips: reply.chips} : {}), ...(reply.place ? {place: reply.place} : {}),
});
const isMessage = (value: unknown): value is AssistantMessage => !!value && typeof value === 'object'
  && typeof (value as AssistantMessage).id === 'string' && typeof (value as AssistantMessage).text === 'string'
  && ((value as AssistantMessage).role === 'user' || (value as AssistantMessage).role === 'assistant');
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.tonyEffects === 'off';
const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
// The local engine and its site facts load on first interest (launcher hover, focus or touch, opening),
// not with every page: most visits never ask a question.
let engine: Promise<typeof import('@/lib/assistant/engine')> | null = null;
const loadEngine = () => {
  engine ??= import('@/lib/assistant/engine').catch(error => { engine = null; throw error; });
  return engine;
};
const warmEngine = () => { void loadEngine().catch(() => { /* Retried when a question is sent. */ }); };

export default function TonyAssistant() {
  const path = usePathname() || '/';
  // The order flow has its own advisor; the assistant stays out of its way.
  const hidden = /^\/configurador(\/|$)/.test(path);
  const atHome = path === '/';
  const [homeLauncher, setHomeLauncher] = useState<HTMLElement | null>(null);
  useEffect(() => { setHomeLauncher(atHome ? document.getElementById('home-assistant-slot') : null); }, [atHome]);

  const [phase, setPhase] = useState<Phase>('closed');
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [ready, setReady] = useState(false);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  const [hint, setHint] = useState(false);
  const [sheet, setSheet] = useState(false);

  const panelId = useId(), titleId = useId(), inputId = useId();
  const launcher = useRef<HTMLButtonElement>(null), panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null), scroller = useRef<HTMLDivElement>(null);
  const closeTimer = useRef(0), busy = useRef(false);
  const messagesRef = useRef(messages), phaseRef = useRef(phase), hiddenRef = useRef(hidden), pathRef = useRef(path);
  messagesRef.current = messages; phaseRef.current = phase; hiddenRef.current = hidden; pathRef.current = path;
  const open = phase !== 'closed';

  // Restore this tab's conversation, then keep it saved.
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(sessionStorage.getItem(CHAT_KEY) || '[]');
      if (Array.isArray(saved)) setMessages(saved.filter(isMessage).slice(-MAX_STORED));
    } catch { /* Storage can be blocked; the chat still works for this visit. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      if (messages.length) sessionStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-MAX_STORED)));
      else sessionStorage.removeItem(CHAT_KEY);
    } catch { /* Not saved: nothing else depends on it. */ }
  }, [messages, ready]);

  useEffect(() => {
    const query = matchMedia(SHEET), update = () => setSheet(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  function rememberHint() {
    try { localStorage.setItem(HINT_KEY, '1'); } catch { /* The bubble may show again next visit. */ }
  }
  function dismissHint() { setHint(false); rememberHint(); }

  function openPanel() {
    if (hiddenRef.current) return;
    warmEngine();
    window.clearTimeout(closeTimer.current);
    dismissHint();
    setPhase('open');
    setMessages(current => current.length ? current : [{...toMessage(greeting(), 'local'), welcome: true}]);
  }
  function closePanel(returnFocus = true) {
    if (phaseRef.current === 'closed') return;
    window.clearTimeout(closeTimer.current);
    if (calm()) setPhase('closed');
    else { setPhase('closing'); closeTimer.current = window.setTimeout(() => setPhase('closed'), CLOSE_MS); }
    if (returnFocus) launcher.current?.focus({preventScroll: true});
  }

  async function send(text: string) {
    const question = text.trim().replace(/\s+/g, ' ').slice(0, 500);
    if (!question || busy.current) return;
    busy.current = true;
    // A chip or the send button is about to disappear or be disabled: keep focus inside the panel so Escape and
    // typing still work. Touch screens get the panel (no keyboard pop-up); everything else gets the text field.
    const focused = document.activeElement;
    if (panel.current && focused instanceof HTMLElement && panel.current.contains(focused) && focused !== input.current) {
      (matchMedia('(pointer: coarse)').matches ? panel.current : input.current ?? panel.current).focus({preventScroll: true});
    }
    const earlier = messagesRef.current;
    const asked: AssistantMessage = {id: newId(), role: 'user', text: question};
    setMessages(current => [...current, asked]);
    setDraft('');
    setTyping(true);
    try {
      let answer: AssistantMessage | null = null;
      if (ASSISTANT_ENDPOINT) {
        const remote = await askRemote([...earlier, asked], pathRef.current);
        if (remote) answer = toMessage(remote, 'remote');
      }
      if (!answer) {
        // No network, or a new deploy removed the engine's chunk while this tab stayed open: answer anyway.
        const [local] = await Promise.all([loadEngine().catch(() => null), wait(TYPING_MS)]);
        const history = earlier.filter(message => message.role === 'user').map(message => message.text);
        answer = toMessage(local ? local.replyTo(question, {history, page: pathRef.current}) : {
          intent: 'desconocido', cards: [], chips: [],
          text: 'No pude cargar mis respuestas. Revisa tu conexión o recarga la página; también puedes escribirnos por WhatsApp.',
          actions: [{label: `WhatsApp ${TONY_WHATSAPP_NUMBER}`, kind: 'whatsapp', icon: 'whatsapp-solid', href: HELP_WHATSAPP}],
        }, 'local');
      }
      const reply = answer;
      setMessages(current => [...current, reply]);
    } finally {
      setTyping(false);
      busy.current = false;
    }
  }
  const sendRef = useRef(send), openRef = useRef(openPanel);
  sendRef.current = send; openRef.current = openPanel;

  // Other parts of the site can open the assistant (optionally with a question).
  useEffect(() => {
    const onOpen = (event: Event) => {
      if (hiddenRef.current) return;
      openRef.current();
      const question = (event as CustomEvent<{question?: unknown} | null>).detail?.question;
      if (typeof question === 'string' && question.trim()) void sendRef.current(question);
    };
    window.addEventListener('tony:open-assistant', onOpen);
    return () => window.removeEventListener('tony:open-assistant', onOpen);
  }, []);

  // The order flow hides the assistant; leaving it open there would bring it back open later.
  useEffect(() => { if (hidden) { window.clearTimeout(closeTimer.current); setPhase('closed'); setHint(false); } }, [hidden]);

  // First visit: a small bubble after a few seconds, once. It waits for the intro and any open dialog.
  useEffect(() => {
    if (hidden || atHome) return;
    let seen = true;
    try { seen = localStorage.getItem(HINT_KEY) === '1'; } catch { /* Without storage it could nag on every page: skip it. */ }
    if (seen) return;
    let showTimer = 0, hideTimer = 0;
    const schedule = (delay: number) => { window.clearTimeout(showTimer); showTimer = window.setTimeout(show, delay); };
    function show() {
      if (phaseRef.current !== 'closed') { rememberHint(); return; }
      if (document.querySelector('dialog[open]') || (window as IntroWindow).__tonyIntroBoot?.pending) { schedule(3000); return; }
      rememberHint();
      setHint(true);
      hideTimer = window.setTimeout(() => setHint(false), HINT_TIME);
    }
    const pause = () => window.clearTimeout(showTimer), resume = () => schedule(HINT_DELAY);
    schedule(HINT_DELAY);
    window.addEventListener('tony:intro-start', pause);
    window.addEventListener('tony:intro-complete', resume);
    return () => {
      window.clearTimeout(showTimer); window.clearTimeout(hideTimer);
      window.removeEventListener('tony:intro-start', pause);
      window.removeEventListener('tony:intro-complete', resume);
    };
  }, [hidden, atHome]);

  // Opening moves focus into the panel: the text field with a mouse, the panel itself on touch (no surprise keyboard).
  const isOpen = phase === 'open';
  useEffect(() => {
    if (!isOpen) return;
    const target = matchMedia('(pointer: fine)').matches ? input.current : panel.current;
    target?.focus({preventScroll: true});
  }, [isOpen]);

  // Escape closes, also from the launcher.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      const active = document.activeElement;
      if (active === launcher.current || (active && panel.current?.contains(active))) { event.preventDefault(); closePanel(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]); // closePanel only reads refs, so the first one stays valid.

  // Keep the newest answer in view. A tall answer scrolls to its start, a short one to the bottom.
  // The welcome tile is the exception: on a short screen its chips (at the bottom) matter more than the photo.
  const count = messages.length;
  useEffect(() => {
    const box = scroller.current;
    if (!box || !isOpen) return;
    const last = box.querySelector<HTMLElement>('.ta-log > :last-child');
    const behavior: ScrollBehavior = calm() ? 'auto' : 'smooth';
    if (last && !typing && !last.classList.contains('ta-msg--welcome') && last.offsetHeight > box.clientHeight - 48) box.scrollTo({top: last.offsetTop - 12, behavior});
    else box.scrollTo({top: box.scrollHeight, behavior});
  }, [count, typing, isOpen]);

  // On phones the sheet is modal: Tab stays inside it.
  function trapFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab' || !sheet || !panel.current) return;
    const items = Array.from(panel.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled])'));
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(draft);
  }
  const navigate = () => { if (matchMedia(SHEET).matches) closePanel(false); };
  const openSearch = () => { closePanel(false); window.dispatchEvent(new Event('tony:open-search')); };

  if (hidden) return null;
  const trigger = <button ref={launcher} type="button" className="ta-launcher" aria-label={open ? 'Cerrar asistente Tony' : 'Abrir asistente Tony'}
      aria-expanded={phase === 'open'} aria-controls={open ? panelId : undefined} onClick={() => (phase === 'open' ? closePanel() : openPanel())}
      onPointerEnter={warmEngine} onFocus={warmEngine} onTouchStart={warmEngine}>
      <span className="ta-launcher-icon" aria-hidden="true"><Icon name={phase === 'open' ? 'close' : 'sparkle'} size={28}/></span>
      <span className="ta-launcher-label" aria-hidden="true">Asistente Tony</span>
    </button>;
  return <div className="ta-root" data-phase={phase} data-hint={hint || undefined}>
    {hint && !open && !atHome && <div className="ta-hint">
      <button type="button" className="ta-hint-text" onClick={openPanel}>¿Te ayudo a encontrar algo?</button>
      <button type="button" className="ta-hint-close" aria-label="Cerrar sugerencia" onClick={dismissHint}><Icon name="close" size={18}/></button>
    </div>}
    {atHome ? homeLauncher && createPortal(trigger, homeLauncher) : trigger}

    {open && <>
      <div className="ta-backdrop" aria-hidden="true" onClick={() => closePanel()}/>
      <div ref={panel} id={panelId} className="ta-panel" role="dialog" aria-modal={sheet} aria-labelledby={titleId} tabIndex={-1} onKeyDown={trapFocus}>
        <header className="ta-head">
          <AssistantAvatar/>
          <div className="ta-head-text">
            <h2 id={titleId}>Asistente Tony</h2>
            <p>Respuestas al instante · o habla con una persona</p>
          </div>
          <a className="ta-head-btn ta-head-btn--wa" href={HELP_WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label={`Hablar con una persona por WhatsApp al ${TONY_WHATSAPP_NUMBER} (se abre en otra pestaña)`}>
            <Icon name="whatsapp-solid" size={22}/>
          </a>
          <button type="button" className="ta-head-btn" aria-label="Cerrar asistente Tony" onClick={() => closePanel()}><Icon name="close" size={22}/></button>
        </header>

        <div ref={scroller} className="ta-scroll">
          <div className="ta-log" role="log" aria-label="Conversación con el asistente">
            {messages.map((message, index) => <AssistantMessageView key={message.id} message={message} latest={index === messages.length - 1 && !typing}
              onAsk={question => void send(question)} onNavigate={navigate} onSearch={openSearch}/>)}
          </div>
          {typing && <div className="ta-typing" role="status"><span className="tc-sr">El asistente está escribiendo…</span><i/><i/><i/></div>}
        </div>

        <form className="ta-form" onSubmit={submit}>
          <label htmlFor={inputId} className="tc-sr">Escribe tu pregunta</label>
          <input ref={input} id={inputId} type="text" value={draft} onChange={event => setDraft(event.target.value)} placeholder="Escribe tu pregunta…"
            autoComplete="off" enterKeyHint="send" maxLength={500}/>
          <button type="submit" className="ta-send" aria-label="Enviar pregunta" disabled={!draft.trim() || typing}><Icon name="send" size={22}/></button>
        </form>
      </div>
    </>}
  </div>;
}
