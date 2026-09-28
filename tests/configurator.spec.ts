import {expect,test,type Page} from '@playwright/test';
import fs from 'node:fs';
import {completePedido} from './pedido/pricing.fixtures';
import {continuePedido,expectNoOverflow,mockPedidoApi,openSeededDelivery,openSeededEditor,pngFixture,seedPedido,signPedido,TEST_PAYMENT_URL,TEST_REFERENCE} from './pedido/helpers';

test.beforeEach(async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});});

async function pickup(page: Page) {
  await page.getByRole('button',{name:/^Retiro en tienda/}).click();
  await page.getByLabel(/^Sucursal para retirar/).selectOption({index:1});
  await continuePedido(page);await expect(page.getByRole('heading',{name:'Confirma tu anticipo',exact:true})).toBeVisible();
}
async function buyerAndSignature(page: Page) {
  await expect(page.getByRole('heading',{name:'Tu pedido, con tu firma',exact:true})).toBeVisible();
  await page.getByLabel(/^Nombre completo/).fill('CLIENTE DE PRUEBA');
  await page.getByLabel(/^DUI \(00000000-0\)/).fill('00000000-0');
  await page.getByLabel(/^WhatsApp/).fill('70000000');
  await page.getByLabel('Correo electrónico (opcional)',{exact:true}).fill('prueba@example.invalid');
  await page.getByRole('checkbox',{name:'Leí y acepto los términos y condiciones del pedido.'}).check();
  await signPedido(page);
}

test('nada viene marcado; para quién, marca y cada jugador se validan antes de avanzar',async({page})=>{
  await mockPedidoApi(page);await page.goto('/configurador');await page.getByRole('button',{name:'Empezar la personalización'}).click();
  const uniform=page.getByRole('button',{name:/Uniformes Full Sublimados/});
  await expect(uniform).toContainText('$12.99');
  await expect(page.getByRole('button',{name:/Camisas Full Sublimadas/})).toContainText('$7.99');
  // A new order starts with no product chosen.
  await expect(uniform).toHaveAttribute('aria-pressed','false');
  await continuePedido(page);await expect(page.getByRole('alert').first()).toContainText('Elige Uniformes o Camisas');
  await uniform.click();await continuePedido(page);
  await expect(page.getByRole('heading',{name:'¿Para quién es?',exact:true})).toBeVisible();
  await continuePedido(page);
  await expect(page.getByRole('alert').first()).toContainText('Selecciona Hombre o Mujer.');
  await page.getByRole('button',{name:/Uniforme para hombre/}).click();await continuePedido(page);
  for(const [group,choice] of [['Molde','Estándar'],['Tela','Slim Fit'],['Cuello','V'],['Manga','Corta']])await page.getByRole('group',{name:group,exact:true}).getByRole('button',{name:new RegExp(`^${choice}\\b`)}).click();
  // The brand is not chosen for the customer either.
  await continuePedido(page);await expect(page.getByRole('alert').first()).toContainText('Elige la marca deportiva');
  await page.getByRole('button',{name:/^Marca propia/}).click();
  await continuePedido(page);await continuePedido(page);
  await expect(page.getByRole('heading',{name:'Cada jugador cuenta',exact:true})).toBeVisible();
  await expect(page.getByRole('alert').first()).toContainText('Escribe el nombre del equipo');
  await page.getByLabel(/^Nombre de equipo/).fill('EQUIPO DE PRUEBA');
  for(let i=1;i<=6;i++) {
    await page.getByLabel(`Nombre jugador ${i}`,{exact:true}).fill(`JUGADOR ${i}`);
    await page.getByRole('combobox',{name:new RegExp(`^Talla jugador ${i}\\b`)}).selectOption(i===1?'2XL':'M');
    await page.getByLabel(`Dorsal jugador ${i}`,{exact:true}).fill(String(i));
  }
  // 6 × 12.99 + talla 2XL 2.00 + diseño propio 5.00 = 84.94.
  await expect(page.locator('.pedido-aside .pedido-price-total dd')).toHaveText('$84.94');
  await continuePedido(page);await expect(page.getByRole('heading',{name:'Completa tu equipo',exact:true})).toBeVisible();
});

