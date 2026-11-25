import type {CSSProperties} from 'react';
import {siteAsset} from '@/lib/asset-path';

/**
 * The assistant's face, used in the panel header and the welcome tile: Tony, the brand crocodile
 * (head close-up of the 2026 logo) inside a lime ring. It is decorative; the panel title names it.
 * The size travels as --ta-avatar so the stylesheet can still shrink it on narrow phones.
 */
export default function AssistantAvatar({size = 44}: {size?: number}) {
  return <span className="ta-avatar ta-avatar--tony" style={{'--ta-avatar': `${size}px`} as CSSProperties} aria-hidden="true">
    <img src={siteAsset('/assets/brand/tony-head.webp')} alt="" width={512} height={512} decoding="async"/>
  </span>;
}
