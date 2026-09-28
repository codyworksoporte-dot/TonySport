const {chromium}=require('@playwright/test');
const fs=require('node:fs');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage();
  const response=await page.goto('https://tonysportselsalvador.com/',{waitUntil:'domcontentloaded',timeout:45000});
  const menu=await page.evaluate(()=>{
    const source=[...document.querySelectorAll('a')].find(a=>a.textContent.trim()==='Productos');
    function child(li){const link=li.querySelector(':scope > a');return {label:link?.textContent.trim(),href:link?.href,children:[...li.querySelectorAll(':scope > ul > li')].map(child)};}
    return source?child(source.closest('li')):null;
  });
  fs.writeFileSync('docs/reference/product-menu-2026-09-23.json',JSON.stringify({url:page.url(),status:response.status(),checkedAt:new Date().toISOString(),menu},null,2));
  console.log(JSON.stringify(menu,null,2));
  await browser.close();
})();
