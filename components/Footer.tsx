'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import Brand from './Brand';
import Icon from './Icon';
import './site-footer.css';

const columns=[
  {title:'PRODUCTO',links:[['/producto','Explorar Producto'],['/producto#futbol','Fútbol'],['/producto#baloncesto','Baloncesto'],['/producto#empresarial','Empresarial'],['/producto#directorio-producto','Todas las categorías'],['/catalogo','Catálogo']]},
  {title:'SOMOS TONY',links:[['/nosotros','Nuestra historia'],['/patrocinio','Patrocinios'],['/comunidad','Comunidad, App y TonyPlay'],['/tony-news','Tony News']]},
  {title:'PARA TI',links:[['/configurador','Crea tu uniforme'],['/tiendas','Nuestras tiendas'],['/entregas','Entregas'],['/contacto','Contacto'],['/calidad','Calidad y confección'],['/actualidad','Guías y novedades'],['/resenas','Reseñas'],['/recientes','Recientes'],['/carrito','Mi carrito']]},
];

export default function Footer(){const isHome=usePathname()==='/';return <footer className="site-footer tony-footer">
  {isHome&&<div className="tony-footer-invitation"><div><p>EL SIGUIENTE CAPÍTULO LO ESCRIBE TU EQUIPO.</p><h2>HAGAMOS ALGO<br/><em>QUE LOS REPRESENTE.</em></h2></div><div><Link className="tony-footer-start" href="/configurador"><span>CREA TU UNIFORME</span><Icon name="diagonal"/></Link><Link className="tony-footer-talk" href="/contacto">Primero, conversemos <Icon/></Link></div></div>}
  <div className="tony-footer-directory"><div className="tony-footer-identity"><Brand/><p>Identidad que se lleva puesta.<br/>Desde El Salvador, para tu equipo.</p><a className="tony-footer-phone" href="https://wa.me/50370155571" target="_blank" rel="noopener noreferrer"><span>HABLEMOS POR WHATSAPP</span><strong>7015-5571 <Icon name="diagonal"/></strong><small>El Salvador · +503</small></a><a className="tony-footer-social" href="https://www.facebook.com/p/Tony-Sportswear-San-Salvador-61571308625133/" target="_blank" rel="noopener noreferrer">Síguenos en Facebook <Icon name="diagonal"/></a></div>{columns.map((column,index)=><nav className="tony-footer-column" aria-label={column.title} key={column.title}><h3><span>{String(index+1).padStart(2,'0')}</span>{column.title}</h3>{column.links.filter(([href])=>isHome||href!=='/configurador').map(([href,label])=>{const DestinationLink=href.includes("#")?"a":Link;return <DestinationLink href={href} key={href}>{label}<Icon name="diagonal"/></DestinationLink>;})}</nav>)}</div>
  <div className="tony-footer-stamp"><svg viewBox="0 0 80 100" fill="none" aria-hidden="true"><path d="M30 5 7 94M54 5 31 94M78 5 55 94" stroke="currentColor" strokeWidth="7"/></svg><span>SI NO LO TENEMOS,<br/><em>TE LO HACEMOS.</em></span><span className="tony-footer-origin">HECHO CON<br/><strong>IDENTIDAD.</strong><svg className="tony-salvador-flag" viewBox="0 0 60 36" role="img" aria-label="Bandera de El Salvador"><path fill="#0757ad" d="M0 0h60v36H0z"/><path fill="#fff" d="M0 12h60v12H0z"/><g transform="translate(30 18)"><path d="M-4.7 3.5A6 6 0 0 1-5-3M4.7 3.5A6 6 0 0 0 5-3" fill="none" stroke="#43843c" strokeWidth="1"/><path d="m0-4.4 4.4 7.1h-8.8Z" fill="#e7cf70" stroke="#b69137" strokeWidth=".4"/><path d="M-3 2.2-1.9-.3l1 1.3L.1-1 1.2.8 2-.3l1 2.5" fill="#467d41"/><path d="M-3 2.1h6v.5h-6" fill="#367ec4"/><path d="M-.9-2.5h1.8" stroke="#cf4340" strokeWidth=".55"/><circle cy="-3.3" r=".55" fill="#e5b541"/><path d="M-3.7 4.4q3.7 1.5 7.4 0" fill="none" stroke="#b69137" strokeWidth=".55"/></g></svg></span></div>
  <div className="tony-footer-bottom"><span>© {new Date().getFullYear()} Tony Sportswear.</span><a href="mailto:info@tonysportselsalvador.com">info@tonysportselsalvador.com</a><a href="#contenido">Volver arriba <span aria-hidden="true">↑</span></a></div>
</footer>}
