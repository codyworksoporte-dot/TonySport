const { chromium } = require('@playwright/test');
(async()=>{
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:3000',{waitUntil:'networkidle'});
await page.evaluate(()=>document.fonts.ready);
await page.screenshot({path:'docs/preview-hero.png'});
await page.screenshot({path:'docs/preview-desktop.png',fullPage:true});
console.log(JSON.stringify({title:await page.title(),font:await page.locator('h1').evaluate(e=>getComputedStyle(e).fontFamily),width:await page.evaluate(()=>({w:innerWidth,doc:document.documentElement.scrollWidth})),errors}));
await page.setViewportSize({width:390,height:844});
await page.screenshot({path:'docs/preview-mobile.png',fullPage:true});
console.log(JSON.stringify({mobile:await page.evaluate(()=>({w:innerWidth,doc:document.documentElement.scrollWidth}))}));
await page.goto('http://127.0.0.1:3000/configurador',{waitUntil:'networkidle'});
await page.screenshot({path:'docs/preview-configurador-mobile.png',fullPage:true});
await page.setViewportSize({width:1440,height:1000});
await page.screenshot({path:'docs/preview-configurador-desktop.png',fullPage:true});
await browser.close();
})();
