import {siteAsset} from './asset-path';

// The 1080 × 547 artwork is intact at the centre. Only the added margins fade into the leather.
export const brandScreenLogo = siteAsset('/assets/brand/transiciones/tony-piel.webp');
export const brandScreenWidth = 'min(100vw, 155dvh, 1280px)';
const leather = siteAsset('/assets/brand/transiciones/cuero.webp');
export const brandScreenLeather = `linear-gradient(180deg, transparent 32%, #0009 72%, #0006), radial-gradient(ellipse at 50% 38%, transparent 18%, #0006 96%), url("${leather}") center / cover no-repeat #08090a`;
