import type { MetadataRoute } from 'next';
import { siteAsset } from '@/lib/asset-path';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tony Sportswear El Salvador',
    short_name: 'Tony',
    lang: 'es-SV',
    start_url: './',
    scope: './',
    display: 'standalone',
    background_color: '#080e0b',
    theme_color: '#080e0b',
    icons: [
      {src: siteAsset('/assets/brand/tony-app-192.png'), sizes: '192x192', type: 'image/png'},
      {src: siteAsset('/assets/brand/tony-app-512.png'), sizes: '512x512', type: 'image/png'},
    ],
  };
}
