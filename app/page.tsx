import Image from 'next/image';
import Link from 'next/link';
import {Hero} from '@/components/HomeExperience';
import TutorialPreview from '@/components/TutorialPreview';
import {LagartoMark} from '@/components/LagartoIntro';
import Icon from '@/components/Icon';
import HomeDestinations from '@/components/HomeDestinations';
import HomeClientHub from '@/components/HomeClientHub';
import SocialCommunity from '@/components/SocialCommunity';
import RevealText from '@/components/RevealText';
import {siteAsset} from '@/lib/asset-path';

const questions=[
  ['¿Puedo crear el uniforme de mi equipo?','Sí. Primero elige la cantidad. Luego agrega el nombre, la talla y el dorsal de cada jugador, personaliza el diseño y revisa la solicitud completa antes de compartirla con Tony.'],
  ['¿Qué es una camisa full sublimada?','Es una camisa cuyo diseño se imprime en la tela mediante sublimación. Permite integrar colores, gráficos, nombres y números en la misma prenda. Consulta con Tony los acabados y las telas disponibles.'],
  ['¿La imagen del configurador es el diseño final?','Es una vista ilustrativa para ayudarte a comunicar tu idea. Tony debe confirmar el diseño final, los colores, las tallas y las condiciones antes de iniciar la producción.'],
  ['¿Cómo consulto precios y tiempos de entrega?','Escríbenos por WhatsApp al 7015-5571 con la cantidad de prendas y los detalles de tu equipo. Tony te confirmará la cotización y el tiempo de producción.'],
  ['¿Dónde puedo ver el catálogo?','Estamos preparando un nuevo catálogo. Mientras está listo, puedes crear una propuesta de uniforme o consultar directamente con Tony por WhatsApp.'],
];

export default function Home(){
  return (
    <main id="contenido" className="home-page">
      <Hero/>
      <section className="origin-section section-wrap" id="como-funciona">
        <div className="section-heading"><p className="eyebrow"><span className="section-index">01</span> DE TU IDEA A LA CANCHA</p><span className="editorial-note">LA DIFERENCIA<br/>SE LLEVA PUESTA.</span></div>
        <div className="origin-grid">
          <div className="origin-image"><Image src={siteAsset('/assets/detail-campaign-v2.png')} alt="Boceto de detalle textil: camiseta Tony con textura de escamas y cuello verde" fill sizes="(max-width:760px) 100vw, 45vw" quality={85}/><div className="image-tag"><span>EL CARÁCTER ESTÁ<br/>EN LOS DETALLES.</span></div><span className="image-disclaimer">BOCETO VISUAL · NO REPRESENTA UNA TELA DEL CATÁLOGO</span></div>
          <div className="origin-copy"><RevealText>UN MISMO<br/>EQUIPO.<br/><em>UNA SOLA GARRA.</em></RevealText><p>Tu uniforme es la primera forma de decir quién eres. Hagamos que cada color, cada nombre y cada detalle cuenten tu historia.</p><ol className="process-list">{[{n:'01',title:'Define tu equipo',body:'Elige la cantidad de uniformes que necesitas.'},{n:'02',title:'Cada jugador cuenta',body:'Un nombre, una talla y un dorsal por persona.'},{n:'03',title:'Diseña y revisa',body:'Tu estilo, tus referencias y una solicitud completa.'}].map(s=><li className="process-step" key={s.n}><span aria-hidden="true">{s.n}</span><div><h3>{s.title}</h3><p>{s.body}</p></div></li>)}</ol><Link className="text-link" href="/configurador">Empezar mi diseño <Icon/></Link></div>
        </div>
      </section>
      <TutorialPreview/>
      <HomeClientHub/>
      <HomeDestinations/>
      <section className="tribe-section" aria-labelledby="tribe-title">
        <div className="tribe-orbit" aria-hidden="true"/><div className="tribe-slashes" aria-hidden="true"><i/><i/><i/></div>
        <div className="tribe-inner section-wrap"><div className="tribe-copy"><p className="eyebrow"><span className="section-index">05</span> NO SE EXPLICA. SE LLEVA DENTRO.</p><RevealText id="tribe-title">SANGRE FRÍA.<br/><em>ALMA DE<br/>COMPETIDOR.</em></RevealText><p>Para los que vuelven a intentarlo.<br/>Para los que juegan por algo más.<br/><strong>Para los que llevan a su equipo en la piel.</strong></p><Link href="/nosotros" className="button primary">Este es nuestro ADN <span className="button-icon"><Icon name="diagonal"/></span></Link></div><div className="tribe-mascot"><span className="tribe-word" aria-hidden="true">TONY</span><LagartoMark blink/><span className="mascot-caption">LA GARRA QUE NOS UNE.</span></div></div>
      </section>
      <section className="catalog-teaser section-wrap"><div><p className="eyebrow"><span className="section-index">06</span> CATÁLOGO OFICIAL</p><h2>ELIGE UN DISEÑO.<br/><em>HAZLO TUYO.</em></h2></div><div><span className="availability-tag"><span className="status-dot"/> 70 DISEÑOS DISPONIBLES</span><p>Explora el catálogo Tony y usa cualquier diseño como base del uniforme de tu equipo.</p><Link href="/catalogo" className="text-link">Ver el catálogo <Icon name="diagonal"/></Link></div></section>
      <SocialCommunity index="07"/>
      <section className="faq-section section-wrap" id="preguntas"><div><p className="eyebrow"><span className="section-index">08</span> JUGAMOS CLARO</p><RevealText>TODO EMPIEZA<br/><em>CON UNA IDEA.</em></RevealText><p>Las preguntas se resuelven.<br/>Las ganas de jugar, se llevan puestas.</p><a href="https://wa.me/50370155571" target="_blank" rel="noopener noreferrer" className="text-link">Habla con Tony <Icon name="diagonal"/></a></div><div className="faq-list">{questions.map(([q,a],i)=><details key={q}><summary><span className="faq-index">0{i+1}</span><span>{q}</span><Icon name="plus"/></summary><p>{a}</p></details>)}</div></section>
    </main>
  );
}


