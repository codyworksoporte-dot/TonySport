import SectionImage from './SectionImage';
import Link from 'next/link';
import type { ReactNode } from 'react';
import '@/app/editorial.css';

export const TONY_WHATSAPP = 'https://wa.me/50370155571';
export function whatsappLink(message: string) { return `${TONY_WHATSAPP}?text=${encodeURIComponent(message)}`; }
export function EditorialShell({ children, className = '' }: { children: ReactNode; className?: string }) { return <main id="contenido" className={`te ${className}`}>{children}</main>; }
export function EditorialHero({ label, eyebrow, title, description, aside }: { label: string; eyebrow: string; title: ReactNode; description: string; aside?: ReactNode }) {
  return <header className={`te-hero${aside ? ' te-hero-split' : ''}`}><nav className="te-breadcrumb" aria-label="Ruta de navegación"><Link href="/">Inicio</Link><span aria-hidden="true">/</span><span>{label}</span></nav><div className="te-hero-copy"><p className="te-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="te-lead">{description}</p></div>{aside && <div className="te-hero-aside">{aside}</div>}</header>;
}
export function EditorialLink({ href, children, outline = false, external = false }: { href: string; children: ReactNode; outline?: boolean; external?: boolean }) {
  const className = `te-button${outline ? ' te-button-outline' : ''}`;
  return external ? <a className={className} href={href} target="_blank" rel="noopener noreferrer">{children}<span aria-hidden="true">↗</span></a> : <Link href={href} className={className}>{children}<span aria-hidden="true">↗</span></Link>;
}
export function SectionLabel({ number, children }: { number: string; children: ReactNode }) { return <p className="te-section-label"><span>{number}</span>{children}</p>; }
export function SourceNote({ href, children }: { href: string; children: ReactNode }) { return <p className="te-source">{children} <a href={href} target="_blank" rel="noopener noreferrer">Ver publicación de Tony <span aria-hidden="true">↗</span></a></p>; }
export function StitchArtwork() {
  return <div className="te-stitch-art" role="img" aria-label="Ilustración de tela, costura y acabado"><SectionImage photo="calidad" /><span className="te-fabric-number">01—03</span><div className="te-fabric-labels"><span>01 / TELA</span><span>02 / CONFECCIÓN</span><span>03 / ACABADO</span></div><span className="te-art-note">EL DETALLE TAMBIÉN JUEGA.</span></div>;
}
