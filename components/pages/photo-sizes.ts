// `sizes` for the photos of the tp-* pages: how wide components/pages/pages.css draws each one (object-fit:
// cover), rounded up a little so the browser never picks a copy softer than the screen. Phones get the
// full-width photo; 1383px is where .tc-wrap reaches its 1320px maximum.

/** .tp-tiles: two tiles per row, one on phones. */
export const TILE_SIZES = '(max-width: 599px) calc(100vw - 32px), (max-width: 899px) 50vw, (max-width: 1383px) calc(50vw - 40px), 652px';
/** .tp-tiles--3: three tiles per row, one on phones. */
export const TILE3_SIZES = '(max-width: 599px) calc(100vw - 32px), (max-width: 899px) 33vw, (max-width: 1383px) calc(33vw - 20px), 430px';
/** .tp-stores-photo, beside the title from 900px. */
export const STORES_PHOTO_SIZES = '(max-width: 899px) calc(100vw - 32px), (max-width: 1383px) calc(54vw - 40px), 700px';
/** .tp-app-photo, beside the download panel from 900px (560px tall, so never drawn under 448px wide). */
export const APP_PHOTO_SIZES = '(max-width: 899px) calc(100vw - 32px), 586px';
/** .tp-lookup-media, the right part of the order lookup card from 900px. */
export const LOOKUP_PHOTO_SIZES = '(max-width: 899px) calc(100vw - 32px), 607px';