test('la asesora habla sola con voz femenina, frase a frase, y no deja saltarse opciones',async({page})=>{
  await mockPedidoApi(page);
  // Record what is said and with which voice instead of playing it; the device offers a male and a female voice.
  await page.addInitScript(()=>{
    const said:{text:string;voice:string}[]=[];(window as unknown as {__said:typeof said}).__said=said;
    const voices=[{name:'Microsoft Jorge - Spanish (Mexico)',lang:'es-MX'},{name:'Microsoft Sabina - Spanish (Mexico)',lang:'es-MX'}];
    // Plain objects stand in for the browser's voices, so the utterance is simulated too.
    (window as unknown as {SpeechSynthesisUtterance:unknown}).SpeechSynthesisUtterance=class {text:string;voice:unknown=null;lang='';rate=1;pitch=1;onend:unknown=null;onerror:unknown=null;constructor(text:string){this.text=text;}};
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speaking:false,pending:false,paused:false,getVoices:()=>voices,cancel(){},pause(){},resume(){},addEventListener(){},removeEventListener(){},speak(utterance:SpeechSynthesisUtterance){said.push({text:utterance.text,voice:utterance.voice?.name||''});setTimeout(()=>utterance.onend?.(new Event('end') as SpeechSynthesisEvent),20);}}});
  });
  const said=()=>page.evaluate(()=>(window as unknown as {__said:{text:string}[]}).__said.map(item=>item.text).join(' '));
  await page.goto('/configurador');
  const advisor=page.getByRole('region',{name:'Tu asesora Tony'});
  await expect(advisor).toContainText('Toca Crear mi pedido y empezamos.');
  await page.getByRole('button',{name:/CREAR MI PEDIDO/}).click();
  // No play button needed, and only the female voice is used.
  await expect.poll(said).toContain('Elige tu producto.');
  expect(await page.evaluate(()=>[...new Set((window as unknown as {__said:{voice:string}[]}).__said.map(item=>item.voice))])).toEqual(['Microsoft Sabina - Spanish (Mexico)']);
  await page.getByRole('button',{name:/Uniformes Full Sublimados/}).click();await expect(advisor).toContainText('Uniformes, anotado.');
  await continuePedido(page);await expect(advisor).toContainText('¿Uniforme para hombre o para mujer?');
  await page.getByRole('button',{name:/Uniforme para hombre/}).click();await continuePedido(page);
  await expect(advisor).toContainText('Primero, elige el molde.');
  // Choosing the collar before the mold is refused and she says what comes first.
  const collar=page.getByRole('group',{name:'Cuello',exact:true});
  await expect(collar).toContainText('Primero elige el molde');
  await collar.getByRole('button',{name:/^Polo\b/}).click();
  await expect(advisor).toContainText('Primero elige el molde.');
  await expect(collar.getByRole('button',{name:/^Polo\b/})).toHaveAttribute('aria-pressed','false');
  await expect.poll(said).toContain('Primero elige el molde.');
  await expect(page.locator('[data-advisor="mold"]')).toHaveClass(/is-advised/);
  for (const [group,choice,next,target] of [['Molde','Raglan','Ahora elige la tela.','fabric'],['Tela','Dryfit','Ahora elige el cuello.','collar'],['Cuello','Polo','¿Manga corta o larga?','sleeve'],['Manga','Larga','elige la marca deportiva','brand']]) {
    await page.getByRole('group',{name:group,exact:true}).getByRole('button',{name:new RegExp(`^${choice}\\b`)}).click();
    await expect(advisor).toContainText(next);
    await expect(page.locator(`[data-advisor="${target}"]`)).toHaveClass(/is-advised/);
    await expect.poll(said).toContain(next);
  }
  await expect(page.getByRole('navigation',{name:'Pasos del pedido'}).getByRole('button',{name:/Asesora/})).toHaveCount(0);
  await advisor.getByRole('button',{name:'No quiero asesora'}).click();
  await expect(advisor).toHaveCount(0);
  await page.reload();
  const recall=page.getByRole('button',{name:'Mostrar a tu asesora Tony'});await expect(recall).toBeVisible();
  await recall.click();await expect(page.getByRole('region',{name:'Tu asesora Tony'})).toBeVisible();
});

