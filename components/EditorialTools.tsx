'use client';

import { useRef, useState, type FormEvent } from 'react';

const contact = (message: string, number = '50370155571') => `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
const techniques = [
  {name:'Full sublimado',tag:'DISEÑO INTEGRAL',title:'La prenda como lienzo.',description:'Una propuesta de color y gráficos pensada para el conjunto de la camisa. En el editor puedes componer el frente y la espalda y sumar la identidad de cada jugador.',use:'Para proyectos que buscan integrar fondo, escudo, patrocinadores y personalización en un mismo diseño.',confirm:'Confirma con Tony la tela, el molde y la reproducción de colores antes de aprobar el arte.',className:'full'},
  {name:'Sublimado parcial',tag:'ZONAS DEFINIDAS',title:'El detalle donde lo quieres.',description:'Organiza la personalización en zonas específicas de la prenda. Una referencia clara ayuda a señalar qué partes deben llevar diseño y cuáles conservarán la base.',use:'Para propuestas que combinan áreas de color base y zonas personalizadas.',confirm:'Consulta qué zonas y materiales permiten la aplicación que necesitas.',className:'partial'},
  {name:'Estampado',tag:'GRÁFICOS CON INTENCIÓN',title:'Tu mensaje, en su lugar.',description:'Plantea escudos, marcas o textos sobre una base. Envía cada gráfico por separado y señala el tamaño y la ubicación que esperas.',use:'Para concentrar la identidad en gráficos y mensajes concretos.',confirm:'El acabado y su compatibilidad se eligen según la tela, los colores y el uso de la prenda.',className:'print'},
  {name:'Bordado',tag:'IDENTIDAD EN HILO',title:'Un relieve que se reconoce.',description:'Una alternativa para escudos, iniciales y detalles de identidad. La propuesta debe revisarse para adaptarla al tamaño y a la lectura del bordado.',use:'Para identidades que se pueden resolver en hilo con una lectura clara.',confirm:'Consulta tamaño, detalle, colores de hilo y compatibilidad con la prenda.',className:'embroidery'},
];
export function TechniqueGuide() {
  const [selected,setSelected] = useState(0); const technique = techniques[selected];
  return <div className="te-technique-guide"><div className="te-technique-selector" role="group" aria-label="Explorar técnicas de personalización">{techniques.map((item,index) => <button type="button" key={item.name} aria-pressed={selected === index} onClick={() => setSelected(index)}><span>0{index + 1}</span>{item.name}<i aria-hidden="true">{selected === index ? '✓' : '+'}</i></button>)}</div><div className="te-technique-content"><div className={`te-technique-swatch ${technique.className}`} aria-hidden="true"><div className="te-swatch-shirt"><b>TS</b><i /></div><span>MUESTRA GRÁFICA · TÉCNICA POR CONFIRMAR</span></div><div className="te-technique-copy" aria-live="polite"><p className="te-eyebrow">{technique.tag}</p><h3>{technique.title}</h3><p>{technique.description}</p><dl><div><dt>Cuándo considerarla</dt><dd>{technique.use}</dd></div><div><dt>Antes de producir</dt><dd>{technique.confirm}</dd></div></dl></div></div></div>;
}

export type TonyStore = { name: string; address: string; phone: string; mapUrl?: string; zone?: string };
export function StoreDirectory({ stores }: { stores: TonyStore[] }) {
  const [query,setQuery] = useState(''); const [zone,setZone] = useState('Todas');
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const zones = ['Todas', ...Array.from(new Set(stores.map(store => store.zone).filter(Boolean))) as string[]];
  const visible = stores.filter(store => (zone === 'Todas' || store.zone === zone) && normalize(`${store.name} ${store.address}`).includes(normalize(query.trim())));
  return <div className="te-directory"><div className="te-store-tools"><label htmlFor="te-store-search">Encuentra tu tienda<input id="te-store-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Busca por ciudad o dirección" /></label><div className="te-zone-filters" role="group" aria-label="Filtrar tiendas por zona">{zones.map(item => <button type="button" key={item} aria-pressed={zone === item} onClick={() => setZone(item)}>{item}</button>)}</div></div><p className="te-result-count" role="status">{visible.length} {visible.length === 1 ? 'tienda encontrada' : 'tiendas encontradas'}</p><div className="te-store-list">{visible.map((store,index) => <article className="te-store" key={store.name}><div className="te-store-top"><span>{String(index + 1).padStart(2,'0')}</span><span>{store.zone || 'EL SALVADOR'}</span></div><h3>{store.name}</h3><p>{store.address}</p><a className="te-store-phone" href={`tel:+503${store.phone.replace(/\D/g,'').slice(-8)}`}>{store.phone} <span aria-hidden="true">↗</span></a><div className="te-store-actions">{store.mapUrl && <a href={store.mapUrl} target="_blank" rel="noopener noreferrer">Ver ubicación <span aria-hidden="true">↗</span></a>}<a href={contact(`Hola, Tony. Quiero consultar atención, disponibilidad y horario de la tienda ${store.name}.`,`503${store.phone.replace(/\D/g,'').slice(-8)}`)} target="_blank" rel="noopener noreferrer">Consultar por WhatsApp <span aria-hidden="true">↗</span></a></div></article>)}</div>{visible.length === 0 && <div className="te-search-empty"><h3>Prueba con otra ciudad.</h3><p>También puedes ver el directorio completo y consultar al equipo de Tony.</p><button type="button" onClick={() => { setQuery(''); setZone('Todas'); }}>Mostrar todas las tiendas</button></div>}</div>;
}
export function DeliveryBranchContact({ stores }: { stores: TonyStore[] }) {
  const [zone, setZone] = useState('Todas');
  const [storeName, setStoreName] = useState('');
  const [destination, setDestination] = useState('');
  const [error, setError] = useState('');
  const [prepared, setPrepared] = useState(false);
  const storeSelect = useRef<HTMLSelectElement>(null);
  const resultTitle = useRef<HTMLHeadingElement>(null);
  const selected = stores.find(store => store.name === storeName);
  const zones = Array.from(new Set(stores.map(store => store.zone).filter(Boolean))) as string[];
  const visible = stores.filter(store => zone === 'Todas' || store.zone === zone);

  function prepare(event: FormEvent) {
    event.preventDefault();
    if (!selected) {
      setError('Elige la sucursal con la que quieres coordinar tu entrega.');
      storeSelect.current?.focus();
      return;
    }
    setError('');
    setPrepared(true);
    requestAnimationFrame(() => resultTitle.current?.focus());
  }
  const message = selected ? `Hola, equipo Tony de ${selected.name}. Quiero consultar una entrega a domicilio.\nSucursal elegida: ${selected.name}.\n${destination.trim() ? `Municipio o zona de entrega: ${destination.trim()}.\n` : ''}Me gustaría confirmar cobertura, costo y coordinación de mi pedido con ustedes.` : '';

  return <div className="te-delivery-contact">
    <form onSubmit={prepare} noValidate>
      <p className="te-delivery-contact-intro">Elige la sucursal que te queda más cerca. Tu consulta se dirigirá a su propio número.</p>
      <label htmlFor="te-delivery-zone">Zona de tu sucursal
        <select id="te-delivery-zone" value={zone} onChange={event => { setZone(event.target.value); setStoreName(''); setPrepared(false); setError(''); }}>
          <option value="Todas">Todas las zonas</option>{zones.map(item => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label htmlFor="te-delivery-store">Sucursal más cercana
        <select ref={storeSelect} id="te-delivery-store" value={storeName} aria-invalid={Boolean(error)} aria-describedby={error ? 'te-delivery-error' : 'te-delivery-store-note'} onChange={event => { setStoreName(event.target.value); setPrepared(false); setError(''); }}>
          <option value="">Selecciona una sucursal</option>{visible.map(store => <option key={store.name} value={store.name}>{store.name} · {store.zone}</option>)}
        </select>
      </label>
      {error && <p className="te-inline-feedback te-feedback-error" id="te-delivery-error" role="alert"><span aria-hidden="true">!</span>{error}</p>}
      <p className="te-field-note" id="te-delivery-store-note">{selected ? `${selected.address} Tel. ${selected.phone}.` : 'Sin sucursal seleccionada. Tú eliges con quién consultar.'}</p>
      <label htmlFor="te-delivery-destination">Municipio o zona de entrega <span>(opcional)</span>
        <input id="te-delivery-destination" value={destination} maxLength={120} autoComplete="address-level2" placeholder="Ej. Santa Tecla" onChange={event => { setDestination(event.target.value); setPrepared(false); }} />
      </label>
      {!prepared && <button className="te-button" type="submit">Preparar consulta <span aria-hidden="true">→</span></button>}
    </form>
    {prepared && selected && <div className="te-delivery-ready">
      <p className="te-inline-feedback te-feedback-success" role="status"><span aria-hidden="true">✓</span>Consulta preparada para la sucursal elegida.</p>
      <h4 ref={resultTitle} tabIndex={-1}>Tony {selected.name}</h4>
      <p className="te-delivery-destination">{selected.phone}{destination.trim() && <> · Entrega en {destination.trim()}</>}</p>
      <a className="te-button" href={contact(message, `503${selected.phone.replace(/\D/g, '').slice(-8)}`)} target="_blank" rel="noopener noreferrer">Consultar entrega en WhatsApp <span aria-hidden="true">↗</span></a>
      <p className="te-field-note">Se abrirá el mensaje para que lo revises y lo envíes. La sucursal confirmará las condiciones de entrega.</p>
    </div>}
  </div>;
}

type Proposal = { club: string; sport: string; location: string; category: string; players: string; contact: string; idea: string };
type ProposalKey = keyof Proposal;
type ProposalErrors = Partial<Record<ProposalKey, string>>;
const initial: Proposal = {club:'',sport:'Fútbol',location:'',category:'',players:'',contact:'',idea:''};
const labels: Record<ProposalKey,string> = {club:'Nombre del equipo u organización',sport:'Deporte',location:'Ciudad o municipio',category:'Categoría',players:'Cantidad de integrantes',contact:'Tu teléfono o correo',idea:'Cuéntanos tu propuesta'};
const proposalKeys = Object.keys(labels) as ProposalKey[];
function proposalText(value: Proposal) { return `PROPUESTA PARA TONY SPORTSWEAR\n\n${proposalKeys.map(key => `${labels[key]}: ${value[key].trim()}`).join('\n')}\n\nMe gustaría conversar sobre esta propuesta y conocer si podemos colaborar.`; }
function validateProposalField(key: ProposalKey, raw: string): string | undefined {
  const text = raw.trim();
  if (!text) return 'Completa este dato para preparar tu propuesta.';
  if (key === 'players' && (!/^\d{1,3}$/.test(text) || Number(text) < 1)) return 'Indica una cantidad de 1 a 999 integrantes.';
  if (key === 'contact') {
    const email = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/.test(text);
    const digits = text.replace(/\D/g, '');
    const phone = /^\+?[\d\s().-]+$/.test(text) && digits.length >= 8 && digits.length <= 15 && !/^(\d)\1+$/.test(digits);
    if (!email && !phone) return 'Escribe un teléfono de 8 a 15 dígitos o un correo como nombre@ejemplo.com.';
  }
}
export function SponsorshipProposal() {
  const [value, setValue] = useState<Proposal>(initial);
  const [errors, setErrors] = useState<ProposalErrors>({});
  const [touched, setTouched] = useState<ProposalKey[]>([]);
  const [review, setReview] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'busy' | 'success' | 'error'>('idle');
  const reviewTitle = useRef<HTMLHeadingElement>(null);

  function update(key: ProposalKey, text: string) {
    setValue(current => ({...current, [key]: text}));
    setErrors(current => ({...current, [key]: undefined}));
    setCopyState('idle');
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const next: ProposalErrors = {};
    for (const key of proposalKeys) {
      const message = validateProposalField(key, value[key]);
      if (message) next[key] = message;
    }
    setErrors(next);
    setTouched(proposalKeys);
    setSubmitted(true);
    const first = Object.keys(next)[0];
    if (first) {
      requestAnimationFrame(() => document.getElementById(`te-proposal-${first}`)?.focus());
      return;
    }
    setReview(true);
    requestAnimationFrame(() => reviewTitle.current?.focus());
  }
  async function copyProposal() {
    setCopyState('busy');
    try {
      await navigator.clipboard.writeText(proposalText(value));
      setCopyState('success');
    } catch {
      setCopyState('error');
    }
  }
  function editProposal() {
    setReview(false);
    setCopyState('idle');
    requestAnimationFrame(() => document.getElementById('te-proposal-club')?.focus());
  }
  const inputProps = (key: ProposalKey) => ({
    id: `te-proposal-${key}`,
    value: value[key],
    'aria-required': true,
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `te-proposal-error-${key}` : undefined,
    'data-valid': touched.includes(key) && !validateProposalField(key, value[key]) ? 'true' : undefined,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => update(key, event.target.value),
    onBlur: () => {
      setTouched(current => current.includes(key) ? current : [...current, key]);
      setErrors(current => ({...current, [key]: validateProposalField(key, value[key])}));
    },
  });
  const fieldError = (key: ProposalKey) => errors[key] && <span className="te-field-error" id={`te-proposal-error-${key}`}>{errors[key]}</span>;
  const errorCount = Object.values(errors).filter(Boolean).length;

  if (review) return <div className="te-proposal-review">
    <p className="te-inline-feedback te-feedback-success" role="status"><span aria-hidden="true">✓</span>Tu propuesta está preparada.</p>
    <h3 ref={reviewTitle} tabIndex={-1}>Revísala. Después, conversemos.</h3>
    <p>Todavía no se ha enviado. Elige el canal y confirma el mensaje allí.</p>
    <dl>{proposalKeys.map(key => <div key={key}><dt>{labels[key]}</dt><dd>{value[key]}</dd></div>)}</dl>
    <div className="te-proposal-actions">
      <a className="te-button" href={contact(proposalText(value))} target="_blank" rel="noopener noreferrer">Abrir propuesta en WhatsApp <span aria-hidden="true">↗</span></a>
      <a className="te-button te-button-outline" href={`mailto:info@tonysportselsalvador.com?subject=${encodeURIComponent(`Propuesta: ${value.club}`)}&body=${encodeURIComponent(proposalText(value))}`}>Preparar correo <span aria-hidden="true">↗</span></a>
    </div>
    <div className="te-proposal-secondary">
      <button type="button" onClick={editProposal}>Volver a editar</button>
      <button type="button" onClick={copyProposal} disabled={copyState === 'busy'} aria-busy={copyState === 'busy'}>{copyState === 'busy' ? 'Copiando…' : copyState === 'success' ? 'Copiada ✓' : 'Copiar propuesta'}</button>
    </div>
    <p className={`te-copy-status${copyState === 'error' ? ' te-feedback-error' : ''}`} role="status">{copyState === 'success' ? 'Propuesta copiada. Ya puedes pegarla donde necesites.' : copyState === 'error' ? 'No se pudo copiar. Inténtalo de nuevo o prepárala en WhatsApp o correo.' : ''}</p>
    <p className="te-form-note">Compartir una propuesta no confirma patrocinio, aportes ni condiciones. El equipo de Tony debe revisarla contigo.</p>
  </div>;
  return <form className="te-proposal-form" onSubmit={submit} noValidate>
    <div className="te-form-heading"><span className="te-eyebrow">PRESENTA TU EQUIPO</span><h3>Empecemos por conocernos.</h3><p>Completa los datos y revisa tu propuesta antes de compartirla.</p></div>
    {submitted && errorCount > 0 && <p className="te-inline-feedback te-feedback-error" role="alert"><span aria-hidden="true">!</span>Revisa {errorCount === 1 ? 'el dato marcado' : `los ${errorCount} datos marcados`} para continuar.</p>}
    <div className="te-form-grid">
      <label className="te-form-wide">{labels.club}<input {...inputProps('club')} maxLength={80} autoComplete="organization" placeholder="Club, academia u organización" />{fieldError('club')}</label>
      <label>{labels.sport}<select {...inputProps('sport')}>{['Fútbol','Básquetbol','Voleibol','Atletismo','Running','Ciclismo','Otro deporte'].map(sport => <option key={sport}>{sport}</option>)}</select></label>
      <label>{labels.location}<input {...inputProps('location')} maxLength={100} autoComplete="address-level2" placeholder="¿Dónde juega tu equipo?" />{fieldError('location')}</label>
      <label>{labels.category}<select {...inputProps('category')}><option value="">Seleccionar categoría</option>{['Infantil','Juvenil','Adulto','Mixta','Por definir'].map(category => <option key={category}>{category}</option>)}</select>{fieldError('category')}</label>
      <label>{labels.players}<input {...inputProps('players')} type="text" inputMode="numeric" maxLength={3} placeholder="Ej. 18" />{fieldError('players')}</label>
      <label className="te-form-wide">{labels.contact}<input {...inputProps('contact')} maxLength={120} placeholder="Teléfono o correo de la persona responsable" />{fieldError('contact')}</label>
      <label className="te-form-wide">{labels.idea}<textarea {...inputProps('idea')} rows={5} maxLength={1000} placeholder="Qué hacen, qué necesitan y qué les gustaría construir junto a Tony." />{fieldError('idea')}<small>{value.idea.length}/1000</small></label>
    </div>
    <button type="submit" className="te-button">Revisar mi propuesta <span aria-hidden="true">→</span></button>
    <p className="te-form-note">Estos datos permanecen en esta página hasta que decidas compartirlos. Este formulario no envía mensajes automáticamente.</p>
  </form>;
}
