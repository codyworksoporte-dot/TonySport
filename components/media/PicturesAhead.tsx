'use client';

import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {whenPageSettles} from '@/lib/page-settled';

type Connection = {saveData?: boolean; effectiveType?: string};

/** How far above and below the screen a marked block gets its pictures ready: two screens, at most Chrome's 4G lazy-load distance. */
const ahead = () => `${Math.round(Math.min(2 * innerHeight, 1250))}px 0px`;

/**
 * Pictures inside a block marked `data-ahead` are fetched and decoded together once the block comes near the
 * viewport (two screens, at most 1250 px). Meant for blocks that clip their pictures, such as the disciplines marquee: the browser
 * only lazy-loads a clipped picture when it slides into view, so while scrolling the chips showed up as empty
 * circles for a moment. Other pictures keep the browser's own lazy loading (measured: they already arrive in time).
 * Starts once the page has settled and stays off when the visitor asked to save data or the connection is 2G.
 */
export default function PicturesAhead() {
  const pathname = usePathname();
  useEffect(() => {
    const connection = (navigator as Navigator & {connection?: Connection}).connection;
    if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? '')) return;
    if (typeof IntersectionObserver !== 'function') return;
    let near: IntersectionObserver | null = null;
    const decoded = new Set<string>();
    const decode = (img: HTMLImageElement) => {
      // Copies of a marquee share one file: decoding it once readies every copy.
      const file = img.currentSrc || img.src;
      if (decoded.has(file)) return;
      decoded.add(file);
      img.decode().catch(() => { /* Broken or gone: nothing to prepare. */ });
    };
    const ready = (img: HTMLImageElement) => {
      if (img.loading === 'lazy') img.loading = 'eager';
      if (img.complete) decode(img);
      else img.addEventListener('load', () => decode(img), {once: true});
    };
    const start = () => {
      const blocks = document.querySelectorAll('[data-ahead]');
      if (!blocks.length) return;
      near = new IntersectionObserver(entries => {
        for (const {target, isIntersecting} of entries) {
          if (!isIntersecting) continue;
          near?.unobserve(target);
          target.querySelectorAll('img').forEach(ready);
        }
      }, {rootMargin: ahead()});
      blocks.forEach(block => near?.observe(block));
    };
    const cancel = whenPageSettles(start, {imageWait: 2000, idleTimeout: 1000});
    return () => { cancel(); near?.disconnect(); };
  }, [pathname]);
  return null;
}