test('la política de privacidad explica los datos del pedido y se enlaza desde el pie',async({page})=>{
  await page.goto('/privacidad');
  await expect(page.getByRole('heading',{level:1})).toContainText('PRIVACIDAD');
  for (const title of ['Qué datos pedimos','Con quién se comparten','Qué se guarda en tu navegador','Tus derechos']) await expect(page.getByRole('heading',{name:title})).toBeVisible();
  await page.goto('/contacto');
  await page.locator('.tony-footer-bottom').getByRole('link',{name:'Política de privacidad'}).click();
  await expect(page).toHaveURL(/\/privacidad\/?$/);
});

test('el catálogo muestra los 70 diseños oficiales y lleva el elegido al pedido',async({page})=>{
  await mockPedidoApi(page);await page.goto('/catalogo');
  await expect(page.getByText('PRÓXIMAMENTE')).toHaveCount(0);
  const cards=page.locator('.catalog-gallery-grid li');await expect(cards).toHaveCount(70);
  const broken=await page.locator('.catalog-gallery-grid img').evaluateAll(images=>Promise.all(images.slice(0,8).map(image=>(image as HTMLImageElement).decode().then(()=>0,()=>1))));
  expect(broken.reduce((a,b)=>a+b,0)).toBe(0);
  await page.getByLabel('Buscar por número').fill('012');await expect(cards).toHaveCount(1);
  await page.getByRole('button',{name:'Ver TONY-012 completo'}).click();
  const dialog=page.getByRole('dialog',{name:'TONY-012'});await expect(dialog).toBeVisible();
  await dialog.getByRole('link',{name:/Usar TONY-012 en mi pedido/}).click();
  await expect(page).toHaveURL(/\/configurador\/?$/);
  await expect(page.getByText('Elegiste TONY-012 del catálogo Tony.')).toBeVisible();
  await page.getByRole('button',{name:/CREAR MI PEDIDO/}).click();
  await expect(page.locator('.pedido-aside .pedido-mini-specs')).toContainText('TONY-012');
});

test('reducir jugadores requiere confirmación y mantiene los datos de las filas restantes',async({page})=>{
  await mockPedidoApi(page);await seedPedido(page,completePedido(12));await openSeededEditor(page);
  await page.getByRole('navigation',{name:'Pasos del pedido'}).getByRole('button',{name:/Jugadores/}).click();
  await page.getByLabel('¿Cuántas prendas sin contar el portero son?',{exact:true}).fill('6');
  await page.getByLabel('¿Cuántas prendas sin contar el portero son?',{exact:true}).blur();
  const dialog=page.getByRole('dialog',{name:'¿Reducir la cantidad del equipo?'});await expect(dialog).toBeVisible();
  await dialog.getByRole('button',{name:'Conservar jugadores'}).click();await expect(page.getByLabel('Nombre jugador 12',{exact:true})).toBeVisible();
  await page.getByLabel('¿Cuántas prendas sin contar el portero son?',{exact:true}).fill('6');await page.getByLabel('¿Cuántas prendas sin contar el portero son?',{exact:true}).blur();await page.getByRole('button',{name:'Sí, reducir cantidad'}).click();
  await expect(page.getByLabel('Nombre jugador 6',{exact:true})).toHaveValue('JUGADOR 6');await expect(page.getByLabel('Nombre jugador 7',{exact:true})).toHaveCount(0);
});

