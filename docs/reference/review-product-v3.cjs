const {chromium}=require('@playwright/test');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:3000/producto',{waitUntil:'networkidle'});
  await page.screenshot({path:'docs/producto-desktop.png',fullPage:true,caret:'initial'});
  await page.getByRole('button',{name:'Producto',exact:true}).click();
  await page.screenshot({path:'docs/producto-menu-desktop.png',caret:'initial'});
  await page.locator('#tony-product-menu').getByRole('link',{name:'Logos 3D'}).click();
  await page.waitForTimeout(300);
  console.log('category-open',await page.locator('#categoria-logos-3d').getAttribute('open'));
  await page.getByRole('button',{name:'Para ti',exact:true}).focus();
  await page.keyboard.press('ArrowDown');
  console.log('keyboard-focus',await page.locator(':focus').innerText());
  await page.keyboard.press('Escape');
  console.log('escape-focus',await page.locator(':focus').innerText());
  for(const width of [320,390,768,1200,1440]){
    await page.setViewportSize({width,height:900});
    await page.goto('http://127.0.0.1:3000/producto',{waitUntil:'networkidle'});
    console.log('width',width,'scroll',await page.evaluate(()=>document.documentElement.scrollWidth));
    if(width===390){await page.screenshot({path:'docs/producto-mobile.png',fullPage:true,caret:'initial'});await page.getByRole('button',{name:'Abrir menú'}).click();await page.getByRole('button',{name:'02 Producto',exact:true}).click();await page.screenshot({path:'docs/producto-menu-mobile.png',caret:'initial'});await page.keyboard.press('Escape');}
  }
  console.log('errors',errors);
  await browser.close();
})();
