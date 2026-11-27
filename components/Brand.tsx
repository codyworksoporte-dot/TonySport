'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { flushSync } from 'react-dom';
import { siteAsset } from '@/lib/asset-path';
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
      {/* Drawn 46–64 px tall: the 240 px copy (240×216) stays sharp on 3x screens at a third of the bytes. */}
      <Image
        src={siteAsset('/assets/brand/tony-logo-240.webp')}
        alt="TONY Sportswear"
        width={480}
        height={432}
        sizes="(max-width: 900px) 56px, 72px"
        className="official-logo"
        preload
      />
    </IntentLink>
  );
}
