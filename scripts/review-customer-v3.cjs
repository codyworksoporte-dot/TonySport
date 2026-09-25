const {chromium}=require('@playwright/test');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const checks=[];
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:1000});
  for(const [name,route] of [['home','/'],['reviews','/resenas'],['recent','/recientes'],['cart','/carrito']]){
   await page.goto(`http://127.0.0.1:3000${route}`);
   await page.locator('main h1').waitFor();await page.evaluate(()=>document.fonts.ready);
   checks.push({width,route,...await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,wide:[...document.querySelectorAll('main *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.right>innerWidth+1&&getComputedStyle(el).position!=='absolute';}).slice(0,6).map(el=>el.className)}))});
   if(width===390||width===1440){await page.screenshot({path:`docs/v3-${name}-${width}.png`,fullPage:true,caret:'initial'});}
   if(route==='/'&&(width===320||width===1440)){
    for(const block of ['.home-client-hub','.social-community']){
     await page.locator(block).scrollIntoViewIfNeeded();
     await page.locator(block).screenshot({path:`docs/v3-${block.slice(1)}-${width}.png`,caret:'initial'});
    }
   }
  }
 }
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('http://127.0.0.1:3000/configurador');
 await page.locator('#cfg-quantity').fill('6');
 await page.getByRole('button',{name:'Crear lista de jugadores'}).click();
 await page.locator('#cfg-team').fill('Equipo de muestra');
 for(let i=0;i<6;i++){
  await page.locator(`#player-${i}-name`).fill(`JUGADOR ${i+1}`);
  await page.locator(`#player-${i}-size`).selectOption(['S','M','M','L','XL','L'][i]);
  await page.locator(`#player-${i}-number`).fill(String(i+1));
 }
 await page.getByRole('button',{name:'Ir al editor de diseño'}).click();
 await page.getByRole('button',{name:'Revisar mi pedido'}).click();
 await page.getByRole('button',{name:'Añadir al carrito',exact:true}).click();
 await page.getByRole('link',{name:'Ver mi carrito',exact:true}).click();
 await page.locator('[data-cart-item]').waitFor();
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:1000});
  for(const route of ['carrito','recientes','resenas']){
   await page.goto(`http://127.0.0.1:3000/${route}`);await page.evaluate(()=>document.fonts.ready);
   if(route==='carrito')await page.locator('[data-cart-item]').waitFor();
   if(route==='recientes')await page.locator('.recent-order').waitFor();
   await page.screenshot({path:`docs/v3-${route}-populated-${width}.jpg`,fullPage:true,type:'jpeg',quality:76,caret:'initial'});
  }
 }
 fs.writeFileSync('docs/v3-visual-checks.json',JSON.stringify({checks,errors},null,2));
 console.log(JSON.stringify({checks,errors}));await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
