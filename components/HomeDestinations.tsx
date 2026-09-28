import SectionImage from './SectionImage';
import Link from 'next/link';
import stores from '@/data/tony-stores.json';
import Icon from './Icon';
import './home-destinations.css';

const destinationPhotos = ['calidad','entregas','patrocinio','comunidad','actualidad'] as const;
const destinations=[
  {href:'/calidad',n:'01',title:'Conoce lo que llevas.',label:'CALIDAD Y ACABADOS',copy:'Técnicas, telas y detalles para decidir mejor.'},
  {href:'/entregas',n:'02',title:'De la idea a tus manos.',label:'ENTREGA A DOMICILIO',copy:'Qué preparar y cómo coordinar tu entrega.'},
  {href:'/patrocinio',n:'03',title:'Hablemos de tu proyecto.',label:'PATROCINIO',copy:'Presenta a tu equipo y prepara una propuesta.'},
  {href:'/comunidad',n:'04',title:'El juego también une.',label:'COMUNIDAD TONY',copy:'La App, la comunidad y el futuro TonyPlay.'},
  {href:'/actualidad',n:'05',title:'Siempre en movimiento.',label:'ACTUALIDAD Y GUÍAS',copy:'Información útil y acceso a los canales oficiales.'},
];
export default function HomeDestinations(){return <section className="home-destinations section-wrap" aria-labelledby="destinations-title"><header className="destinations-heading"><div><p className="eyebrow"><span className="section-index">04</span> TODO LO QUE RODEA A TU EQUIPO.</p><h2 id="destinations-title">MÁS QUE UNA PRENDA.<br/><em>TODO UN MUNDO.</em></h2></div><p>Diseño, atención y los próximos pasos.<br/>Cada parte de Tony, en su lugar.</p></header><div className="destinations-grid"><Link href="/tiendas" className="destination-territory"><div className="territory-top"><span>ENCUÉNTRANOS</span><span>SV / TONY</span></div><div className="territory-number" aria-hidden="true">{stores.length}<span>EN EL DIRECTORIO.</span></div><SectionImage photo="tiendas" shade="left" /><div className="territory-bottom"><p>TUS COLORES.<br/>MÁS CERCA.</p><span>Encuentra dirección, teléfono<br/>y cómo llegar a tu tienda.</span><i><Icon name="diagonal"/></i></div><span className="sr-only">Ver las {stores.length} ubicaciones del directorio Tony</span></Link><div className="destinations-list">{destinations.map((item,index)=><Link href={item.href} key={item.href} className="destination-entry"><span className="destination-photo"><SectionImage photo={destinationPhotos[index]} shade="none" sizes="80px" /></span><span className="destination-index">{item.n}</span><div><span className="destination-kicker">{item.label}</span><h3>{item.title}</h3><p>{item.copy}</p></div><i><Icon name="diagonal"/></i></Link>)}</div></div></section>}
