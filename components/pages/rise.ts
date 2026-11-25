import type {CSSProperties} from 'react';

/** Stagger index for the .tc-rise entrance (each step waits 55ms more). */
export const rise = (index: number) => ({'--i': index}) as CSSProperties;
