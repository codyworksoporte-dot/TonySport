import type {Metadata} from 'next';
import Link from 'next/link';
import Icon from '@/components/Icon';
import CategoryTitle from '@/components/product/CategoryTitle';
import DisciplineGrid from '@/components/product/DisciplineGrid';
import {DISCIPLINES_TITLE} from '@/lib/disciplines';
import '@/components/product/product.css';

export const metadata:Metadata={
  title:DISCIPLINES_TITLE,
  description:'Escoge tu disciplina deportiva y mira los productos de Tony Sportswear.',
};

// The old "Líneas" page now shows the same picture buttons; each one opens its section on /producto.
export default function Lineas(){
  return <main id="contenido" className="tc-page pd-page">
    <div className="tc-wrap">
      <header className="tc-head pd-head">
        <Link className="tc-back" href="/"><Icon name="left"/>Inicio</Link>
        <h1><CategoryTitle title={DISCIPLINES_TITLE}/></h1>
        <p>Toca una disciplina y mira sus productos.</p>
      </header>
      <DisciplineGrid/>
    </div>
  </main>;
}
