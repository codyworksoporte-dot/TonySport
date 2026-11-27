'use client';
import Link from 'next/link';
import {useState, type ComponentProps} from 'react';

type Props = Omit<ComponentProps<typeof Link>, 'prefetch'>;

/**
 * A next/link that prefetches on intent only: pointer over it, keyboard focus or a touch.
 * Being on screen is not enough, so long lists (footer, menus, chips) never download
 * every route behind them, with their images, while the page loads or scrolls.
 */
export default function IntentLink({onMouseEnter, onTouchStart, onFocus, ...props}: Props) {
  const [wanted, setWanted] = useState(false);
  // null restores Next's default prefetch once the visitor shows interest (docs: "Hover-triggered prefetch").
  return <Link {...props} prefetch={wanted ? null : false}
    onMouseEnter={event => { setWanted(true); onMouseEnter?.(event); }}
    onTouchStart={event => { setWanted(true); onTouchStart?.(event); }}
    onFocus={event => { setWanted(true); onFocus?.(event); }}/>;
}
