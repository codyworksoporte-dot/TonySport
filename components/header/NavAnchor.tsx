import Link from 'next/link';
import type {AnchorHTMLAttributes, ReactNode} from 'react';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {href: string; external?: boolean; prefetch?: boolean; children: ReactNode};

/** An internal route through next/link, or an outside address in a new tab (announced to screen readers). */
export default function NavAnchor({href, external, prefetch, children, ...rest}: Props) {
  if (external) return <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>{children}{!rest['aria-label'] && <span className="tc-sr"> (se abre en otra pestaña)</span>}</a>;
  return <Link href={href} prefetch={prefetch} {...rest}>{children}</Link>;
}
