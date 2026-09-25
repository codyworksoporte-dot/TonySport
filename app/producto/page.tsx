import type {Metadata} from 'next';
import Link from 'next/link';
import LineExplorer from '@/components/LineExplorer';
import Icon from '@/components/Icon';
import {PRODUCT_CATEGORIES,productInquiry} from '@/lib/products';
import ProductDirectorySync from './ProductDirectorySync';
import './producto.css';

export const metadata:Metadata={title:'Producto · líneas y confección Tony',description:'Explora las líneas deportivas y empresariales de Tony, sus opciones de confección, réplicas, moldes, logos e implementos.'};

export default function Producto(){return <main id="contenido" className="internal-page product-page"><ProductDirectorySync/>
  <header className="section-wrap internal-hero product-heading">
    <div className="internal-breadcrumb"><Link href="/">Inicio</Link><span>/</span><span>Producto</span></div>
    <div className="product-heading-main"><div><p className="eyebrow"><span className="section-index">01</span> UNA IDENTIDAD. MUCHAS FORMAS DE LLEVARLA.</p><h1>ENCUENTRA<br/><em>TU TERRENO.</em></h1></div><div className="product-heading-aside"><p>De la cancha a tu empresa. Explora cada línea y encuentra la base para lo que tienes en mente.</p><a href="#directorio-producto">Ver todas las categorías <Icon name="arrow"/></a></div></div>
  </header>
  <LineExplorer full/>
  <section id="directorio-producto" className="product-directory" aria-labelledby="product-directory-title">
    <header><div><p className="eyebrow"><span className="section-index">02</span> EL UNIVERSO DEL PRODUCTO.</p><h2 id="product-directory-title">CADA DETALLE.<br/><em>CADA POSIBILIDAD.</em></h2></div><p>Confección, acabados y complementos. Abre una categoría para conocer todas sus opciones.</p></header>
    <div className="product-category-grid">{PRODUCT_CATEGORIES.map((category,index)=><details className="product-category" id={`categoria-${category.id}`} key={category.id}>
      <summary><span className="product-category-index">{String(index+1).padStart(2,'0')}</span><h3>{category.label}</h3><span className="product-category-toggle" aria-hidden="true">+</span></summary>
      <div className="product-category-body"><p>{category.description}</p>
        {category.children.length>0&&<ul>{category.children.map(child=><li id={`opcion-${child.id}`} key={child.id}><span>{child.label}</span><a href={productInquiry(child.label)} target="_blank" rel="noopener noreferrer" aria-label={`Consultar ${child.label} por WhatsApp`}><Icon name="diagonal"/><span className="sr-only">Consultar</span></a></li>)}</ul>}
        <div className="product-category-actions"><a href={category.line==='calidad'?'/calidad':`/producto#${category.line}`}>{category.line==='calidad'?'Conoce los acabados':'Explorar esta línea'} <Icon name="arrow"/></a><a href={productInquiry(category.label)} target="_blank" rel="noopener noreferrer">Consultar con Tony <Icon name="diagonal"/></a></div>
      </div>
    </details>)}</div>
    <div className="product-availability"><Icon name="shield"/><div><strong>El catálogo nuevo está en preparación.</strong><p>Estas son nuestras familias de producto. Los diseños, precios y disponibilidad se confirman con Tony.</p></div><Link href="/catalogo">Estado del catálogo <Icon name="diagonal"/></Link></div>
  </section>
  <section className="product-next" aria-label="Ayuda para elegir"><div><p className="eyebrow">TU IDEA MERECE UNA BUENA BASE.</p><h2>DEL USO,<br/><em>AL ÚLTIMO DETALLE.</em></h2></div><nav><Link href="/calidad"><span>01</span><div><strong>Técnicas y confección</strong><small>Conoce los acabados para tu prenda.</small></div><Icon name="diagonal"/></Link><Link href="/tiendas"><span>02</span><div><strong>Encuentra tu tienda</strong><small>Conversa con la sucursal más cercana.</small></div><Icon name="diagonal"/></Link><Link href="/entregas"><span>03</span><div><strong>Recibe tu pedido</strong><small>Consulta las opciones de entrega.</small></div><Icon name="diagonal"/></Link></nav></section>
</main>}
