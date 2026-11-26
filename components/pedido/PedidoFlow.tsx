'use client';
import {accountStorageKey} from '@/lib/auth';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {GuidePhoto, OptionThumbnail, OrderBanner, OrderImageHints} from './PedidoImages';
import {createPedido, readPedido, resizePlayers, validateStep} from '@/lib/pedido/order';
import {calculatePedido, isCatalogCode, money, PRICES, PRODUCTS} from '@/lib/pedido/pricing';
import {aiImage, apiConfigured, createPayment, quotePedido, submitPedido, verifyPayment, type Receipt} from '@/lib/pedido/api';
import {clearDraft, loadDraft, rememberReceipt, saveDraft, savePedidoCart} from '@/lib/pedido/storage';
import type {Buyer, Delivery, Payment, PedidoDraft, PedidoErrors, PedidoStep} from '@/lib/pedido/types';
import checkout from '@/data/pedido/checkout.json';
import guides from '@/data/pedido/guides.json';
import {Choice, Field, Modal, PlayerRow, PriceLines, SockPicker} from './PedidoUI';
import {CONFIG_SCREENS, STEPS, wizardProgress} from './wizard-progress';
import CheckoutSteps from './CheckoutSteps';
import PedidoAdvisor from './PedidoAdvisor';
import {adviseFor, missingBefore} from '@/lib/pedido/advisor';
import './pedido.css';
import './wizard-flow.css';
import {announceCartSave} from '@/lib/cart-feedback';

const DesignEditor = dynamic(() => import('./DesignEditor'), {ssr: false, loading: () => <p role="status">Preparando tu estudio de diseño…</p>});
const VALIDATIONS: (PedidoStep | null)[] = [null, 'product', 'gender', 'config', 'players', 'socks', 'design', 'approval', 'summary', 'delivery', 'payment', 'signature', null];
const HEADINGS = ['Crea tus uniformes o camisas', 'Escoge tu producto', '¿Para quién es?', 'Hecho a tu manera', 'Cada jugador cuenta', 'Completa tu equipo', 'Tu idea. Tu diseño.', 'El último detalle', 'Revisa tu pedido', '¿Dónde lo recibes?', 'Confirma tu anticipo', 'Tu pedido, con tu firma', 'Tu pedido ya está aquí'];
/** Photos of every option: the V279 guides, plus Tony models for the sleeves. */
const OPTION_IMAGES: Record<string, string> = {
  'Estándar': 'mold-standard', 'Raglan': 'mold-raglan', 'Primera División': 'mold-first-division',
  'Slim Fit': 'fabric-slim-fit', 'Slim Pro': 'fabric-slim-pro', 'Modern Carving': 'fabric-modern-carving', 'Dryfit': 'fabric-dry-fit', 'Premier': 'fabric-premier', 'Drycool': 'fabric-drycool',
  'V': 'collar-v', 'Redondo': 'collar-round', 'Chino': 'collar-chinese', 'Polo': 'collar-polo',
  'Corta': 'manga-corta', 'Larga': 'manga-larga',
};
const EMPTY_DELIVERY: Delivery = {kind: '', branch: '', department: '', city: '', address: '', reference: '', latitude: null, longitude: null};
const errorText = (error: unknown) => error instanceof Error ? error.message : 'No pudimos completar la acción. Vuelve a intentarlo.';
const PENDING_PAYMENT = 'tony:pedido:pending-payment:v279';
const PAYMENT_KEY = 'tony:pedido:payment-key:v279';

