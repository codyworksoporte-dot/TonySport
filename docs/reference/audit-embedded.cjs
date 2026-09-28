const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const responses=[];
 page.on('response',r=>{if(/(pedido|configur|editor|iframe|form|tony)/i.test(r.url())) responses.push({url:r.url(),status:r.status()})});
 await page.goto('https://tonysportselsalvador.com/',{waitUntil:'domcontentloaded',timeout:45000});
 await page.mouse.move(450,450);
 await page.mouse.wheel(0,800);
 await page.waitForTimeout(5000);
 const data=await page.evaluate(()=>({url:location.href,scripts:[...document.scripts].map(s=>({src:s.src||s.getAttribute('data-src'),text:s.src?'':s.textContent})),iframes:[...document.querySelectorAll('iframe')].map(f=>({src:f.src,title:f.title})),links:[...document.querySelectorAll('a')].map(a=>({href:a.href,text:a.textContent,html:a.outerHTML})),mentions:document.documentElement.outerHTML.match(/.{0,200}(pedido|configurador|editor|iframe).{0,200}/gi)}));
 fs.writeFileSync(path.join(__dirname,'official-embedded.json'),JSON.stringify({...data,responses},null,2));
 console.log(JSON.stringify({iframes:data.iframes,mentions:data.mentions,scripts:data.scripts.map(s=>s.src).filter(Boolean),matchingLinks:data.links.filter(a=>/pedido|configur|editor/.test(a.href+' '+a.text)),responses:responses.filter(r=>/pedido|configur|editor/.test(r.url))}));
 await browser.close();
})();
