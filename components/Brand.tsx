'use client';

import TonyWordmark from './TonyWordmark';
import { useRouter } from 'next/navigation';
import { flushSync } from 'react-dom';
import IntentLink from './IntentLink';
import './brand.css';

export default function Brand() {
  const router = useRouter();
  // The logo sits in the header, menu and footer of every page: prefetching Inicio on sight would pull its photos
  // on every page, so it prefetches on hover, focus or touch instead.
  return (
    <IntentLink href="/" className="brand" aria-label="Tony Sportswear — Inicio" onClick={event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      if (matchMedia('(max-width: 900px), (pointer: coarse)').matches) return;
      event.preventDefault();
      // Mount the global modal before changing routes, so the page never flashes first.
      flushSync(() => window.dispatchEvent(new Event('tony:intro-replay')));
      router.push('/');
      if (['/', '/TonySport', '/TonySport/'].includes(window.location.pathname)) window.scrollTo({ top: 0, behavior: 'instant' });
    }}>
      <TonyWordmark alt="TONY Sportswear" className="official-logo"/>
    </IntentLink>
  );
}
