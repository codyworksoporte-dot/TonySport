'use client';
import Link from 'next/link';
import type {CSSProperties, ReactNode} from 'react';
import Icon, {type IconName} from '@/components/Icon';
import {siteAsset} from '@/lib/asset-path';
import type {AssistantAction, AssistantActionKind, AssistantAsset, AssistantCard, AssistantMessage, AssistantPlace} from '@/lib/assistant/types';
import AssistantAvatar from './AssistantAvatar';

const NEW_TAB = <span className="tc-sr"> (se abre en otra pestaña)</span>;
const WELCOME_IMAGE: AssistantAsset = '/assets/sections/nosotros-tony.webp';
const DEFAULT_ICON: Record<AssistantActionKind, IconName> = {
  link: 'arrow', external: 'diagonal', whatsapp: 'whatsapp-solid', tel: 'phone', mail: 'chat', search: 'search',
};

type Handlers = {
  /** Called after an internal link is followed (the panel closes on phones). */
  onNavigate: () => void;
  /** Opens the site search. */
  onSearch: () => void;
  /** Sends a follow-up question (chips and "ask" cards). */
  onAsk: (question: string) => void;
};

function ActionButton({action, primary, onNavigate, onSearch}: {action: AssistantAction; primary: boolean} & Omit<Handlers, 'onAsk'>) {
  const className = `ta-action${action.kind === 'whatsapp' ? ' ta-action--wa' : primary ? ' ta-action--primary' : ''}`;
  const content = <><Icon name={action.icon ?? DEFAULT_ICON[action.kind]} size={18}/><span>{action.label}</span></>;
  if (action.kind === 'search' || !action.href) return <button type="button" className={className} onClick={onSearch}>{content}</button>;
  if (action.kind === 'link') return <Link className={className} href={action.href} prefetch={false} onClick={onNavigate}>{content}</Link>;
  if (action.kind === 'tel' || action.kind === 'mail') return <a className={className} href={action.href}>{content}</a>;
  return <a className={className} href={action.href} target="_blank" rel="noopener noreferrer">{content}{NEW_TAB}</a>;
}

function Card({card, onNavigate, onAsk}: {card: AssistantCard} & Pick<Handlers, 'onNavigate' | 'onAsk'>) {
  const inner: ReactNode = <>
    <img src={siteAsset(card.image)} alt="" width={240} height={240} loading="lazy" decoding="async"/>
    <span className="ta-card-label"><b>{card.title}</b>{card.note && <small>{card.note}</small>}</span>
    <span className="ta-card-go" aria-hidden="true"><Icon name={card.external ? 'diagonal' : 'arrow'} size={16}/></span>
  </>;
  if (card.ask) {
    const question = card.ask;
    return <button type="button" className="ta-card" onClick={() => onAsk(question)}>{inner}</button>;
  }
  if (!card.href) return null;
  if (card.external) return <a className="ta-card" href={card.href} target="_blank" rel="noopener noreferrer">{inner}{NEW_TAB}</a>;
  return <Link className="ta-card" href={card.href} prefetch={false} onClick={onNavigate}>{inner}</Link>;
}

function Place({place}: {place: AssistantPlace}) {
  return <div className="ta-place">
    <span className="ta-place-icon" aria-hidden="true"><Icon name="store" size={22}/></span>
    <div><b>Tienda {place.name}</b><p>{place.address}</p><p className="ta-place-phone">Tel. {place.phone}</p></div>
  </div>;
}

/** The opening greeting as a picture tile; its closing question ("¿En qué te ayudo?") stands out in lime. */
function Welcome({text}: {text: string}) {
  const [, lead = text, question = ''] = /^(.*?[.!])\s+(¿[^?]+\?)$/.exec(text) ?? [];
  return <div className="ta-welcome">
    <img src={siteAsset(WELCOME_IMAGE)} alt="" width={960} height={1200} decoding="async"/>
    <AssistantAvatar size={52}/>
    <p className="ta-welcome-text"><span className="tc-sr">Asistente: </span>{lead}{question && <> <em>{question}</em></>}</p>
  </div>;
}

/** One message of the conversation. Chips show only under the latest answer. */
export default function AssistantMessageView({message, latest, ...handlers}: {message: AssistantMessage; latest: boolean} & Handlers) {
  if (message.role === 'user') {
    return <div className="ta-msg ta-msg--user"><p><span className="tc-sr">Tú: </span>{message.text}</p></div>;
  }
  const cards = message.cards ?? [], actions = message.actions ?? [], chips = latest ? message.chips ?? [] : [];
  const chipList = chips.length > 0 && <div className="ta-chips" role="group" aria-label="Sugerencias">
    {chips.map((chip, index) => <button key={chip} type="button" className="ta-chip" style={{'--i': index} as CSSProperties} onClick={() => handlers.onAsk(chip)}>{chip}</button>)}
  </div>;
  if (message.welcome) return <div className="ta-msg ta-msg--bot ta-msg--welcome"><Welcome text={message.text}/>{chipList}</div>;
  return <div className="ta-msg ta-msg--bot">
    <p className="ta-bubble"><span className="tc-sr">Asistente: </span>{message.text}</p>
    {message.place && <Place place={message.place}/>}
    {cards.length > 0 && <div className="ta-cards" data-count={Math.min(cards.length, 3)}>
      {cards.slice(0, 3).map(card => <Card key={`${card.title}-${card.href ?? card.ask}`} card={card} onNavigate={handlers.onNavigate} onAsk={handlers.onAsk}/>)}
    </div>}
    {actions.length > 0 && <div className="ta-actions">
      {actions.map((action, index) => <ActionButton key={`${action.label}-${index}`} action={action} primary={index === 0} onNavigate={handlers.onNavigate} onSearch={handlers.onSearch}/>)}
    </div>}
    {chipList}
  </div>;
}