test('domicilio añade $6 y exige dirección; transferencia exige comprobante, firma y conserva solo referencia',async({page})=>{
  const api=await mockPedidoApi(page);await seedPedido(page,completePedido());await openSeededDelivery(page);
  await page.getByRole('button',{name:/^Envío a domicilio/}).click();await continuePedido(page);
  await expect(page.getByRole('alert').first()).toContainText('Escribe la dirección exacta.');
  await page.getByLabel(/^Departamento/).selectOption('San Salvador');
  await page.getByLabel(/^Municipio o distrito/).fill('Distrito de prueba');
  await page.getByLabel(/^Dirección exacta/).fill('Dirección sintética de prueba');
  await expect(page.locator('.pedido-aside .pedido-price-total dd')).toHaveText('$83.94');await continuePedido(page);
  await page.getByRole('button',{name:/^Transferencia bancaria/}).click();await continuePedido(page);
  await expect(page.getByRole('alert').first()).toContainText('Adjunta una imagen válida del comprobante');
  await page.getByLabel(/^Banco de la transferencia/).selectOption({index:1});
  await page.getByLabel(/^Comprobante de transferencia/).setInputFiles({name:'comprobante-prueba.png',mimeType:'image/png',buffer:(await pngFixture(page)).buffer});
  await expect(page.getByText('Comprobante adjunto. Tony verificará la transferencia.')).toBeVisible();await continuePedido(page);
  await page.getByRole('button',{name:/CONFIRMAR Y ENVIAR PEDIDO/}).click();await expect(page.getByRole('alert').first()).toContainText('Firma la orden');
  await buyerAndSignature(page);await page.getByRole('button',{name:/CONFIRMAR Y ENVIAR PEDIDO/}).click();
  await expect(page.getByRole('heading',{name:'Recibimos tu pedido',exact:true})).toBeVisible();
  await expect(page.getByText('Tu comprobante está pendiente de revisión.',{exact:false})).toBeVisible();expect(api.submitted).toHaveLength(1);
  const references=await page.evaluate(()=>JSON.parse(localStorage.getItem('tony:pedido:references:v279')||'[]'));
  expect(references).toEqual([{id:TEST_REFERENCE,status:'transfer_review'}]);
  expect(await page.evaluate(()=>JSON.stringify({...localStorage}))).not.toContain('CLIENTE DE PRUEBA');
  const event=page.waitForEvent('download');await page.getByRole('button',{name:/Orden de producción/}).click();
  const document=await event;expect(fs.readFileSync(await document.path()).subarray(0,8).toString()).toBe('%PDF-1.4');
});

test('Wompi simulado rechazado bloquea la firma y no envía ningún pedido',async({page})=>{
  const api=await mockPedidoApi(page,{paid:false});await seedPedido(page,completePedido());await openSeededDelivery(page);await pickup(page);
  await page.getByRole('button',{name:/^Wompi/}).click();await page.getByRole('button',{name:'Preparar pago del anticipo',exact:true}).click();
  await expect(page.getByRole('link',{name:/Abrir pago seguro/})).toHaveAttribute('href',TEST_PAYMENT_URL);
  await page.getByRole('button',{name:'Verificar mi anticipo',exact:true}).click();await expect(page.getByRole('alert').first()).toContainText('El pago fue rechazado');
  await continuePedido(page);await expect(page.getByRole('heading',{name:'Confirma tu anticipo',exact:true})).toBeVisible();expect(api.submitted).toEqual([]);
});

test('Wompi simulado aprobado permite firma, envío único y descargas aunque falle guardar la referencia',async({page})=>{
  const api=await mockPedidoApi(page,{paid:true});await seedPedido(page,completePedido());await openSeededDelivery(page);await pickup(page);
  await page.getByRole('button',{name:/^Wompi/}).click();await page.getByRole('button',{name:'Preparar pago del anticipo',exact:true}).click();
  await page.getByRole('button',{name:'Verificar mi anticipo',exact:true}).click();await expect(page.getByText('Anticipo verificado. Ya puedes continuar.',{exact:true})).toBeVisible();
  await continuePedido(page);await buyerAndSignature(page);
  await page.evaluate(()=>{
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key:string,value:string) {
      if(this===localStorage&&key==='tony:pedido:references:v279')throw new DOMException('Cuota sintética agotada','QuotaExceededError');
      original.call(this,key,value);
    };
  });
  await page.getByRole('button',{name:/CONFIRMAR Y ENVIAR PEDIDO/}).click();
  await expect(page.getByRole('heading',{name:'Pedido confirmado',exact:true})).toBeVisible();expect(api.submitted).toHaveLength(1);
  expect(await page.evaluate(()=>sessionStorage.getItem('tony:pedido:pending-payment:v279'))).toBeNull();
  expect(await page.evaluate(()=>sessionStorage.getItem('tony:pedido:payment-key:v279'))).toBeNull();
  const documentEvent=page.waitForEvent('download');await page.getByRole('button',{name:/Orden de pago/}).click();const document=await documentEvent;
  expect(fs.readFileSync(await document.path()).subarray(0,8).toString()).toBe('%PDF-1.4');
  const imageEvent=page.waitForEvent('download');await page.getByRole('button',{name:/Diseño frontal/}).click();const image=await imageEvent;
  expect(fs.readFileSync(await image.path()).subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
});

