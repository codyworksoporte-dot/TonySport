'use client';
import type {CSSProperties} from 'react';
import Icon from '@/components/Icon';

/** The big search pill on the home. It opens the site search that lives in the header. */
export default function HomeSearch({style}: {style?: CSSProperties}) {
  return <button type="button" className="tc-pill home-search tc-rise" style={style} aria-haspopup="dialog" onClick={() => window.dispatchEvent(new Event('tony:open-search'))}>
    <Icon name="search" size={26}/>
    <span className="home-search-text">Busca un uniforme, un balón o una tienda</span>
    <span className="home-search-go" aria-hidden="true"><span>Buscar</span><Icon name="arrow"/></span>
  </button>;
}
