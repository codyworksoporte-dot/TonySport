import Link from 'next/link';
import type {AnchorHTMLAttributes, ReactNode} from 'react';
import IntentLink from '../IntentLink';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {href: string; external?: boolean; prefetch?: boolean; intent?: boolean; children: ReactNode};

/**
 * An internal route through next/link, or an outside address in a new tab (announced to screen readers).
 * `intent` prefetches the route only on hover, focus or touch (long lists of links).
 */
export default function NavAnchor({href, external, prefetch, intent, children, ...rest}: Props) {
  if (external) return <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>{children}{!rest['aria-label'] && <span className="tc-sr"> (se abre en otra pestaña)</span>}</a>;
  if (intent) return <IntentLink href={href} {...rest}>{children}</IntentLink>;
  return <Link href={href} prefetch={prefetch} {...rest}>{children}</Link>;
}
