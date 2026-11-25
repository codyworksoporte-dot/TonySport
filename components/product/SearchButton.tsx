'use client';
import type {ReactNode} from 'react';

/** Opens the site search that lives in the header (contract: the `tony:open-search` window event). */
export default function SearchButton({className,children}:{className?:string;children:ReactNode}){
  return <button type="button" className={className} aria-haspopup="dialog" onClick={()=>window.dispatchEvent(new Event('tony:open-search'))}>{children}</button>;
}
