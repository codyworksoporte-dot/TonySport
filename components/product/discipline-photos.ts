import {DISCIPLINES} from '@/lib/disciplines';
import {responsive} from '@/lib/responsive-image';

// How wide each DisciplineGrid tile draws its photo (product.css, object-fit: cover): 2 columns on phones (the lead
// spans both), 4 on tablets (the lead spans 2×2), 5 on desktop (the two wide ones span 2); 1383px is where .tc-wrap
// stops growing. Tablet values are rounded up, since short rows can make a tile draw its photo wider than itself.
// Kept apart from DisciplineGrid (no CSS import) so other pages can name the same files.
const LEAD_SIZES='(max-width: 639px) calc(100vw - 32px), (max-width: 899px) 52vw, (max-width: 1099px) 50vw, (max-width: 1383px) calc(40vw - 35px), 519px';
const WIDE_SIZES='(max-width: 639px) calc(50vw - 21px), (max-width: 1099px) 25vw, (max-width: 1383px) calc(40vw - 35px), 519px';
const TILE_SIZES='(max-width: 639px) calc(50vw - 21px), (max-width: 1099px) 25vw, (max-width: 1383px) calc(20vw - 20px), 252px';

/** Tiles a 390×844 phone shows on arrival: the lead and the next two rows. */
export const ON_SCREEN=5;

/** The lead tiles get a wider responsive image than the single-column cards. */
export const disciplinePhoto=(image:`/assets/${string}`,index:number)=>responsive(image,index===0?LEAD_SIZES:index===1?WIDE_SIZES:TILE_SIZES);

/** The photos on screen on arrival at /producto, exactly as DisciplineGrid draws them (same files, same cache entries). */
export const leadTilePhotos=()=>DISCIPLINES.slice(0,ON_SCREEN).map((discipline,index)=>disciplinePhoto(discipline.image,index));
