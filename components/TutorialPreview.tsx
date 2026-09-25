import Image from 'next/image';
import RevealText from './RevealText';
import { siteAsset } from '@/lib/asset-path';
import './tutorial-preview.css';

export default function TutorialPreview() {
  return <section className="tutorial-preview section-wrap" id="tutorial" aria-labelledby="tutorial-title">
    <header className="tutorial-heading">
      <div><p className="eyebrow"><span className="section-index">02</span> TU IDEA, PASO A PASO.</p><RevealText id="tutorial-title">TÚ PONES LA IDEA.<br/><em>TE GUIAMOS EN EL RESTO.</em></RevealText></div>
      <p>Aprende a completar los datos del equipo, subir tus diseños y ajustar cada detalle del uniforme.</p>
    </header>
    <figure className="tutorial-film">
      <div className="tutorial-cover">
        <div className="tutorial-cover-grid" aria-hidden="true"/>
        <div className="tutorial-cover-copy"><span className="tutorial-status">VIDEO TUTORIAL · PRÓXIMAMENTE</span><div className="tutorial-frame-icon" aria-hidden="true"><svg viewBox="0 0 56 56" fill="none"><rect x="4" y="10" width="48" height="36" rx="5" stroke="currentColor" strokeWidth="1.5"/><path d="m23 20 14 8-14 8z" fill="currentColor"/><path d="M13 5v6m30-6v6M13 45v6m30-6v6" stroke="currentColor" strokeWidth="2"/></svg></div><h3>AQUÍ APRENDERÁS<br/>A HACERLO <em>TUYO.</em></h3><p>Del primer jugador<br/>al último detalle del diseño.</p></div>
        <div className="tutorial-editor-shot"><Image src={siteAsset('/assets/tutorial-editor-reference.png')} alt="Imagen de referencia del editor Tony: uniforme, elementos del diseño y herramientas de personalización" width={1234} height={1476} sizes="(max-width:640px) 80vw, 46vw"/><span>UNA VISTA DE NUESTRO ESTUDIO</span></div>
      </div>
      <figcaption><span>GUÍA DEL ESTUDIO TONY</span><p>Imagen referencial. Aquí estará el video tutorial cuando esté disponible.</p><span className="tutorial-film-status">EN PREPARACIÓN</span></figcaption>
    </figure>
    <ol className="tutorial-chapters" aria-label="Qué aprenderás en el tutorial">
      <li><span>01</span><div><h3>Prepara tu equipo</h3><p>Define la cantidad y completa nombre, talla y dorsal de cada jugador.</p></div></li>
      <li><span>02</span><div><h3>Hazlo tuyo</h3><p>Sube tus diseños y escudos, elige la técnica y quita los elementos que no necesitas.</p></div></li>
      <li><span>03</span><div><h3>Revisa cada detalle</h3><p>Ajusta los elementos del uniforme y revisa toda la información antes de compartirla.</p></div></li>
    </ol>
  </section>;
}
