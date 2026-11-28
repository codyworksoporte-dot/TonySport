'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import Icon from '@/components/Icon';
import type { ShopProduct } from '@/lib/shop';

type Props = {products: ShopProduct[]; categories: {value: string; label: string}[]; latest: number[]};
type Filters = {q: string; categoria: string; min: number; max: number};
const PAGE_SIZE = 12;
const fold = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const money = (value: number) => `$${value.toFixed(2)}`;

function LocationFilters({onChange}: {onChange: (search: string) => void}) {
  const router = useRouter();
  const params = useSearchParams();
  const search = params.toString();
  const isLegacyRse = params.get('categoria') === 'rse-tony';
  useEffect(() => {
    if (isLegacyRse) router.replace('/rse');
    else onChange(search);
  }, [isLegacyRse, router, search, onChange]);
  return null;
}

function ProductLink({product, compact = false}: {product: ShopProduct; compact?: boolean}) {
  const body = <>
    <img className="shop-thumb" src={product.image} alt="" width="84" height="84" decoding="async" loading={!compact && product.href === '/configurador' ? 'eager' : 'lazy'}/>
    <span className="shop-product-copy">
      {!compact && <small>{product.group}</small>}
      <strong>{product.name}</strong>
      <span className="shop-price">{product.price !== null ? money(product.price) : product.href.startsWith('/') ? 'Personalizar' : 'Consultar precio'}</span>
    </span>
    <Icon name={product.href.startsWith('/') ? 'arrow' : 'diagonal'} size={18}/>
  </>;
  return product.href.startsWith('/') ? <Link className="shop-product" href={product.href}>{body}</Link>
    : <a className="shop-product" href={product.href}>{body}</a>;
}

function readFilters(search: string, limit: number, categories: Props['categories']): Filters {
  const params = new URLSearchParams(search);
  const number = (key: string, fallback: number) => {
    const raw = params.get(key)?.trim();
    const n = raw ? Number(raw) : fallback;
    return Number.isFinite(n) ? Math.min(limit, Math.max(0, n)) : fallback;
  };
  const slug = params.get('categoria')?.replace(/^implementos-deportivos$/, 'implementos') ?? '';
  const min = number('min', 0);
  return {q: params.get('q') ?? '', categoria: categories.some(item => item.value === slug) ? slug : '',
    min, max: Math.max(min, number('max', limit))};
}

export default function Storefront({products, categories, latest}: Props) {
  const limit = Math.ceil(Math.max(...products.map(item => item.price ?? 0)));
  const [search, setSearch] = useState('');
  const filters = readFilters(search, limit, categories);
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const list = useRef<HTMLUListElement>(null);
  const resultCount = useRef<HTMLParagraphElement>(null);

  useEffect(() => {setVisible(PAGE_SIZE);}, [search]);

  function apply(next: Filters) {
    const url = new URL(window.location.href);
    for (const key of ['q', 'categoria', 'min', 'max']) url.searchParams.delete(key);
    if (next.q.trim()) url.searchParams.set('q', next.q.trim());
    if (next.categoria) url.searchParams.set('categoria', next.categoria);
    if (next.min > 0) url.searchParams.set('min', String(next.min));
    if (next.max < limit) url.searchParams.set('max', String(next.max));
    if (url.href !== window.location.href) window.history.pushState(null, '', url);
    setSearch(url.searchParams.toString());
    setVisible(PAGE_SIZE);
  }

  const words = fold(filters.q.trim()).split(/\s+/).filter(Boolean);
  const hasPrice = filters.min !== 0 || filters.max !== limit;
  const results = products.filter(item => (!filters.categoria || item.categories.includes(filters.categoria))
    && (!hasPrice || (item.price !== null && item.price >= filters.min && item.price <= filters.max))
    && words.every(word => fold(`${item.name} ${item.group} ${item.categories.join(' ')}`).includes(word)));
  const filtered = !!filters.q || !!filters.categoria || hasPrice;
  function submitFilters(next: Filters) {
    apply(next);
    setExpanded(false);
    requestAnimationFrame(() => {
      const count = resultCount.current;
      if (!count) return;
      count.focus({preventScroll: true});
      const top = count.getBoundingClientRect().top;
      const safeTop = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      if (top < safeTop || top > window.innerHeight - 100) count.scrollIntoView({block: 'start'});
    });
  }

  return <div className="shop-layout">
    <Suspense><LocationFilters onChange={setSearch}/></Suspense>
    <section className="shop-filters shop-panel" aria-label="Buscar y filtrar productos">
      <button className="shop-toggle" type="button" aria-expanded={expanded} aria-controls="shop-controls" onClick={() => setExpanded(!expanded)}>
        <Icon name="search"/>Buscar y filtrar<Icon name="down"/>
      </button>
      <div id="shop-controls" className={expanded ? 'shop-controls is-open' : 'shop-controls'}>
        <FilterControls filters={filters} categories={categories} limit={limit} apply={apply} submitFilters={submitFilters}/>
      </div>
    </section>
    <section className="shop-results" aria-label="Resultados de la tienda">
      <div className="shop-result-head">
        <p role="status" ref={resultCount} tabIndex={-1}>{results.length} {results.length === 1 ? 'producto' : 'productos'}{filters.q && <> · “{filters.q}”</>}</p>
        {filtered && <button type="button" className="shop-clear" onClick={() => apply({q:'', categoria:'', min:0, max:limit})}>Limpiar filtros</button>}
      </div>
      {results.length ? <ul className="shop-products" ref={list}>{results.slice(0,visible).map(item =>
        <li key={item.id} className={item.href === '/configurador' ? 'shop-custom-order' : undefined}><ProductLink product={item}/></li>)}</ul>
        : <p className="shop-empty">Probá con otro nombre, otra categoría o un rango de precio más amplio.</p>}
      {visible < results.length && <button type="button" className="shop-more" onClick={() => {
        const first = visible;
        setVisible(visible + PAGE_SIZE);
        requestAnimationFrame(() => list.current?.children[first]?.querySelector('a')?.focus());
      }}>Ver más productos<Icon name="down" size={17}/></button>}
    </section>
    <aside className="shop-recent shop-panel" aria-labelledby="shop-recent-title">
      <h2 id="shop-recent-title">Últimos productos añadidos</h2>
      <ul>{latest.map(id => products.find(item => item.id === id)).filter((item): item is ShopProduct => !!item)
        .map(item => <li key={item.id}><ProductLink product={item} compact/></li>)}</ul>
    </aside>
  </div>;
}

