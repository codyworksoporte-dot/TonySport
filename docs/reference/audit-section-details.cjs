const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const routes = ['patrocinadores','producto/responsabilidad-social-empresarial','producto/logos-3d-alto-relieve','producto/costura-reinforced','producto/malla-anti-transpirante-suplex','producto/vinyl-textil','producto/suplex-antitranspirante','producto/dex-air','producto/dry-cool','producto/slim-pro','producto/linea-dry-fit','producto/linea-premier','producto/linea-modern-carving','producto/slim-fit','categoria/premios-app','categoria/promo-inicio-de-ano'];
(async()=>{
 const browser = await chromium.launch({channel:'msedge',headless:true});
 const records=[];
 for(let offset=0;offset<routes.length;offset+=3){
  await Promise.all(routes.slice(offset,offset+3).map(async route=>{
   const page=await browser.newPage({viewport:{width:1440,height:1000}});
   const url=`https://www.tonysportselsalvador.com/${route}/`;
   try{
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:40000});
    await page.mouse.move(350,350); await page.mouse.wheel(0,400); await page.waitForTimeout(1000);
    const data=await page.evaluate(()=>({url:location.href,title:document.title,text:document.body.innerText,links:[...document.querySelectorAll('a[href]')].map(a=>({text:a.textContent.trim(),href:a.href})).filter(a=>a.text),frames:[...document.querySelectorAll('iframe')].map(f=>({title:f.title,src:f.src})),images:[...document.images].map(i=>({alt:i.alt,src:i.currentSrc?.startsWith('data:')?'':i.currentSrc||i.src,original:i.getAttribute('data-src')}))}));
    records.push({route,status:response.status(),...data});
    console.log(JSON.stringify({route,status:response.status(),chars:data.text.length}));
   }catch(error){records.push({route,url,error:error.message});console.log(JSON.stringify({route,error:error.message}));}
   await page.close();
  }));
 }
 fs.writeFileSync(path.join(__dirname,'sections-details-audit.json'),JSON.stringify(records,null,2));
 await browser.close();
})();
