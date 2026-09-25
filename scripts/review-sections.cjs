const {chromium}=require('@playwright/test');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.goto('http://127.0.0.1:3000/',{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({caret:'initial',path:'docs/sections-home-desktop.png',fullPage:true});
  const isolate='.tony-header,.skip-link{visibility:hidden!important}';
  await page.locator('#lineas-tony').screenshot({caret:'initial',style:isolate,path:'docs/sections-explorer-desktop.png'});
  await page.locator('.home-destinations').screenshot({caret:'initial',style:isolate,path:'docs/sections-destinations-desktop.png'});
  await page.getByRole('button',{name:'Universo Tony',exact:false}).click();
  await page.screenshot({caret:'initial',path:'docs/sections-menu-desktop.png'});
  await page.keyboard.press('Escape');
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:3000/lineas#empresarial',{waitUntil:'networkidle'});
  await page.locator('#lineas-tony').screenshot({caret:'initial',style:isolate,path:'docs/sections-explorer-mobile.png'});
  await page.goto('http://127.0.0.1:3000/',{waitUntil:'networkidle'});
  await page.screenshot({caret:'initial',path:'docs/sections-home-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Abrir menú'}).click();
  await page.screenshot({caret:'initial',path:'docs/sections-menu-mobile.png'});
  for(const route of ['calidad','tiendas','entregas','patrocinio','comunidad','actualidad']){
    await page.setViewportSize({width:1440,height:1000});
    await page.goto(`http://127.0.0.1:3000/${route}`,{waitUntil:'networkidle'});
    await page.screenshot({caret:'initial',path:`docs/sections-${route}-desktop.png`,fullPage:true});
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({caret:'initial',path:`docs/sections-${route}-mobile.png`,fullPage:true});
    const clipped=await page.locator('main h1,main h2,main h3,main input,main select,main button,main a').evaluateAll(elements=>elements.filter(element=>{const rect=element.getBoundingClientRect();return rect.width>0&&(rect.left<0||rect.right>innerWidth+1);}).map(element=>({tag:element.tagName,text:element.textContent.slice(0,55)})));
    if(clipped.length)errors.push({route,clipped});
  }
  console.log(JSON.stringify({errors}));
  await browser.close();
})().catch(error=>{console.error(error);process.exitCode=1;});
