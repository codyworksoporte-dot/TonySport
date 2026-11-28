import type { ComponentPropsWithRef } from 'react';
import { siteAsset } from '@/lib/asset-path';

type Props = Omit<ComponentPropsWithRef<'img'>, 'src' | 'srcSet' | 'width' | 'height'>;

export default function TonyWordmark({ sizes, alt = '', ...props }: Props) {
  const src = siteAsset('/assets/brand/tony-wordmark-240.webp');
  const srcSet = sizes ? [240, 640, 1080].map(width =>
    `${siteAsset(width === 1080 ? '/assets/brand/tony-wordmark.webp' : `/assets/brand/tony-wordmark-${width}.webp`)} ${width}w`
  ).join(', ') : undefined;
  return <img src={src} srcSet={srcSet} sizes={sizes} alt={alt} width={1080} height={547} draggable={false} decoding="async" {...props}/>;
}
