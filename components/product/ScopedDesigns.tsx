import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { designBatch, type Album, type Photo } from '@/lib/design-photos';
import { productInquiry } from '@/lib/products';
import DesignGrid from './DesignGrid';
import './scoped-designs.css';

type Props = {title: string; albums: Album[]; back: {name: string; href: string}};

export default async function ScopedDesigns({title, albums, back}: Props) {
  const first = await designBatch(albums, 0, async id => {
    const contents = await readFile(join(process.cwd(), 'public/assets/colecciones', id + '.json'), 'utf8');
    return (JSON.parse(contents) as {images: Photo[]}).images;
  });
  return <main id="contenido" className="tc-page scoped-designs"><div className="tc-wrap">
    <header className="tc-head"><Link className="tc-back" href={back.href}><Icon name="left"/>{back.name}</Link><h1>{title}</h1></header>
    {first.length ? <DesignGrid key={albums.map(album=>album.id).join('-')} title={title} albums={albums} first={first}/> :
      <div className="scope-empty"><p>Esta línea aún no tiene diseños publicados.</p><a className="tc-btn tc-btn--lime" href={productInquiry(title)}>Consultar esta línea <Icon name="whatsapp"/></a></div>}
  </div></main>;
}