export default function PedidoFlow() {
  const [draft, setDraft] = useState<PedidoDraft>(createPedido), [step, setStep] = useState(0);
  const [ready, setReady] = useState(false), [canSave, setCanSave] = useState(true), [storage, setStorage] = useState(''), [notice, setNotice] = useState(''), [failure, setFailure] = useState(''), [errors, setErrors] = useState<PedidoErrors>({});
  const [busy, setBusy] = useState(''), [guide, setGuide] = useState(''), [reduceTo, setReduceTo] = useState<number | null>(null), [reset, setReset] = useState(false);
  const [delivery, setDelivery] = useState<Delivery>(EMPTY_DELIVERY), [payment, setPayment] = useState<Payment>({method: '', bank: ''}), [buyer, setBuyer] = useState<Buyer>({name: '', dui: '', phone: '', email: ''});
  const [signature, setSignature] = useState(''), [terms, setTerms] = useState(false), [verified, setVerified] = useState(false), [receipt, setReceipt] = useState<Receipt | null>(null), [paymentUrl, setPaymentUrl] = useState('');
  const [quantityText, setQuantityText] = useState('');
  const [configStep, setConfigStep] = useState(0);
  const [rosterStep, setRosterStep] = useState(0);
  // Which way the last navigation went: the screen and its title slide in from that side.
  const [direction, setDirection] = useState<1 | -1>(1);
  const screenKey = `${step}:${configStep}:${rosterStep}`;
  const previousScreen = useRef(screenKey);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [cartState, setCartState] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const cartSaving = useRef(false);
  const latestDraft = useRef(draft); latestDraft.current = draft;
  // A new order starts with nothing marked; a recovered draft keeps what the customer already chose.
  const picked = draft.choices ?? {product: true, brand: true, brand3d: true, crest3d: true};
  const finishPicked = picked;
  const title = useRef<HTMLHeadingElement>(null), errorBox = useRef<HTMLDivElement>(null), submitting = useRef(false), paymentKey = useRef(''), submitKey = useRef('');
  const confirmedSnapshot = useRef<{draft: PedidoDraft; buyer: Buyer; delivery: Delivery; signature: string} | null>(null);
  const pricing = calculatePedido(draft, delivery.kind);
  const configScreen = CONFIG_SCREENS[configStep];
  const configKey = configScreen.key;
  const configChosen = configKey === 'brand' ? picked.brand : configKey === 'brand3d' || configKey === 'crest3d' ? finishPicked[configKey] : !!draft.config[configKey];
  const rosterNotesStep = draft.quantity + 2 + (draft.product === 'uniform' ? 1 : 0);
  // A single count across every screen: "Paso N de T" moves on each Continuar and Anterior.
  const progress = wizardProgress({step, configStep, rosterStep, quantity: draft.quantity, uniform: draft.product === 'uniform'});
  const rosterPlayerIndex = rosterStep - 2;
  const rosterPlayer = draft.players[rosterPlayerIndex];
  const rosterHeading = rosterStep === 0 ? 'El nombre de tu equipo' : rosterStep === 1 ? '¿Cuántas prendas necesitas?' : rosterStep < draft.quantity + 2 ? `Jugador ${rosterPlayerIndex + 1} de ${draft.quantity}` : rosterStep === rosterNotesStep ? 'Indicaciones adicionales' : 'Agrega tus porteros';
  const rosterText = rosterStep === 0 ? 'Escribe el nombre de tu equipo.' : rosterStep === 1 ? 'Indica cuántas prendas de campo necesitas. El mínimo es seis.' : rosterStep < draft.quantity + 2 ? `Completa el nombre, la talla y el dorsal del jugador ${rosterPlayerIndex + 1}.` : rosterStep === rosterNotesStep ? 'Puedes dejar una indicación para Tony o continuar sin añadir nada.' : 'Añade los porteros que necesites. Si tu equipo no lleva portero, toca Continuar.';
  const advice = step === 4 ? {key: `roster-screen:${rosterStep}`, text: rosterText, target: rosterStep === 0 ? 'team' : rosterStep === 1 ? 'quantity' : rosterStep < draft.quantity + 2 ? 'players' : 'keepers'} : step === 3 ? {key: `config-screen:${configKey}:${configChosen}:${draft.config[configKey]}`, target: configKey, text: configChosen ? `${configScreen.label}: ${typeof draft.config[configKey] === 'boolean' ? (draft.config[configKey] ? 'relieve 3D' : 'sublimado') : draft.config[configKey]}. Toca Continuar cuando estés listo.` : configScreen.hint} : adviseFor({step, draft, delivery, payment, buyer, signature, terms, verified, hasReceipt: !!receipt, picked});
  // One thing at a time: a later choice made too early is not applied and the advisor says what comes first.
  const [warning, setWarning] = useState<{step: number; advice: string; text: string; target: string; at: number} | null>(null);
  const warn = (text: string, target: string) => setWarning({step, advice: advice.key, text, target, at: Date.now()});
  const cue = warning && warning.step === step && warning.advice === advice.key ? {key: `${step}:warn:${warning.at}`, text: warning.text, target: warning.target, warning: true} : advice;
  useEffect(() => {
    let live = true;
    (async () => {
      const query = new URLSearchParams(window.location.search);
      try {
        const saved = await loadDraft(query.get('pedido') || undefined);
        if (!live) return;
        const resume = !!query.get('pedido') || query.get('borrador') === 'actual';
        if (saved && !resume) setHasSavedDraft(true);
        // A design chosen on /catalogo arrives as ?diseno=TONY-012.
        const wanted = (query.get('diseno') || '').toUpperCase();
        if (isCatalogCode(wanted) && !query.get('wompi_order')) {
          const file = wanted.toLowerCase(), base = resume && saved ? saved : createPedido();
          setDraft({...base, design: {...base.design, source: 'catalog', catalogCode: wanted, front: `/assets/pedido/catalog/${file}-front.webp`, back: `/assets/pedido/catalog/${file}-back.webp`, approved: false, finalFront: null, finalBack: null}});
          setNotice(`Elegiste ${wanted} del catálogo Tony. Lo encontrarás cargado en el paso Diseño.`);
          history.replaceState(null, '', window.location.pathname);
        } else if (resume && saved) {setDraft(saved); setNotice('Recuperamos tu diseño. Revisa los pasos para continuar.');}
      } catch (e) {if (live) {setStorage(errorText(e)); setCanSave(false);}}
      if (!live) return;
      try {
        let storedRef = ''; try {storedRef = sessionStorage.getItem(accountStorageKey(PENDING_PAYMENT)) || ''; paymentKey.current = sessionStorage.getItem(accountStorageKey(PAYMENT_KEY)) || '';} catch { /* The read-only draft can still be used without session storage. */ }
        const paymentRef = query.get('wompi_order') || storedRef;
        if (paymentRef) {
          setBusy('Verificando el anticipo…');
          try {const result = await verifyPayment(paymentRef); if (!live) return; const order = readPedido(result.snapshot?.order); if (order && result.snapshot) {setDraft(order); setDelivery(result.snapshot.delivery); setPayment({method: 'wompi', bank: '', reference: paymentRef}); setPaymentUrl(result.url || ''); setVerified(result.paid); setStep(result.paid ? 11 : 10); setNotice(result.paid ? 'Anticipo verificado. Completa tus datos y firma.' : 'Tu pago aún no está confirmado. Puedes abrir el mismo enlace o consultar de nuevo.');} else throw new Error('No pudimos recuperar el pedido asociado a este pago. Contacta a Tony con tu referencia.');} catch (e) {setFailure(errorText(e));} finally {setBusy('');}
          history.replaceState(null, '', window.location.pathname);
        }
      } catch (e) {if (live) {setStorage(errorText(e)); setCanSave(false);}} finally {if (live) setReady(true);}
    })();
    return () => {live = false;};
  }, []);
  useEffect(() => {setQuantityText(draft.choices?.quantity === false ? '' : String(draft.quantity));}, [draft.id]);
  useEffect(() => {if (!ready || !canSave || receipt || !picked.product) return; const timer = setTimeout(() => {void saveDraft(draft).then(() => setStorage('Borrador guardado en este navegador.')).catch(e => setStorage(errorText(e)));}, 650); return () => clearTimeout(timer);}, [draft, ready, canSave, receipt, picked.product]);
  useLayoutEffect(() => {
    if (!ready || previousScreen.current === screenKey) return;
    previousScreen.current = screenKey;
    // Position the new screen after its layout changes, before it is painted.
    title.current?.focus({preventScroll: true});
    title.current?.scrollIntoView({block: 'start', behavior: 'instant'});
  }, [ready, screenKey]);
  const context = {delivery, payment, buyer, signature, termsAccepted: terms, wompiVerified: verified};
  function update(next: PedidoDraft) {if (verified || receipt || payment.reference) return; setCartState('idle'); setDraft(next); setErrors({}); setFailure(''); setPaymentUrl(''); setSignature(''); setTerms(false);}
  async function saveToCart(animate: boolean) {
    if (cartSaving.current) return;
    cartSaving.current = true; setCartState('saving');
    try {
      await savePedidoCart(draft); setCartState(latestDraft.current === draft ? 'saved' : 'idle');
      announceCartSave({message: `${draft.teamName || 'Tu diseño'} está listo para retomarlo cuando quieras.`, animate});
    } catch (error) {setCartState('error'); announceCartSave({message: errorText(error), error: true, animate});}
    finally {cartSaving.current = false;}
  }
  const saveButton = (className = '') => <button className={`button outline ${className}`} type="button" disabled={!!busy || cartState === 'saving'} onClick={event => void saveToCart(event.detail !== 0)}>{cartState === 'saving' ? 'Guardando…' : cartState === 'saved' ? 'Guardado en mi carrito ✓' : cartState === 'error' ? 'Reintentar guardar +' : 'Guardar en mi carrito +'}</button>;
  function move(next: number) {setDirection(next < step ? -1 : 1); if (next === 4) setRosterStep(next < step ? rosterNotesStep : 0); if (next === 3) setConfigStep(next < step ? CONFIG_SCREENS.length - 1 : 0); setStep(next); setErrors({}); setFailure('');}
  function validate() {const key = VALIDATIONS[step]; const found = key ? validateStep(draft, key, context) : {}; setErrors(found); if (Object.keys(found).length) {setTimeout(() => errorBox.current?.focus(), 0); return false;} return true;}
  async function run(label: string, action: () => Promise<void>) {if (submitting.current) return; submitting.current = true; setBusy(label); setFailure(''); setNotice(''); try {await action();} catch (e) {setFailure(errorText(e));} finally {setBusy(''); submitting.current = false;}}
  function changeConfigScreen(next: number) {setConfigStep(next); setErrors({}); setFailure('');}
  function changeRosterScreen(next: number) {setRosterStep(next); setErrors({}); setFailure('');}
  function back() {setDirection(-1); if (step === 3 && configStep > 0) changeConfigScreen(configStep - 1); else if (step === 4 && rosterStep > 0) changeRosterScreen(rosterStep - 1); else move(step - 1);}
  function next() {
    setDirection(1);
    if (step === 1 && !picked.product) {setErrors({product: 'Elige Uniformes o Camisas para continuar.'}); setTimeout(() => errorBox.current?.focus(), 0); return;}
    if (step === 3) {
      if (!configChosen) {setErrors({[configKey]: `Elige una opción de ${configScreen.label.toLowerCase()} para continuar.`}); setTimeout(() => errorBox.current?.focus(), 0); return;}
      if (configStep < CONFIG_SCREENS.length - 1) {changeConfigScreen(configStep + 1); return;}
    }
    if (step === 4) {
      let found: PedidoErrors = {};
      if (rosterStep === 0 && !draft.teamName.trim()) found = {teamName: 'Escribe el nombre del equipo.'};
      else if (rosterStep === 1 && (reduceTo !== null || !/^\d+$/.test(quantityText) || Number(quantityText) < 6 || Number(quantityText) > 99)) found = {quantity: 'El pedido es de 6 a 99 prendas de campo.'};
      else if (rosterStep >= 2 && rosterStep < draft.quantity + 2) found = Object.fromEntries(Object.entries(validateStep(draft, 'players', context)).filter(([key]) => key.startsWith(`players.${rosterPlayerIndex}.`)));
      else if (rosterStep === draft.quantity + 2 && draft.product === 'uniform') found = Object.fromEntries(Object.entries(validateStep(draft, 'players', context)).filter(([key]) => key.startsWith('goalkeepers.')));
      if (Object.keys(found).length) {setErrors(found); setTimeout(() => errorBox.current?.focus(), 0); return;}
      if (rosterStep === 1) update({...draft, choices: {...picked, quantity: true}});
      if (rosterStep < rosterNotesStep) {changeRosterScreen(rosterStep + 1); return;}
    }
    if (validate()) move(step + 1);
  }
  async function designAI(operation: 'mockup' | 'erase', payload: Record<string, unknown>) {
    if (operation === 'erase') {const region = payload.region as {x: number; y: number; width: number; height: number}; return {image: await aiImage('magic_eraser', String(payload.image), {x: region.x, y: region.y, w: region.width, h: region.height, side: payload.side})};}
    const source = String(payload.front || payload.image || '');
    const front = await aiImage('generate', source, {side: 'front', product: draft.product, gender: draft.gender, config: draft.config});
    const back = await aiImage('generate', String(payload.back || source), {side: 'back', product: draft.product, gender: draft.gender, config: draft.config});
    return {front, back};
  }
  async function prepareFinal() {await run('Preparando el acabado final…', async () => {
    const {renderPedidoDesign} = await import('./DesignEditor');
    const front = await renderPedidoDesign(draft.design, 'front'), back = await renderPedidoDesign(draft.design, 'back');
    const originals = (side: 'front' | 'back') => draft.design.layers.filter(layer => layer.side === side && layer.visible && layer.data).filter((layer, index, list) => list.findIndex(item => item.data === layer.data) === index).slice(0, 8).map(({type, name, data}) => ({type, name, data}));
    const finalFront = await aiImage('finalize', front, {side: 'front', product: draft.product, config: draft.config, assets: originals('front')});
    const finalBack = await aiImage('finalize', back, {side: 'back', product: draft.product, config: draft.config, assets: originals('back')});
    update({...draft, design: {...draft.design, finalFront, finalBack, approved: false}}); setNotice('Acabado listo. Revisa ambas caras y aprueba el diseño.');
  });}
  async function startPayment() {await run('Preparando tu pago seguro…', async () => {
    if (payment.reference) {const existing = await verifyPayment(payment.reference); setPaymentUrl(existing.url || ''); setVerified(existing.paid); setNotice(existing.paid ? 'Anticipo verificado. Ya puedes continuar.' : existing.url ? 'Recuperamos el mismo enlace de pago.' : 'Conserva tu referencia y consulta con Tony el estado de este enlace antes de volver a pagar.'); return;}
    const checked = validateStep(draft, 'delivery', context); if (Object.keys(checked).length) {setErrors(checked); throw new Error('Revisa el pedido y la entrega antes de pagar.');}
    const quote = await quotePedido(draft, delivery); if (quote.totalCents !== pricing.totalCents || quote.depositCents !== pricing.depositCents) throw new Error('El precio del servidor cambió. Revisa tu pedido con Tony antes de pagar.');
    if (!paymentKey.current) {paymentKey.current = crypto.randomUUID(); sessionStorage.setItem(accountStorageKey(PAYMENT_KEY), paymentKey.current);}
    const result = await createPayment(draft, delivery, pricing.depositCents, paymentKey.current);
    const url = new URL(result.url);
    sessionStorage.setItem(accountStorageKey(PENDING_PAYMENT), result.reference);
    setPayment({...payment, reference: result.reference}); setPaymentUrl(url.href); setNotice('Tu enlace está listo. Se abrirá en esta pestaña y Wompi te devolverá aquí para verificar tu anticipo.');
  });}
  async function checkPayment() {await run('Consultando el estado del pago…', async () => {if (!payment.reference) throw new Error('Primero prepara el enlace de pago.'); const result = await verifyPayment(payment.reference); if (result.paid && result.amountCents === pricing.depositCents) {setVerified(true); setNotice('Anticipo verificado. Ya puedes continuar.');} else {setVerified(false); throw new Error(['failed', 'rejected'].includes(result.status) ? 'El pago fue rechazado. Puedes intentar nuevamente con tu enlace o elegir transferencia.' : 'El anticipo todavía no está confirmado. Espera un momento y verifica de nuevo.');}});}
  async function uploadReceipt(file?: File) {if (!file) return; await run('Leyendo comprobante…', async () => {if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 4 * 1024 * 1024) throw new Error('Adjunta un comprobante PNG, JPG o WebP de hasta 4 MB.'); const data = await new Promise<string>((resolve, reject) => {const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('No pudimos leer el comprobante.')); reader.readAsDataURL(file);}); const image = new Image(); image.src = data; await image.decode(); setPayment({...payment, receiptName: file.name, receiptData: data}); setNotice('Comprobante adjunto. Tony verificará la transferencia.');});}
  async function submit() {if (!validate()) return; await run('Enviando tu pedido a Tony…', async () => {
    if (!submitKey.current) submitKey.current = crypto.randomUUID();
    const result = await submitPedido({order: draft, buyer, delivery, payment, signature, termsAccepted: terms}, submitKey.current);
    confirmedSnapshot.current = {draft, buyer, delivery, signature}; setReceipt(result);
    // Independent storage operations: a full localStorage must not retain an old payment intent.
    const cleanup = await Promise.allSettled([
      Promise.resolve().then(() => rememberReceipt({id: result.id, status: result.status})),
      Promise.resolve().then(() => {sessionStorage.removeItem(accountStorageKey(PENDING_PAYMENT)); sessionStorage.removeItem(accountStorageKey(PAYMENT_KEY));}),
      clearDraft(),
    ]);
    if (cleanup.some(result => result.status === 'rejected')) setStorage('Pedido enviado. Guarda tu referencia; no pudimos actualizar todos los datos de este navegador.');
    move(12);
  });}
  async function download(kind: 'production' | 'payment') {if (!receipt || !confirmedSnapshot.current) return; await run('Preparando tu documento…', async () => {const {downloadPedidoDocument} = await import('@/lib/pedido/downloads'); await downloadPedidoDocument(kind, {...confirmedSnapshot.current!, receipt, termsVersion: checkout.termsVersion});});}
  function config<K extends keyof PedidoDraft['config']>(key: K, value: PedidoDraft['config'][K]) {const missing = missingBefore(draft, key); if (missing) {warn(`Primero elige ${missing.label}.`, missing.key); return;} update({...draft, choices: {...picked, ...(['brand', 'brand3d', 'crest3d'].includes(key) ? {[key]: true} : {})}, config: {...draft.config, [key]: value}, design: {...draft.design, approved: false, finalFront: null, finalBack: null}});}
  // What "Continuar" leads to, shown as a hint beside the button.
  const nextLabel = step === 3 && configStep < CONFIG_SCREENS.length - 1 ? CONFIG_SCREENS[configStep + 1].label
    : step === 4 && rosterStep < rosterNotesStep ? (rosterStep === 0 ? 'Cantidad' : rosterStep + 1 < draft.quantity + 2 ? `Jugador ${rosterStep}` : rosterStep + 1 === draft.quantity + 2 && draft.product === 'uniform' ? 'Porteros' : 'Indicaciones')
    : STEPS[step + 1];
  const guideImages = guides.guides.filter(item => guide === 'molds' ? item.id.startsWith('mold-') : guide === 'collars' ? item.id.startsWith('collar-') : guide === 'sleeves' ? item.id.startsWith('sleeve-') : guide === 'logos' ? /^(brand|crest)-/.test(item.id) : guide === 'fabrics' ? item.id.startsWith('fabric-') : false);
  return <main id="contenido" className="pedido-page"><OrderImageHints/><div className="pedido-shell">
    <nav className="pedido-breadcrumb" aria-label="Ubicación"><Link href="/">Inicio</Link><span>/</span><span>Crea tu pedido</span></nav>
    <div className="pedido-topline"><span>TONY / HECHO PARA TU EQUIPO</span><Link href="/carrito">Mis diseños guardados ↗</Link></div>
    {progress && <div className="pedido-wizard-progress" aria-label="Progreso del pedido"><div><span className="pedido-wizard-count">PASO <b key={progress.current}>{progress.current}</b> DE {progress.total}</span><span className="sr-only"> · </span><strong>{progress.phase}{progress.screen && ` · ${progress.screen}`}</strong></div><progress value={progress.current} max={progress.total} aria-label="Progreso del pedido" aria-valuetext={`Paso ${progress.current} de ${progress.total}: ${progress.screen || progress.phase}`}/></div>}
    <div className={`pedido-layout${step === 0 || step === 12 ? ' is-wide' : ''}`}><section className="pedido-main" aria-labelledby="pedido-title" aria-busy={!!busy}>
      <header className="pedido-heading"><p className="eyebrow">{step === 0 ? 'FULL SUBLIMADO · TU IDENTIDAD' : progress ? `${String(progress.current).padStart(2, '0')} / ${progress.phase.toUpperCase()}` : STEPS[step].toUpperCase()}</p><h1 id="pedido-title" ref={title} tabIndex={-1}><span key={screenKey} className="pedido-screen-title" data-dir={direction}>{step === 3 ? configScreen.title : step === 4 ? rosterHeading : HEADINGS[step]}</span></h1>{step > 0 && step < 12 && <p>Tu equipo, cada detalle. Vamos paso a paso.</p>}</header>
      <PedidoAdvisor step={step} cue={cue} ready={ready}>
      {!ready && <p role="status">Recuperando tu espacio de trabajo…</p>}
      {Object.keys(errors).length > 0 && <div className="pedido-alert" ref={errorBox} role="alert" tabIndex={-1}><strong>Revisa estos detalles para continuar</strong><ul>{[...new Set(Object.values(errors))].map(message => <li key={message}>{message}</li>)}</ul></div>}
      {failure && <div className="pedido-alert" role="alert">{failure}</div>}{notice && <p className="pedido-notice" role="status">{notice}</p>}{busy && <p className="pedido-busy" role="status">{busy}</p>}
      <fieldset className="pedido-step-content" disabled={!ready || !!busy || cartState === 'saving'}>
      <div key={screenKey} className="pedido-screen" data-dir={direction} data-photo-step={step === 1 || step === 3 ? true : undefined}>
      {step === 0 && <div className="pedido-welcome"><div><p className="pedido-lead">Uniformes Full Sublimados<br/><em>o Camisas Full Sublimadas.</em></p><p>El diseño y los datos del equipo se guardan en este navegador. <Link href="/privacidad#datos">Consulta cómo se usan tus datos.</Link></p><button className="button primary" type="button" onClick={() => move(1)}>CREAR MI PEDIDO ↗</button><ul className="pedido-welcome-chips"><li>Pedido mínimo: 6 prendas</li><li>Anticipo del 50 %</li></ul>{hasSavedDraft && <a className="pedido-text-button" href="?borrador=actual">Retomar último borrador ↗</a>}<Link href="/configurador/archivo" className="pedido-archive-link">Abrir un borrador del editor anterior ↗</Link></div><button type="button" className="pedido-welcome-art" aria-label="Empezar la personalización" onClick={() => move(1)}
        onPointerMove={e => {const el = e.currentTarget; if (e.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.tonyEffects === 'off') return; const r = el.getBoundingClientRect(); el.style.setProperty('--rx', `${((e.clientY - r.top) / r.height - .5) * -6}deg`); el.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - .5) * 8}deg`);}}
        onPointerLeave={e => {e.currentTarget.style.removeProperty('--rx'); e.currentTarget.style.removeProperty('--ry');}}><OrderBanner id="welcome"/></button></div>}
      {step === 1 && <div className="pedido-product-options" data-advisor="product">{PRODUCTS.map(product => <Choice key={product.value} selected={picked.product && draft.product === product.value} onClick={() => {update({...draft, choices: {...picked, product: true}, product: product.value, goalkeepers: product.value === 'shirt' ? [] : draft.goalkeepers, design: {...draft.design, approved: false, finalFront: null, finalBack: null}});}}><OrderBanner id={product.value}/><strong>{product.label}</strong><span>{money(product.cents)} <small>c/u · precio base</small></span></Choice>)}</div>}
      {step === 2 && <div className="pedido-options two pedido-gender-options" data-advisor="gender">{(['Hombre', 'Mujer'] as const).map(gender => <Choice key={gender} selected={draft.gender === gender} onClick={() => update({...draft, gender, design: {...draft.design, approved: false}})}><strong>{draft.product === 'shirt' ? 'Camisas' : 'Uniforme'} para {gender.toLowerCase()}</strong><span>{gender === 'Hombre' ? 'Corte de hombre' : 'Corte de mujer'}</span></Choice>)}</div>}
      {step === 3 && <div className="pedido-config-groups pedido-one-choice" key={configKey}>
        {configStep < 4 && ([{key: 'mold', title: 'Molde', values: PRICES.molds, guide: 'molds'}, {key: 'fabric', title: 'Tela', values: PRICES.fabrics, guide: 'fabrics'}, {key: 'collar', title: 'Cuello', values: PRICES.collars, guide: 'collars'}, {key: 'sleeve', title: 'Manga', values: PRICES.sleeves, guide: 'sleeves'}] as const).filter(group => group.key === configKey).map(group => <fieldset key={group.key} data-advisor={group.key}><legend>{group.title}</legend><p className="pedido-fine">{configScreen.hint}</p><button type="button" className="pedido-text-button" onClick={() => setGuide(group.guide)}>Ver guía de {group.title.toLowerCase()} ↗</button><div className="pedido-options">{Object.entries(group.values).map(([label, cents]) => <Choice key={label} selected={draft.config[group.key] === label} onClick={() => config(group.key, label as never)}>{OPTION_IMAGES[label] && <OptionThumbnail id={OPTION_IMAGES[label]}/>}<strong>{label}</strong><span>{cents ? `+${money(cents)} por prenda` : 'Sin recargo'}</span></Choice>)}</div></fieldset>)}
        {configKey === 'brand' && <fieldset data-advisor="brand"><legend>Marca deportiva</legend><div className="pedido-options two">{(['Tony', 'Propia'] as const).map(brand => <Choice key={brand} selected={picked.brand && draft.config.brand === brand} onClick={() => {config('brand', brand);}}><OptionThumbnail id={brand === 'Tony' ? 'marca-tony' : 'marca-propia'}/><strong>{brand === 'Tony' ? 'Marca Tony' : 'Marca propia'}</strong><span>{brand === 'Tony' && draft.product === 'uniform' ? '−$0.50 por uniforme de campo' : 'Personaliza tu identidad'}</span></Choice>)}</div></fieldset>}
        {(configKey === 'brand3d' || configKey === 'crest3d') && <fieldset data-advisor={configKey}><legend>{configScreen.label}</legend><button type="button" className="pedido-text-button" onClick={() => setGuide('logos')}>Ver guía de acabados ↗</button><div className="pedido-options two">{[false, true].map(raised => <Choice key={String(raised)} selected={finishPicked[configKey] && draft.config[configKey] === raised} onClick={() => {config(configKey, raised);}}><OptionThumbnail id={`${configKey === 'brand3d' ? 'brand' : 'crest'}-${raised ? '3d' : 'sublimated'}`}/><strong>{raised ? 'Relieve 3D' : 'Sublimado'}</strong><span>{raised ? '+$1.75 por prenda de campo' : 'Sin recargo de acabado'}</span></Choice>)}</div></fieldset>}
      </div>}
      {step === 4 && <div className="pedido-roster pedido-roster-single">
        {rosterStep === 0 && <div data-advisor="team"><Field label="Nombre de equipo" error={errors.teamName}><input value={draft.teamName} maxLength={100} onChange={e => update({...draft, teamName: e.target.value})}/></Field></div>}
        {rosterStep === 1 && <div className="pedido-quantity-row" data-advisor="quantity"><Field label={`¿Cuántas ${draft.product === 'uniform' ? 'prendas sin contar el portero' : 'camisas'} son?`} error={errors.quantity}><input type="number" min="6" max="99" value={quantityText} onChange={e => {setQuantityText(e.target.value); const quantity = Number(e.target.value); if (!Number.isInteger(quantity) || quantity < 6 || quantity > 99) return; if (quantity < draft.quantity && draft.players.slice(quantity).some(player => player.name || player.number || player.size)) setReduceTo(quantity); else update(resizePlayers(draft, quantity));}}/></Field><p>Pedido mínimo: 6 prendas con talla seleccionada.<br/>2XL +$2 · 3XL +$3 · 4XL +$4</p></div>}
        {rosterStep >= 2 && rosterStep < draft.quantity + 2 && rosterPlayer && <div className="pedido-player-list" data-advisor="players"><PlayerRow key={rosterPlayer.id} player={rosterPlayer} index={rosterPlayerIndex} errors={errors} onChange={patch => update({...draft, players: draft.players.map((row, i) => i === rosterPlayerIndex ? {...row, ...patch} : row), design: {...draft.design, approved: false}})}/><p className="pedido-fine">Revisa estos datos antes de pasar al siguiente jugador. Puedes volver con Anterior.</p></div>}
        {rosterStep === draft.quantity + 2 && draft.product === 'uniform' && <fieldset data-advisor="keepers"><legend>Porteros</legend><p className="pedido-fine">Primer portero gratis desde 12 uniformes de campo. Los adicionales se cobran según sus opciones.</p>{draft.goalkeepers.map((keeper, index) => <div className="pedido-keeper" key={keeper.id}><PlayerRow player={keeper} index={index} keeper errors={errors} onChange={patch => update({...draft, goalkeepers: draft.goalkeepers.map((row, i) => i === index ? {...row, ...patch} : row)})}/><Field label={`Color portero ${index + 1}`} error={errors[`goalkeepers.${index}.color`]}><input value={keeper.color} maxLength={60} onChange={e => update({...draft, goalkeepers: draft.goalkeepers.map((row, i) => i === index ? {...row, color: e.target.value} : row)})}/></Field><button type="button" className="pedido-text-button" onClick={() => update({...draft, goalkeepers: draft.goalkeepers.filter((_, i) => i !== index)})}>Quitar portero {index + 1}</button></div>)}<button type="button" className="button outline" disabled={draft.goalkeepers.length >= 10} onClick={() => update({...draft, goalkeepers: [...draft.goalkeepers, {id: crypto.randomUUID(), name: '', number: '', size: '', color: ''}]})}>Añadir portero +</button><label className="pedido-check"><input type="checkbox" checked={draft.shortsNumber} onChange={e => update({...draft, shortsNumber: e.target.checked})}/> Incluir número en calzoneta</label></fieldset>}
        {rosterStep === rosterNotesStep && <Field label="Indicaciones adicionales (opcional)"><textarea value={draft.notes} maxLength={2000} onChange={e => update({...draft, notes: e.target.value})}/></Field>}
      </div>}
      {step === 5 && <div><p className="pedido-lead">Medias · {money(PRICES.socks.pairCents)} el par</p><p>Toca un color para verlo y suma los pares con + y −. También puedes continuar sin medias.</p><SockPicker socks={draft.socks} onChange={socks => update({...draft, socks})}/></div>}
      {step === 6 && <DesignEditor draft={draft} onChange={update} onAI={apiConfigured ? designAI : undefined}/>}
      {step === 7 && <div><div className="pedido-final-views">{(['front', 'back'] as const).map(side => <figure key={side}>{(side === 'front' ? draft.design.finalFront : draft.design.finalBack) ? <img src={(side === 'front' ? draft.design.finalFront : draft.design.finalBack)!} alt={`Diseño final ${side === 'front' ? 'frontal' : 'dorsal'}`}/> : <div className="pedido-final-empty"><span>{side === 'front' ? '01' : '02'}</span>Acabado {side === 'front' ? 'frontal' : 'dorsal'} pendiente</div>}<figcaption>{side === 'front' ? 'Frontal' : 'Dorsal'}</figcaption></figure>)}</div><p className="pedido-fine" id="pedido-final-ai-info">Al preparar el acabado con inteligencia artificial, Tony enviará el frente y el dorsal con los nombres, números y gráficos visibles, además de los archivos originales de los logos colocados, a Google Gemini a través de Vercel AI Gateway. Revisa ambas caras y comparte solo contenido que puedas autorizar. <Link href="/privacidad" target="_blank" rel="noopener noreferrer">Privacidad ↗</Link></p><button type="button" className="button primary" disabled={!apiConfigured} aria-describedby="pedido-final-ai-info" onClick={() => void prepareFinal()}>{draft.design.finalFront ? 'Volver a preparar acabado final' : 'Preparar mockup profesional con IA'} ↗</button><label className="pedido-check"><input type="checkbox" checked={draft.design.approved} disabled={!draft.design.finalFront || !draft.design.finalBack} onChange={e => update({...draft, design: {...draft.design, approved: e.target.checked}})}/> Revisé ambas caras y apruebo este diseño para mi pedido.</label>{!apiConfigured && <p className="pedido-fine">El acabado con IA estará disponible cuando se conecte el servicio de pedidos. Puedes guardar tu diseño mientras tanto.</p>}</div>}
      {step === 8 && <div><div className="pedido-summary-title"><h2>{draft.teamName}</h2><span>{draft.quantity} {draft.product === 'uniform' ? 'uniformes' : 'camisas'} · Full sublimado</span></div><dl className="pedido-specs">{Object.entries({'Para': draft.gender, Molde: draft.config.mold, Tela: draft.config.fabric, Cuello: draft.config.collar, Manga: draft.config.sleeve, Marca: draft.config.brand}).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><PriceLines draft={draft} delivery={delivery} full/><details className="pedido-details"><summary>Ver jugadores, tallas y dorsales</summary><div className="pedido-table-wrap"><table><thead><tr><th>Nombre</th><th>Talla</th><th>Dorsal</th><th>Rol</th></tr></thead><tbody>{[...draft.players.map(row => ({...row, role: 'Campo'})), ...draft.goalkeepers.map(row => ({...row, role: 'Portero'}))].map(row => <tr key={row.id}><td>{row.name}</td><td>{row.size}</td><td>{row.number}</td><td>{row.role}</td></tr>)}</tbody></table></div></details>{draft.notes && <p>{draft.notes}</p>}</div>}
      {step >= 9 && step <= 11 && <CheckoutSteps step={step + 1} disabled={!!busy} delivery={delivery} setDelivery={setDelivery} payment={payment} setPayment={setPayment} buyer={buyer} setBuyer={setBuyer} signature={signature} setSignature={setSignature} terms={terms} setTerms={setTerms} errors={errors} pricing={pricing} verified={verified} paymentUrl={paymentUrl} onWarn={warn} startPayment={startPayment} checkPayment={checkPayment} uploadReceipt={uploadReceipt} onFailure={setFailure} onNotice={setNotice}/>}
      {step === 12 && receipt && <div className="pedido-confirmation"><span className="pedido-confirm-mark" aria-hidden="true">✓</span><h2>{receipt.status === 'transfer_review' ? 'Recibimos tu pedido' : 'Pedido confirmado'}</h2><p>{receipt.status === 'transfer_review' ? 'Tu comprobante está pendiente de revisión. Tony confirmará tu anticipo antes de continuar.' : 'Tu anticipo está verificado. Guarda los documentos de tu pedido.'}</p>{receipt.panelStatus === 'pending' && <p className="pedido-alert">Tu pedido está guardado. El envío al Panel Tony está pendiente; conserva la referencia para consultar su recepción.</p>}<div className="pedido-receipt-ref"><span>NÚMERO DE PEDIDO</span><strong>{receipt.reference || receipt.id}</strong></div><div className="pedido-downloads"><button type="button" className="button primary" onClick={() => void download('production')}>Orden de producción ↓</button><button type="button" className="button outline" onClick={() => void download('payment')}>Orden de pago ↓</button>{(['front', 'back'] as const).map(side => <button type="button" className="button outline" key={side} onClick={() => void run('Preparando diseño…', async () => {const {downloadDesign} = await import('@/lib/pedido/downloads'); await downloadDesign((side === 'front' ? draft.design.finalFront : draft.design.finalBack)!, `tony-${side}.png`);})}>Diseño {side === 'front' ? 'frontal' : 'dorsal'} ↓</button>)}</div><Link href="/recientes" className="pedido-text-button">Ver seguimiento de mi pedido ↗</Link><button type="button" className="button outline" onClick={() => setReset(true)}>Nuevo pedido</button><p className="pedido-fine">Descarga tus documentos antes de salir. Por privacidad, los datos personales no se conservan al recargar.</p></div>}
      </div>
      </fieldset>
      {step > 0 && step < 12 && <footer className="pedido-step-footer">
        <button type="button" className="button outline pedido-step-back" disabled={!!busy || verified || (Boolean(payment.reference) && step <= 10)} onClick={back}>← Anterior</button>
        {step < 11 && <span className="pedido-footer-next" aria-hidden="true"><small>Siguiente</small>{nextLabel}</span>}
        {step < 9 && saveButton('pedido-mobile-save')}
        <button type="button" className="button primary" disabled={!ready || !!busy} onClick={step === 11 ? () => void submit() : next}>{step === 11 ? 'CONFIRMAR Y ENVIAR PEDIDO' : 'Continuar'} →</button>
      </footer>}
      </PedidoAdvisor>
    </section>{step > 0 && step < 12 && <aside className="pedido-aside"><span className="pedido-aside-label">TU PEDIDO</span><h2>{draft.teamName || 'La próxima historia es tuya.'}</h2><p>{picked.product ? `${picked.quantity === false ? 'Cantidad por elegir ·' : draft.quantity} ${draft.product === 'uniform' ? 'uniformes' : 'camisas'} · Full sublimado` : 'Producto por elegir'}</p><div className="pedido-mini-specs"><span className={draft.config.fabric ? 'is-set' : 'is-pending'}>{draft.config.fabric || 'Tela por elegir'}</span><span className={draft.config.mold ? 'is-set' : 'is-pending'}>{draft.config.mold || 'Molde por elegir'}</span><span className={draft.design.catalogCode || draft.design.front || draft.design.back ? 'is-set' : 'is-pending'}>{draft.design.catalogCode || (draft.design.front || draft.design.back ? 'Diseño propio' : 'Diseño por elegir')}</span></div>{picked.product ? <PriceLines draft={draft} delivery={delivery}/> : <p className="pedido-fine">Elige tu producto para ver el precio por prenda.</p>}{saveButton()}<p className="pedido-fine">Guardar un diseño no realiza un cobro ni envía el pedido.</p><a className="pedido-help" href="https://wa.me/50370155571" target="_blank" rel="noopener noreferrer"><span>¿Necesitas una mano?</span><strong>Ayuda por WhatsApp ↗</strong></a></aside>}</div>
    <div className="pedido-bottom-note"><span role="status">{storage}</span>{step === 0 || step === 12 ? <a href="https://wa.me/50370155571" target="_blank" rel="noopener noreferrer">Ayuda por WhatsApp ↗</a> : null}</div>
    {guide && <Modal title={guide === 'fabrics' ? 'Telas disponibles' : guide === 'molds' ? 'Moldes' : guide === 'collars' ? 'Cuellos' : guide === 'sleeves' ? 'Mangas' : 'Logos y marcas'} onClose={() => setGuide('')}><div className="pedido-guide-grid">{guideImages.map((item, index) => <figure key={item.id}><GuidePhoto item={item} first={index === 0}/><figcaption>{item.title}</figcaption>{'description' in item && <p>{String(item.description)}</p>}</figure>)}</div>{guide === 'fabrics' && <dl className="pedido-prices">{Object.entries(PRICES.fabrics).map(([name, cents]) => <div key={name}><dt>{name}</dt><dd>{cents ? `+${money(cents)} por prenda` : 'Sin recargo'}</dd></div>)}</dl>}{guide === 'logos' && <p>Escudo: $5 por diseño. Marca deportiva: $3 por diseño. Patrocinador: $5 por elemento colocado. Acabado 3D: $1.75 por tipo y por prenda de campo.</p>}</Modal>}
    {reduceTo !== null && <Modal title="¿Reducir la cantidad del equipo?" onClose={() => {setReduceTo(null); setQuantityText(String(draft.quantity));}}><p>Se quitarán las últimas {draft.quantity - reduceTo} filas y sus datos. Las demás prendas se conservarán.</p><div className="pedido-inline-actions"><button className="button outline" type="button" onClick={() => {setReduceTo(null); setQuantityText(String(draft.quantity));}}>Conservar jugadores</button><button className="button primary" type="button" onClick={() => {update(resizePlayers(draft, reduceTo)); setReduceTo(null);}}>Sí, reducir cantidad</button></div></Modal>}
    {reset && <Modal title="¿Crear un nuevo pedido?" onClose={() => setReset(false)}><p>Descarga primero los documentos de este pedido. Tus diseños del carrito seguirán disponibles.</p><button className="button primary" type="button" onClick={() => {setDraft(createPedido()); setConfigStep(0); setRosterStep(0); confirmedSnapshot.current = null; setReceipt(null); setVerified(false); setPayment({method: '', bank: ''}); setPaymentUrl(''); setBuyer({name: '', dui: '', phone: '', email: ''}); setSignature(''); setTerms(false); setDelivery(EMPTY_DELIVERY); setCanSave(true); paymentKey.current = ''; submitKey.current = ''; setReset(false); move(0);}}>Crear nuevo pedido</button></Modal>}
  </div></main>;
}
