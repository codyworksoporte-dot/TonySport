'use client';

import {useEffect, useRef, useState} from 'react';
import Icon from '@/components/Icon';
import {siteAsset} from '@/lib/asset-path';
import {businessLines, type BusinessLine} from '@/lib/business-lines';
import {whatsappLink} from '@/lib/site-links';
import './product-gallery.css';

export type BusinessProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  variants?: {label: string; price: number}[];
  detail?: string;
};

const currency = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'});

function ProductPrice({product}: {product: BusinessProduct}) {
  if (product.variants?.length) {
    return <dl className="bp-variants">{product.variants.map(variant =>
      <div key={variant.label}><dt>{variant.label}</dt><dd>{currency.format(variant.price / 100)}</dd></div>
    )}</dl>;
  }
  return <p className="bp-price">{currency.format(product.price / 100)}</p>;
}

function EnquiryLink({product, line}: {product: BusinessProduct; line: BusinessLine}) {
  const message = `Hola, Tony. Me interesa este producto de la línea ${businessLines[line].name}: ${product.name}. ¿Me pueden ayudar con la disponibilidad y un pedido?`;
  return <a className="bp-enquiry" href={whatsappLink(message)} target="_blank" rel="noopener noreferrer"
    aria-label={`Consultar por WhatsApp sobre ${product.name}`}>
    <Icon name="whatsapp-solid" size={18}/> Consultar por WhatsApp
  </a>;
}

function poster(line: BusinessLine, product: BusinessProduct, thumbnail = false) {
  return siteAsset(`/assets/empresarial/${line}/productos/${product.id}${thumbnail ? '-480' : ''}.webp`);
}

export default function ProductGallery({line, products}: {line: BusinessLine; products: BusinessProduct[]}) {
  const [selected, setSelected] = useState<BusinessProduct | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (selected && !dialog.current?.open) dialog.current?.showModal();
  }, [selected]);

  return <section className="bp-gallery" aria-labelledby="bp-gallery-title">
    <header className="bp-heading">
      <h2 id="bp-gallery-title">Catálogo {businessLines[line].name}</h2>
      <span>{products.length} productos</span>
    </header>
    <ul className="bp-grid">{products.map(product => <li key={product.id} className="bp-card">
      <button type="button" className="bp-thumb" aria-haspopup="dialog" aria-label={`Ampliar ficha de ${product.name}`}
        onClick={event => {trigger.current = event.currentTarget; setSelected(product);}}>
        <span className="bp-poster-frame"><img src={poster(line, product, true)} width="480" height={line === 'factory' ? 480 : 640} alt="" loading="lazy" decoding="async"/></span>
        <span className="bp-thumb-caption"><span className="bp-category">{product.category}</span><Icon name="search" size={18}/></span>
      </button>
      <div className="bp-card-copy">
        <h3>{product.name}</h3>
        <div className="bp-terms">
          <ProductPrice product={product}/>
          {product.detail && <p className="bp-detail">{product.detail}</p>}
        </div>
        <EnquiryLink product={product} line={line}/>
      </div>
    </li>)}</ul>
    <dialog className="bp-dialog" ref={dialog} aria-labelledby="bp-detail-title"
      onClick={event => {if (event.target === event.currentTarget) event.currentTarget.close();}}
      onClose={() => {setSelected(null); trigger.current?.focus({preventScroll: true});}}>
      {selected && <div className="bp-dialog-inner">
        <header className="bp-dialog-head">
          <div>
            <span className="bp-category">Línea {businessLines[line].name} · {selected.category}</span>
            <h2 id="bp-detail-title">{selected.name}</h2>
          </div>
          <button type="button" autoFocus aria-label="Cerrar ficha" className="bp-close" onClick={() => dialog.current?.close()}>
            <Icon name="close" size={23}/>
          </button>
        </header>
        <img className="bp-dialog-poster" src={poster(line, selected)} alt={`Ficha de ${selected.name}`}/>
        <div className="bp-dialog-foot">
          <div><ProductPrice product={selected}/>{selected.detail && <p className="bp-detail">{selected.detail}</p>}</div>
          <EnquiryLink product={selected} line={line}/>
        </div>
      </div>}
    </dialog>
  </section>;
}
