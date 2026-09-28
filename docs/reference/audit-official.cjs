const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  const extra = process.argv.slice(2);
  const urls = extra.length ? extra : ['https://www.tonysportselsalvador.com/', 'https://www.tonysportselsalvador.com/producto/disenos-retro/'];
  const prefix = extra.length ? 'official-followup' : 'official';
  const report = [];
  for (let i=0;i<urls.length;i++) {
    try {
      const response = await page.goto(urls[i], {waitUntil:'domcontentloaded', timeout:45000});
      await page.waitForTimeout(3000);
      report.push({url:urls[i],status:response.status(),title:await page.title(),links:await page.locator('a').evaluateAll(nodes=>nodes.map(n=>({text:n.textContent.trim(),href:n.href})).filter(n=>n.text)),forms:await page.locator('input,select,textarea,form').evaluateAll(nodes=>nodes.map(n=>({tag:n.tagName,id:n.id,name:n.name,type:n.type,min:n.min,max:n.max,action:n.action}))),text:(await page.locator('body').innerText()).slice(0,30000),images:await page.locator('img').evaluateAll(nodes=>nodes.map(n=>({alt:n.alt,src:n.currentSrc||n.src})).filter(n=>n.src))});
      await page.screenshot({path:path.join(__dirname,`${prefix}-${i}.png`),fullPage:true});
    } catch (error) { report.push({url:urls[i],error:error.message}); }
  }
  fs.writeFileSync(path.join(__dirname,`${prefix}-audit.json`),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report.map(({images,links,...rest})=>rest)));
  await browser.close();
})();