function FilterControls({filters, categories, limit, apply, submitFilters}: {
  filters: Filters; categories: Props['categories']; limit: number;
  apply: (value: Filters) => void; submitFilters: (value: Filters) => void;
}) {
  const [min, setMin] = useState(String(filters.min));
  const [max, setMax] = useState(String(filters.max));
  const [query, setQuery] = useState(filters.q);
  useEffect(() => {
    setQuery(filters.q);
    setMin(String(filters.min));
    setMax(String(filters.max));
  }, [filters.q, filters.categoria, filters.min, filters.max]);
  const low = min === '' ? 0 : Number(min);
  const high = max === '' ? limit : Number(max);
  function submit(event: FormEvent) {
    event.preventDefault();
    submitFilters({...filters, q:query, min:low, max:high});
  }
  return <>
    <form className="shop-control-group" role="search" onSubmit={event => {event.preventDefault(); submitFilters({...filters, q:query});}}>
      <label className="shop-label" htmlFor="shop-search">Buscar</label>
      <input id="shop-search" type="search" placeholder="Buscar productos…" value={query} onChange={e => setQuery(e.target.value)}/>
      <button className="shop-submit" type="submit"><Icon name="search" size={17}/>Buscar</button>
    </form>
    <div className="shop-control-group">
      <label className="shop-label" htmlFor="shop-category">Categorías</label>
      <select id="shop-category" value={filters.categoria} onChange={e => apply({...filters, categoria:e.target.value})}>
        <option value="">Todas las categorías</option>
        {categories.map(category => <option key={category.value} value={category.value}>{category.label}</option>)}
      </select>
    </div>
    <form className="shop-control-group" onSubmit={submit}>
      <h2 className="shop-label">Filtrar por precio</h2>
      <div className="shop-range" style={{'--low':`${low/limit*100}%`, '--high':`${high/limit*100}%`} as CSSProperties}>
        <input aria-label="Deslizar precio mínimo" type="range" min="0" max={limit} step=".01" value={low} onChange={e => setMin(String(Math.min(high, Number(e.target.value))))}/>
        <input aria-label="Deslizar precio máximo" type="range" min="0" max={limit} step=".01" value={high} onChange={e => setMax(String(Math.max(low, Number(e.target.value))))}/>
      </div>
      <div className="shop-money-inputs">
        <label>Desde ($)<input aria-label="Precio mínimo" type="number" inputMode="decimal" step=".01" min="0" max={high} value={min} onChange={e => setMin(e.target.value)}/></label>
        <label>Hasta ($)<input aria-label="Precio máximo" type="number" inputMode="decimal" step=".01" min={low} max={limit} value={max} onChange={e => setMax(e.target.value)}/></label>
      </div>
      <button className="shop-submit shop-submit-price" type="submit">Filtrar<Icon name="arrow" size={17}/></button>
    </form>
  </>;
}
