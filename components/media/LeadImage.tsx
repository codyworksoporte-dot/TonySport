'use client';

import type {ImgHTMLAttributes} from 'react';

/**
 * The image a page leads with (its LCP), loaded at once and first. It is a plain <img>, rendered from a client
 * component on purpose: the page's own HTML still preloads it in the <head> (as a responsive preload when it has
 * srcset), but the RSC payload that next/link prefetches for this page carries no image hint, so other pages that
 * link here do not download it in the background.
 */
export default function LeadImage({loading = 'eager', fetchPriority = 'high', decoding = 'async', alt = '', ...props}: ImgHTMLAttributes<HTMLImageElement>) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt} loading={loading} fetchPriority={fetchPriority} decoding={decoding} {...props}/>;
}
