const {chromium}=require('@playwright/test');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const results=[];
 for(const [name,url] of [
  ['instagram','https://www.instagram.com/tonysportswearsv/'],
  ['facebook','https://www.facebook.com/p/Tony-Sportswear-San-Salvador-61571308625133/'],
  ['tiktok','https://www.tiktok.com/embed/@tonysportswear']
 ]){
  const page=await browser.newPage({viewport:{width:1280,height:900},locale:'es-SV'});
  try{
   const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:35000});
   await page.locator('body').waitFor();
   await page.waitForTimeout(2200);
   const data=await page.evaluate(()=>({title:document.title,url:location.href,text:document.body.innerText.slice(0,18000),description:document.querySelector('meta[name="description"]')?.content,ogDescription:document.querySelector('meta[property="og:description"]')?.content}));
   results.push({name,status:response?.status(),...data});
   console.log(JSON.stringify(results.at(-1)));
  }catch(error){results.push({name,error:String(error)});console.log(JSON.stringify(results.at(-1)));}
  await page.close();
 }
 fs.writeFileSync('docs/reference/social-counts-2026-09-23.json',JSON.stringify(results,null,2));
 await browser.close();
})().catch(error=>{console.error(error);process.exitCode=1;});
