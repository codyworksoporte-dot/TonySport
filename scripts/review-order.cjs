const {chromium}=require('@playwright/test');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3000/configurador',{waitUntil:'networkidle'});
 await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:'docs/order-quantity-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'docs/order-quantity-mobile.png'});
 await page.locator('#cfg-quantity').fill('6');await page.getByRole('button',{name:'Crear lista de jugadores'}).click();
 await page.locator('#cfg-team').fill('Deportivo San Miguel');
 const names=['MARTÍNEZ','RIVERA','HERNÁNDEZ','GARCÍA','LÓPEZ','CASTRO'];
 for(let i=0;i<6;i++){await page.locator(`#player-${i}-name`).fill(names[i]);await page.locator(`#player-${i}-size`).selectOption(['M','L','S','XL','M','L'][i]);await page.locator(`#player-${i}-number`).fill(String([10,7,4,9,11,1][i]));}
 await page.locator('#player-5-role').selectOption('goalkeeper');
 await page.locator('.team-roster').scrollIntoViewIfNeeded();await page.screenshot({path:'docs/order-roster-mobile.png'});
 await page.setViewportSize({width:1440,height:1100});await page.locator('#order-workspace').scrollIntoViewIfNeeded();await page.screenshot({path:'docs/order-roster-desktop.png'});
 await page.getByRole('button',{name:'Ir al editor de diseño'}).click();
 await page.locator('.tds').scrollIntoViewIfNeeded();await page.screenshot({path:'docs/order-editor-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.locator('.tds-controls').scrollIntoViewIfNeeded();await page.screenshot({path:'docs/order-editor-mobile.png'});
 await page.getByRole('button',{name:'Revisar mi pedido'}).click();await page.screenshot({path:'docs/order-review-mobile.png'});
 await page.setViewportSize({width:1440,height:1100});await page.locator('.order-review').scrollIntoViewIfNeeded();await page.screenshot({path:'docs/order-review-desktop.png'});
 console.log(JSON.stringify({errors}));await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});
