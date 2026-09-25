'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { flushSync } from 'react-dom';
import { siteAsset } from '@/lib/asset-path';
import './brand.css';

export default function Brand() {
  const router = useRouter();
  return (
    <Link href="/" className="brand" aria-label="Tony Sportswear — Inicio" onClick={event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      // Mount the global modal before changing routes, so the page never flashes first.
      flushSync(() => window.dispatchEvent(new Event('tony:intro-replay')));
      router.push('/');
      if (['/', '/TonySport', '/TonySport/'].includes(window.location.pathname)) window.scrollTo({ top: 0, behavior: 'instant' });
    }}>
      <Image
        src={siteAsset('/assets/tony-wordmark-transparent-v1.png')}
        alt="TONY Sportswear"
        width={1774}
        height={887}
        sizes="150px"
        className="official-logo"
        preload
      />
    </Link>
  );
}
