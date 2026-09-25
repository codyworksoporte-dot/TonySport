const {chromium}=require('@playwright/test');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:3000/',{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  const style='.tony-header,.skip-link{visibility:hidden!important}';
  await page.locator('#tutorial').screenshot({caret:'initial',style,path:'docs/revision-tutorial-desktop.png'});
  await page.locator('.tony-footer-stamp').screenshot({caret:'initial',style,path:'docs/revision-footer-flag.png'});
  await page.setViewportSize({width:390,height:844});
  await page.locator('#tutorial').screenshot({caret:'initial',style,path:'docs/revision-tutorial-mobile.png'});
  for(const route of ['entregas','comunidad','actualidad','tony-news']){
    await page.setViewportSize({width:1440,height:1000});
    await page.goto(`http://127.0.0.1:3000/${route}`,{waitUntil:'networkidle'});
    if(route==='entregas'){
      await page.locator('#te-delivery-store').selectOption('San Miguel');
      await page.locator('#te-delivery-destination').fill('San Miguel, centro');
      await page.getByRole('button',{name:'Preparar consulta'}).click();
    }
    await page.evaluate(()=>{ if(document.activeElement instanceof HTMLElement)document.activeElement.blur();window.scrollTo(0,0);});
    await page.screenshot({caret:'initial',path:`docs/revision-${route}-desktop.png`,fullPage:true});
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({caret:'initial',path:`docs/revision-${route}-mobile.png`,fullPage:true});
    if(route==='tony-news'){
      await page.setViewportSize({width:320,height:900});
      await page.screenshot({caret:'initial',path:'docs/revision-tony-news-320.png',fullPage:true});
    }
  }
  console.log(JSON.stringify({errors}));
  await browser.close();
})().catch(error=>{console.error(error);process.exitCode=1;});
