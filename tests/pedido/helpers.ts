import {expect, type Page} from '@playwright/test';
import {calculatePedido} from '../../lib/pedido/pricing';
import type {Delivery, PedidoDraft} from '../../lib/pedido/types';
import {DEMO_IMAGE} from './pricing.fixtures';

export const TEST_REFERENCE = 'TONY-000000000000000000000001';
export const TEST_PAYMENT_URL = 'https://lk.wompi.sv/test-only-not-real-payment';

export async function mockPedidoApi(page: Page, options: {paid?: boolean; pending?: boolean; failSubmit?: boolean; aiImage?: string; failAI?: boolean} = {}) {
  let order: PedidoDraft | undefined, delivery: Delivery | undefined;
  const calls: {endpoint: string; method: string}[] = [];
  const submitted: unknown[] = [];
  // A test can never charge Wompi, consume Gemini quota or send an order to the live Panel.
  await page.context().route(/^https?:\/\/(?!127\.0\.0\.1(?::\d+)?(?:\/|$)|localhost(?::\d+)?(?:\/|$))/, route => route.abort());
  await page.context().route('**/pedido-api/**', async route => {
    const request = route.request(), url = new URL(request.url()), endpoint = url.pathname.split('/').pop()!;
    calls.push({endpoint, method: request.method()});
    const respond = (body: unknown, status = 200) => route.fulfill({status, contentType:'application/json', body:JSON.stringify(body)});
    if (endpoint === 'session.php') return respond({ok:true,sessionToken:'0'.repeat(64)});
    if (['generate.php','finalize.php','magic_eraser.php'].includes(endpoint)) return options.failAI ? respond({ok:false,message:'La imagen no se pudo preparar. Conservamos tu diseño; vuelve a intentarlo.'},503) : respond({ok:true,image:options.aiImage||DEMO_IMAGE,mime:'image/png',provider:'synthetic-test'});
    const body = request.method()==='POST' ? request.postDataJSON() : undefined;
    if (endpoint === 'quote.php') {order=body.order;delivery=body.delivery;return respond({ok:true,quote:calculatePedido(order!,delivery!.kind)});}
    if (endpoint === 'wompi-crear-pago.php') {
      order=body.order;delivery=body.delivery;
      if (body.amountCents!==calculatePedido(order!,delivery!.kind).depositCents) return respond({ok:false,message:'El importe no coincide con el pedido.'},400);
      const quote=calculatePedido(order!,delivery!.kind);
      return respond({ok:true,url:TEST_PAYMENT_URL,reference:TEST_REFERENCE,amountCents:quote.depositCents,quote,status:'pending',mock:true});
    }
    if (endpoint === 'wompi-verificar.php') {
      if (!order || !delivery) return respond({ok:false,message:'No existe un pago de prueba para verificar.'},404);
      const quote=calculatePedido(order,delivery.kind);
      return respond({ok:true,paid:options.paid===true,status:options.paid?'deposit_paid':options.pending?'pending':'rejected',reference:TEST_REFERENCE,url:TEST_PAYMENT_URL,amountCents:quote.depositCents,quote,snapshot:{order,delivery},mock:true});
    }
    if (endpoint === 'tony-submit-order.php') {
      if (options.failSubmit) return respond({ok:false,message:'No pudimos enviar el pedido. Inténtalo nuevamente.'},503);
      submitted.push(body);const quote=calculatePedido(body.order,body.delivery.kind);
      return respond({ok:true,receipt:{id:TEST_REFERENCE,reference:TEST_REFERENCE,status:body.payment.method==='transfer'?'transfer_review':'confirmed',totalCents:quote.totalCents,depositCents:quote.depositCents,balanceCents:quote.balanceCents,paymentStatus:body.payment.method==='transfer'?'awaiting_review':options.paid?'deposit_paid':'rejected',mock:true}});
    }
    return respond({ok:false,message:`Endpoint de prueba inesperado: ${endpoint}`},404);
  });
  await page.context().route(TEST_PAYMENT_URL, route => route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Pago simulado</title><h1>Simulación sin cobro real</h1><p>Regresa a Tony para verificar el resultado de prueba.</p>'}));
  return {calls,submitted};
}

export async function seedPedido(page: Page, draft: PedidoDraft) {
  await page.addInitScript(order => {
    if (sessionStorage.getItem('tony:test-seeded')) return;
    const request=indexedDB.open('tony-pedido-v279',1);
    request.onupgradeneeded=()=>{request.result.createObjectStore('drafts');request.result.createObjectStore('cart',{keyPath:'id'});};
    request.onsuccess=()=>{
      const db=request.result,transaction=db.transaction('drafts','readwrite');transaction.objectStore('drafts').put(order,'current');
      transaction.oncomplete=()=>{sessionStorage.setItem('tony:test-seeded','1');db.close();};
    };
  },draft);
}

export async function pngFixture(page: Page, color='#ED45CC') {
  const data=await page.evaluate(fill=>{const canvas=document.createElement('canvas');canvas.width=160;canvas.height=180;const context=canvas.getContext('2d')!;context.fillStyle=fill;context.fillRect(0,0,160,180);return canvas.toDataURL('image/png');},color);
  return {data,buffer:Buffer.from(data.split(',')[1],'base64')};
}

export async function expectNoOverflow(page: Page, width: number) {
  await expect.poll(()=>page.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth))).toBeLessThanOrEqual(width);
}

export const continuePedido = (page: Page) => page.locator('.pedido-step-footer').getByRole('button',{name:/Continuar/}).click();
export async function openSeededEditor(page: Page) {
  await page.goto('/configurador');
  await expect(page.getByText('Recuperamos tu diseño. Revisa los pasos para continuar.')).toBeVisible();
  await page.getByRole('button',{name:/CREAR MI PEDIDO/}).click();
  for(const heading of ['Escoge tu producto','Selecciona tu línea','Hecho a tu manera','Cada jugador cuenta']) {
    await expect(page.getByRole('heading',{name:heading,exact:true})).toBeVisible();
    await continuePedido(page);
  }
  await page.getByRole('button',{name:/NO QUIERO ASESOR/}).click();
  await continuePedido(page);
  await expect(page.getByRole('region',{name:'Editor de tu uniforme'})).toBeVisible();
}

export async function openSeededDelivery(page: Page) {
  await openSeededEditor(page);
  await continuePedido(page);
  await expect(page.getByRole('heading',{name:'El último detalle',exact:true})).toBeVisible();
  await continuePedido(page);
  await expect(page.getByRole('heading',{name:'Revisa tu pedido',exact:true})).toBeVisible();
  await continuePedido(page);
  await expect(page.getByRole('heading',{name:'¿Dónde lo recibes?',exact:true})).toBeVisible();
}

export async function signPedido(page: Page) {
  const canvas=page.locator('#pedido-signature-canvas');await canvas.scrollIntoViewIfNeeded();
  const box=await canvas.boundingBox();if(!box)throw new Error('No se encontró el recuadro de firma.');
  await page.mouse.move(box.x+30,box.y+box.height*.65);await page.mouse.down();
  await page.mouse.move(box.x+box.width*.3,box.y+box.height*.3,{steps:8});
  await page.mouse.move(box.x+box.width*.5,box.y+box.height*.7,{steps:8});
  await page.mouse.move(box.x+box.width*.75,box.y+box.height*.4,{steps:8});await page.mouse.up();
  await expect(page.getByText('Firma capturada. Puedes borrarla y volver a firmar.')).toBeVisible();
}
