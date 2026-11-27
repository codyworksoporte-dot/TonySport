'use client';

import {useEffect} from 'react';
import {whenPageSettles} from '@/lib/page-settled';

export type WarmImage = {src: string; srcSet?: string; sizes?: string};
type Connection = {saveData?: boolean; effectiveType?: string};

/**
 * Loads, at low priority, the pictures another page shows on arrival, once this page has settled and the visitor
 * has looked at the way into it (the element with id `watch` on screen for `dwell` ms). Arriving there, they are
 * already in the cache, as when the link prefetch carried them, but only for visitors who showed interest instead
 * of on every page. The same src/srcSet/sizes as the destination's <img> picks the same file. Renders nothing;
 * skipped when the visitor asked to save data or the connection is very slow.
 */
export default function WarmImages({watch, images, dwell = 800}: {watch: string; images: WarmImage[]; dwell?: number}) {
  useEffect(() => {
    const connection = (navigator as Navigator & {connection?: Connection}).connection;
    if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? '')) return;
    const target = document.getElementById(watch);
    if (!target || typeof IntersectionObserver !== 'function') return;
    let settled = false, seen = false, done = false, timer = 0;
    const warm = () => {
      if (done || !settled || !seen) return;
      done = true;
      observer.disconnect();
      for (const {src, srcSet, sizes} of images) {
        const image = new Image();
        image.decoding = 'async';
        image.setAttribute('fetchpriority', 'low');
        // sizes and srcset before src, so the browser picks the copy the destination will ask for.
        if (sizes) image.sizes = sizes;
        if (srcSet) image.srcset = srcSet;
        image.src = src;
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      clearTimeout(timer);
      if (entry?.isIntersecting) timer = window.setTimeout(() => { seen = true; warm(); }, dwell);
    });
    observer.observe(target);
    const cancel = whenPageSettles(() => { settled = true; warm(); });
    return () => { done = true; observer.disconnect(); clearTimeout(timer); cancel(); };
  }, []); // Props come from a server component and never change.
  return null;
}