test('firma accesible con teclado puede borrarse y volver a trazarse',async({page})=>{
  await mockPedidoApi(page,{paid:true});await seedPedido(page,completePedido());await openSeededDelivery(page);await pickup(page);
  await page.getByRole('button',{name:/^Wompi/}).click();await page.getByRole('button',{name:'Preparar pago del anticipo',exact:true}).click();
  await page.getByRole('button',{name:'Verificar mi anticipo',exact:true}).click();await expect(page.getByText('Anticipo verificado. Ya puedes continuar.',{exact:true})).toBeVisible();await continuePedido(page);
  await page.getByRole('checkbox',{name:'Leí y acepto los términos y condiciones del pedido.'}).check();
  const canvas=page.locator('#pedido-signature-canvas');await canvas.focus();await canvas.press('Space');
  await canvas.press('Shift+ArrowRight');await canvas.press('Shift+ArrowDown');await canvas.press('Shift+ArrowRight');await canvas.press('Space');
  await expect(page.getByRole('button',{name:'Borrar firma',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Borrar firma',exact:true}).click();await expect(page.getByRole('button',{name:'Borrar firma',exact:true})).toBeDisabled();
});

for(const paid of [false,true])test(`regreso de Wompi ${paid?'pagado recupera la firma incluso con IndexedDB inaccesible':'pendiente conserva el enlace existente sin crear otro'}`,async({page})=>{
  const api=await mockPedidoApi(page,{paid,pending:!paid});await seedPedido(page,completePedido());await openSeededDelivery(page);await pickup(page);
  await page.getByRole('button',{name:/^Wompi/}).click();await page.getByRole('button',{name:'Preparar pago del anticipo',exact:true}).click();
  await expect(page.getByRole('link',{name:/Abrir pago seguro/})).toHaveAttribute('href',TEST_PAYMENT_URL);
  if(paid)await page.addInitScript(()=>{
    const original=IDBObjectStore.prototype.get;
    IDBObjectStore.prototype.get=function(key: IDBValidKey|IDBKeyRange) {
      if(this.name==='drafts'&&key==='current')throw new DOMException('Fallo sintético de lectura del borrador','InvalidStateError');
      return original.call(this,key);
    };
  });
  await page.reload();
  await expect(page.getByRole('heading',{name:paid?'Tu pedido, con tu firma':'Confirma tu anticipo',exact:true})).toBeVisible();
  if(paid) {
    await expect(page.getByLabel(/^Nombre completo/)).toHaveValue('');
    await expect(page.getByRole('button',{name:'Borrar firma',exact:true})).toBeDisabled();
  } else {
    await expect(page.getByRole('link',{name:/Abrir pago seguro/})).toHaveAttribute('href',TEST_PAYMENT_URL);
    await expect(page.getByRole('button',{name:'Preparar pago del anticipo',exact:true})).toHaveCount(0);
  }
  expect(api.calls.filter(call=>call.endpoint==='wompi-crear-pago.php')).toHaveLength(1);
  expect(api.calls.filter(call=>call.endpoint==='wompi-verificar.php').length).toBeGreaterThanOrEqual(1);
  expect(api.submitted).toEqual([]);
});

for(const width of [320,390,1440])test(`configuración y entrega sin desbordamiento a ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});await mockPedidoApi(page);await seedPedido(page,completePedido());await openSeededDelivery(page);
  await page.getByRole('button',{name:/^Envío a domicilio/}).click();await expectNoOverflow(page,width);
});
