const { chromium }=require('@playwright/test');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3000',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
 if(process.argv.includes('--tablet')){
  await page.setViewportSize({width:700,height:1050});
  await page.screenshot({caret:'initial',path:'docs/v2-tablet-hero.png'});
  console.log(JSON.stringify({errors,width:await page.evaluate(()=>({screen:innerWidth,content:document.documentElement.scrollWidth}))}));
  await browser.close();return;
 }
 await page.screenshot({caret:'initial',path:'docs/v2-desktop-hero.png'});await page.screenshot({caret:'initial',path:'docs/v2-desktop-full.png',fullPage:true});
 for(const [selector,name] of [['.origin-section','origin'],['#tutorial','tutorial'],['.tribe-section','tribe']]){
  await page.locator(selector).scrollIntoViewIfNeeded();await page.screenshot({caret:'initial',path:`docs/v2-desktop-${name}.png`});
 }
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({caret:'initial',path:'docs/v2-mobile-hero.png'});await page.screenshot({caret:'initial',path:'docs/v2-mobile-full.png',fullPage:true});
 await page.setViewportSize({width:700,height:1050});await page.screenshot({caret:'initial',path:'docs/v2-tablet-hero.png'});
 await page.goto('http://127.0.0.1:3000/configurador',{waitUntil:'networkidle'});
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({caret:'initial',path:'docs/v2-configurator-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.locator('#order-workspace').scrollIntoViewIfNeeded();await page.screenshot({caret:'initial',path:'docs/v2-configurator-mobile.png'});
 console.log(JSON.stringify({errors,dimensions:await page.evaluate(()=>({width:innerWidth,content:document.documentElement.scrollWidth})),font:await page.locator('h1').evaluate(e=>getComputedStyle(e).fontFamily)}));
 await browser.close();
})();

