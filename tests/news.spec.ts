import {test,expect} from '@playwright/test';
import {TONY_CHANNELS,LOURDES_PUBLICATION} from '../lib/social-news';

test.beforeEach(async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});});

test('Tony News conserva las cuentas oficiales y solo carga Instagram al solicitarlo',async({page})=>{
  const external:string[]=[];
  page.on('request',request=>{if(/instagram\.com|tiktok\.com|facebook\.com/.test(request.url()))external.push(request.url());});
  await page.route(LOURDES_PUBLICATION.embedUrl,route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Publicación de prueba</title><p>Documento externo de prueba</p>'}));
  await page.goto('/tony-news');
  await expect(page.locator('main h1')).toHaveText('TONY NEWS.');
  const channels=page.getByRole('navigation',{name:'Canales oficiales de Tony'});
  for(const channel of Object.values(TONY_CHANNELS))await expect(channels.getByRole('link',{name:channel.name})).toHaveAttribute('href',channel.url);
  await expect(page.locator('main iframe')).toHaveCount(0);
  expect(external).toEqual([]);
  const instagram=page.locator('.tn-embed-instagram');
  await expect(instagram.getByRole('link',{name:'Abrir publicación en Instagram'})).toHaveAttribute('href',LOURDES_PUBLICATION.url);
  await instagram.getByRole('button',{name:'Ver publicación',exact:true}).click();
  await expect(instagram).toHaveAttribute('data-state','opened');
  await expect(instagram.locator('iframe')).toHaveAttribute('src',LOURDES_PUBLICATION.embedUrl);
  await expect(instagram).toContainText('Si no aparece el contenido o pide iniciar sesión');
  await expect(page.locator('.tn-embed-tiktok')).toHaveAttribute('data-state','idle');
  await page.locator('a[href="/producto#ciclismo"]').click();
  await expect(page.getByRole('tab',{name:/Ciclismo/})).toHaveAttribute('aria-selected','true');
});

test('TikTok informa el bloqueo y permite reintentar sin perder el canal original',async({page})=>{
  await page.route('https://www.tiktok.com/embed.js',route=>route.abort('blockedbyclient'));
  await page.goto('/tony-news');
  const tiktok=page.locator('.tn-embed-tiktok');
  await tiktok.getByRole('button',{name:'Ver publicaciones de TikTok'}).click();
  await expect(tiktok).toHaveAttribute('data-state','unavailable');
  await expect(tiktok.getByRole('status')).toContainText('no se pudo cargar');
  await expect(tiktok.getByRole('link',{name:'Ir al canal de TikTok'})).toHaveAttribute('href',TONY_CHANNELS.tiktok.url);
  await page.unroute('https://www.tiktok.com/embed.js');
  // A deterministic provider response checks our retry lifecycle, not TikTok's service.
  await page.route('https://www.tiktok.com/embed.js',route=>route.fulfill({contentType:'application/javascript',body:"const q=document.querySelector('.tiktok-embed');q.id='verifiedProfile';const f=document.createElement('iframe');f.name='__tt_embed__verifiedProfile';f.src='https://www.tiktok.com/embed/@tonysportswear';q.append(f);"}));
  await page.route('https://www.tiktok.com/embed/@tonysportswear',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><p>Perfil de prueba</p><script>parent.postMessage(JSON.stringify({signalSource:window.name,height:520}),"*")</script>'}));
  await tiktok.getByRole('button',{name:'Reintentar',exact:true}).click();
  await expect(tiktok).toHaveAttribute('data-state','opened');
  await expect(tiktok.locator('iframe')).toHaveCount(1);
  await expect(tiktok.locator('iframe')).toHaveAttribute('title','Publicaciones de Tony Sportswear en TikTok');
});

test('TikTok oculta documentos de error y rechaza señales ajenas hasta el timeout',async({page})=>{
  await page.route('https://www.tiktok.com/embed.js',route=>route.fulfill({contentType:'application/javascript',body:"const q=document.querySelector('.tiktok-embed');q.id='blockedProfile';const f=document.createElement('iframe');f.name='__tt_embed__blockedProfile';f.src='https://www.tiktok.com/embed/@tonysportswear';q.append(f);"}));
  await page.route('https://www.tiktok.com/embed/@tonysportswear',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><p>overload-protect triggered</p><script>parent.postMessage(JSON.stringify({signalSource:"__tt_embed__wrongProfile",height:520}),"*")</script>'}));
  await page.goto('/tony-news');
  await page.clock.install();
  const tiktok=page.locator('.tn-embed-tiktok');
  await tiktok.getByRole('button',{name:'Ver publicaciones de TikTok'}).click();
  await expect(tiktok.locator('iframe')).toHaveCount(1);
  await expect(tiktok).toHaveAttribute('data-state','loading');
  await expect(tiktok.locator('.tn-embed-host')).toHaveCSS('opacity','0');
  await expect(tiktok.locator('.tn-embed-host')).toHaveAttribute('inert','');
  await page.evaluate(()=>{
    const frame=document.querySelector<HTMLIFrameElement>('.tn-embed-tiktok iframe')!;
    const data=JSON.stringify({signalSource:frame.name,height:520});
    window.dispatchEvent(new MessageEvent('message',{origin:'https://not-tiktok.example',source:frame.contentWindow,data}));
    window.dispatchEvent(new MessageEvent('message',{origin:'https://www.tiktok.com',source:window,data}));
  });
  await expect(tiktok).toHaveAttribute('data-state','loading');
  await page.clock.fastForward(13_000);
  await expect(tiktok).toHaveAttribute('data-state','unavailable');
  await expect(tiktok.locator('iframe')).toHaveCount(0);
  await expect(tiktok.getByRole('button',{name:'Reintentar',exact:true})).toBeVisible();
  await expect(tiktok.getByRole('link',{name:'Ir al canal de TikTok'})).toBeVisible();
});

test('una publicación que no responde libera la carga y permite volver a intentar',async({page})=>{
  let release!:()=>void;
  const gate=new Promise<void>(resolve=>{release=resolve;});
  let attempts=0;
  await page.route(LOURDES_PUBLICATION.embedUrl,async route=>{
    attempts++;
    if(attempts===1)await gate;
    await route.fulfill({contentType:'text/html',body:'<p>Documento de prueba</p>'}).catch(()=>{});
  });
  try{
    await page.goto('/tony-news');
    await page.clock.install();
    const instagram=page.locator('.tn-embed-instagram');
    await instagram.getByRole('button',{name:'Ver publicación',exact:true}).click();
    await expect(instagram).toHaveAttribute('data-state','loading');
    await page.clock.fastForward(13_000);
    await expect(instagram).toHaveAttribute('data-state','unavailable');
    await expect(instagram.locator('iframe')).toHaveCount(0);
    await expect(instagram.getByRole('link',{name:'Abrir publicación en Instagram'})).toBeVisible();
    release();
    await instagram.getByRole('button',{name:'Reintentar',exact:true}).click();
    await expect(instagram).toHaveAttribute('data-state','opened');
  }finally{release();}
});

